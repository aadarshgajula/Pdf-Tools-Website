import { PDFDict, PDFDocument, PDFHexString, PDFName, StandardFonts, degrees, rgb } from "pdf-lib";

export async function loadPdf(bytes: ArrayBuffer | Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
}

export async function mergePdfs(files: ArrayBuffer[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const bytes of files) {
    const src = await loadPdf(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save({ useObjectStreams: true });
}

// "1-3, 5, 8-" -> [[0,1,2],[4],[7,8,...]] (0-based, one group per comma part)
export function parseRanges(input: string, total: number): number[][] {
  const groups: number[][] = [];
  for (const rawPart of input.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    let start: number;
    let end: number;
    if (m) {
      start = m[1] ? parseInt(m[1], 10) : 1;
      end = m[2] ? parseInt(m[2], 10) : total;
    } else if (/^\d+$/.test(part)) {
      start = end = parseInt(part, 10);
    } else {
      throw new Error(`Invalid range "${part}"`);
    }
    if (start < 1 || end < 1 || start > total || end > total) {
      throw new Error(`Range "${part}" is outside 1-${total}`);
    }
    if (start > end) throw new Error(`Range "${part}" is backwards`);
    const g: number[] = [];
    for (let i = start; i <= end; i++) g.push(i - 1);
    groups.push(g);
  }
  if (groups.length === 0) throw new Error("Enter at least one page range");
  return groups;
}

export async function extractPages(
  bytes: ArrayBuffer | Uint8Array,
  indices: number[],
): Promise<Uint8Array> {
  const src = await loadPdf(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save({ useObjectStreams: true });
}

export async function splitByGroups(
  bytes: ArrayBuffer | Uint8Array,
  groups: number[][],
): Promise<Uint8Array[]> {
  const results: Uint8Array[] = [];
  for (const g of groups) results.push(await extractPages(bytes, g));
  return results;
}

export interface PageEdit {
  index: number; // original page index
  rotation: number; // extra rotation in degrees, multiple of 90
}

export async function rebuildPages(
  bytes: ArrayBuffer | Uint8Array,
  edits: PageEdit[],
): Promise<Uint8Array> {
  const src = await loadPdf(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(
    src,
    edits.map((e) => e.index),
  );
  pages.forEach((p, i) => {
    const extra = edits[i].rotation;
    if (extra) p.setRotation(degrees((((p.getRotation().angle + extra) % 360) + 360) % 360));
    out.addPage(p);
  });
  return out.save({ useObjectStreams: true });
}

export async function rotatePdf(
  bytes: ArrayBuffer | Uint8Array,
  angle: number,
  pageIndices: number[] | null,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const target = new Set(pageIndices ?? doc.getPageIndices());
  doc.getPages().forEach((p, i) => {
    if (!target.has(i)) return;
    p.setRotation(degrees((((p.getRotation().angle + angle) % 360) + 360) % 360));
  });
  return doc.save({ useObjectStreams: true });
}

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number; // 0-1
  angle: number; // degrees
  color: string; // #rrggbb
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export async function addWatermark(
  bytes: ArrayBuffer | Uint8Array,
  opts: WatermarkOptions,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const baseWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
  const rad = (opts.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    // Shrink so the rotated text stays within 90% of the page along its own direction.
    const maxLen = Math.min(width / Math.max(Math.abs(cos), 1e-6), height / Math.max(Math.abs(sin), 1e-6)) * 0.9;
    const scale = Math.min(1, maxLen / baseWidth);
    const size = opts.fontSize * scale;
    const textWidth = baseWidth * scale;
    // Position so the text's center lands on the page center after rotation.
    const x = width / 2 - (textWidth / 2) * cos + (size / 3) * sin;
    const y = height / 2 - (textWidth / 2) * sin - (size / 3) * cos;
    page.drawText(opts.text, {
      x,
      y,
      size,
      font,
      color: hexToRgb(opts.color),
      opacity: opts.opacity,
      rotate: degrees(opts.angle),
    });
  }
  return doc.save({ useObjectStreams: true });
}

export type NumberPosition =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

export interface PageNumberOptions {
  position: NumberPosition;
  start: number;
  fontSize: number;
  format: string; // tokens: {n} {total}
  skipFirst: boolean;
}

export async function addPageNumbers(
  bytes: ArrayBuffer | Uint8Array,
  opts: PageNumberOptions,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const margin = 28;
  pages.forEach((page, i) => {
    if (opts.skipFirst && i === 0) return;
    const n = opts.start + (opts.skipFirst ? i - 1 : i);
    const label = opts.format
      .replaceAll("{n}", String(n))
      .replaceAll("{total}", String(opts.start + pages.length - 1 - (opts.skipFirst ? 1 : 0)));
    const { width, height } = page.getSize();
    const w = font.widthOfTextAtSize(label, opts.fontSize);
    const [v, h] = opts.position.split("-") as ["top" | "bottom", "left" | "center" | "right"];
    const x = h === "left" ? margin : h === "right" ? width - margin - w : (width - w) / 2;
    const y = v === "bottom" ? margin : height - margin - opts.fontSize;
    page.drawText(label, { x, y, size: opts.fontSize, font, color: rgb(0.2, 0.2, 0.2) });
  });
  return doc.save({ useObjectStreams: true });
}

// getInfoDict is public at runtime but marked private in pdf-lib's typings.
function infoDict(doc: PDFDocument): PDFDict {
  return (doc as unknown as { getInfoDict(): PDFDict }).getInfoDict();
}

export interface Metadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export async function readMetadata(bytes: ArrayBuffer | Uint8Array): Promise<Metadata> {
  const doc = await loadPdf(bytes);
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
  };
}

export async function writeMetadata(
  bytes: ArrayBuffer | Uint8Array,
  meta: Metadata,
): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  doc.setTitle(meta.title);
  doc.setAuthor(meta.author);
  doc.setSubject(meta.subject);
  // setKeywords() joins with spaces; write the raw string so commas survive a round trip.
  infoDict(doc).set(PDFName.of("Keywords"), PDFHexString.fromText(meta.keywords));
  doc.setCreator(meta.creator);
  doc.setProducer(meta.producer);
  return doc.save({ useObjectStreams: true });
}

export async function stripMetadata(bytes: ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  const doc = await loadPdf(bytes);
  const info = infoDict(doc);
  for (const key of info.keys()) info.delete(key);
  doc.catalog.delete(PDFName.of("Metadata"));
  return doc.save({ useObjectStreams: true });
}

export type PageSize = "fit" | "a4" | "letter";

export interface ImagesToPdfOptions {
  pageSize: PageSize;
  margin: number; // points
  landscape: boolean;
}

const PAGE_SIZES: Record<Exclude<PageSize, "fit">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

// Images must already be JPEG or PNG bytes (see toEmbeddableImage in browser.ts).
export async function imagesToPdf(
  images: { bytes: Uint8Array; type: "jpg" | "png" }[],
  opts: ImagesToPdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const img of images) {
    const embedded = img.type === "jpg" ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    if (opts.pageSize === "fit") {
      const page = doc.addPage([embedded.width + opts.margin * 2, embedded.height + opts.margin * 2]);
      page.drawImage(embedded, {
        x: opts.margin,
        y: opts.margin,
        width: embedded.width,
        height: embedded.height,
      });
      continue;
    }
    let [pw, ph] = PAGE_SIZES[opts.pageSize];
    if (opts.landscape) [pw, ph] = [ph, pw];
    const page = doc.addPage([pw, ph]);
    const maxW = pw - opts.margin * 2;
    const maxH = ph - opts.margin * 2;
    const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
    const w = embedded.width * scale;
    const h = embedded.height * scale;
    page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return doc.save({ useObjectStreams: true });
}

// Builds a PDF where each page is a JPEG at the given pixel size (used by compress).
export async function jpegPagesToPdf(
  pages: { jpeg: Uint8Array; widthPt: number; heightPt: number }[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const p of pages) {
    const img = await doc.embedJpg(p.jpeg);
    const page = doc.addPage([p.widthPt, p.heightPt]);
    page.drawImage(img, { x: 0, y: 0, width: p.widthPt, height: p.heightPt });
  }
  return doc.save({ useObjectStreams: true });
}
