"use client";

import { jpegPagesToPdf } from "./ops";

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

export function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return lib;
    });
  }
  return pdfjsPromise;
}

export function readFile(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

export function downloadBlob(data: Uint8Array | Blob, filename: string, mime = "application/pdf") {
  const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

// pdf.js transfers the buffer to its worker, so always hand it a copy.
async function openDoc(bytes: ArrayBuffer | Uint8Array) {
  const pdfjs = await getPdfJs();
  const copy = bytes instanceof Uint8Array ? bytes.slice() : new Uint8Array(bytes.slice(0));
  const task = pdfjs.getDocument({ data: copy });
  const doc = await task.promise;
  return { doc, close: () => task.destroy() };
}

export async function getPageCount(bytes: ArrayBuffer | Uint8Array): Promise<number> {
  const { doc, close } = await openDoc(bytes);
  const n = doc.numPages;
  await close();
  return n;
}

export async function renderThumbnails(
  bytes: ArrayBuffer | Uint8Array,
  maxWidth: number,
  onThumb: (index: number, dataUrl: string) => void,
  isCancelled: () => boolean = () => false,
): Promise<number> {
  const { doc, close } = await openDoc(bytes);
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      if (isCancelled()) break;
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: maxWidth / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      onThumb(i - 1, canvas.toDataURL("image/jpeg", 0.7));
      page.cleanup();
    }
    return doc.numPages;
  } finally {
    await close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas export failed"))), type, quality),
  );
}

export async function renderPagesToImages(
  bytes: ArrayBuffer | Uint8Array,
  format: "png" | "jpeg",
  scale: number,
  onProgress: (done: number, total: number) => void,
): Promise<Blob[]> {
  const { doc, close } = await openDoc(bytes);
  const out: Blob[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      if (format === "jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      await page.render({ canvas, viewport }).promise;
      out.push(await canvasToBlob(canvas, `image/${format}`, 0.92));
      page.cleanup();
      onProgress(i, doc.numPages);
    }
    return out;
  } finally {
    await close();
  }
}

export interface CompressLevel {
  scale: number; // render scale (1 = 72dpi, 2 = 144dpi)
  quality: number; // JPEG quality 0-1
}

export const COMPRESS_LEVELS: Record<"high" | "balanced" | "small", CompressLevel & { label: string }> = {
  high: { label: "High quality (about 200 dpi)", scale: 2.8, quality: 0.82 },
  balanced: { label: "Balanced (about 144 dpi)", scale: 2, quality: 0.7 },
  small: { label: "Smallest (about 100 dpi)", scale: 1.4, quality: 0.55 },
};

export async function compressPdf(
  bytes: ArrayBuffer | Uint8Array,
  level: CompressLevel,
  onProgress: (done: number, total: number) => void,
): Promise<Uint8Array> {
  const { doc, close } = await openDoc(bytes);
  const pages: { jpeg: Uint8Array; widthPt: number; heightPt: number }[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: level.scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, viewport }).promise;
      const blob = await canvasToBlob(canvas, "image/jpeg", level.quality);
      pages.push({
        jpeg: new Uint8Array(await blob.arrayBuffer()),
        widthPt: base.width,
        heightPt: base.height,
      });
      page.cleanup();
      onProgress(i, doc.numPages);
    }
  } finally {
    await close();
  }
  return jpegPagesToPdf(pages);
}

// pdf-lib only embeds JPEG/PNG; re-encode anything else (WEBP, GIF, BMP...) via canvas.
export async function toEmbeddableImage(
  file: File,
): Promise<{ bytes: Uint8Array; type: "jpg" | "png" }> {
  if (file.type === "image/jpeg") return { bytes: new Uint8Array(await file.arrayBuffer()), type: "jpg" };
  if (file.type === "image/png") return { bytes: new Uint8Array(await file.arrayBuffer()), type: "png" };
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvasToBlob(canvas, "image/png");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), type: "png" };
}
