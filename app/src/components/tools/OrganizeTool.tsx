"use client";

import { useEffect, useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage } from "@/components/ui";
import { baseName, renderThumbnails } from "@/lib/pdf/browser";
import { rebuildPages } from "@/lib/pdf/ops";
import { ResultPanel, useTask, usePdfFile, type LoadedPdf, type ResultFile } from "./shared";

interface PageItem {
  index: number;
  rotation: number;
}

export default function OrganizeTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  if (!pdf) {
    return (
      <div className="space-y-3">
        <FileDropzone accept=".pdf,application/pdf" onFiles={(f) => load(f[0])} />
        {loading && <p className="text-sm text-neutral-500">Reading PDF...</p>}
        <ErrorMessage message={loadError} />
      </div>
    );
  }
  return <OrganizeEditor key={`${pdf.file.name}-${pdf.file.lastModified}-${pdf.file.size}`} pdf={pdf} onReset={reset} />;
}

function OrganizeEditor({ pdf, onReset }: { pdf: LoadedPdf; onReset: () => void }) {
  const [pages, setPages] = useState<PageItem[]>(() =>
    Array.from({ length: pdf.pageCount }, (_, index) => ({ index, rotation: 0 })),
  );
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [result, setResult] = useState<ResultFile | null>(null);
  const { busy, error, run } = useTask();

  useEffect(() => {
    let cancelled = false;
    renderThumbnails(
      pdf.bytes,
      200,
      (i, url) => setThumbs((t) => ({ ...t, [i]: url })),
      () => cancelled,
    ).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdf]);

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= pages.length) return;
    setPages((prev) => {
      const next = prev.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function rotate(pos: number, delta: number) {
    setPages((prev) => prev.map((p, i) => (i === pos ? { ...p, rotation: (p.rotation + delta + 360) % 360 } : p)));
  }

  if (result) {
    return <ResultPanel results={[result]} onReset={onReset} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-500">
          {pages.length} of {pdf.pageCount} pages kept. Drag to reorder, or use the arrows.
        </p>
        <Button variant="ghost" onClick={onReset}>Change file</Button>
      </div>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {pages.map((p, pos) => (
          <li
            key={p.index}
            draggable
            onDragStart={() => setDragFrom(pos)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom !== null) reorder(dragFrom, pos);
              setDragFrom(null);
            }}
            onDragEnd={() => setDragFrom(null)}
            className={`group rounded-xl border bg-white p-2 dark:bg-neutral-900 ${
              dragFrom === pos ? "border-red-500 opacity-50" : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {thumbs[p.index] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbs[p.index]}
                  alt={`Page ${p.index + 1}`}
                  draggable={false}
                  className="max-h-full max-w-full object-contain transition-transform"
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                />
              ) : (
                <span className="text-xs text-neutral-400">Loading...</span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Page {p.index + 1}</span>
              <div className="flex">
                <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Move page ${p.index + 1} earlier`} disabled={pos === 0} onClick={() => reorder(pos, pos - 1)}>←</Button>
                <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Move page ${p.index + 1} later`} disabled={pos === pages.length - 1} onClick={() => reorder(pos, pos + 1)}>→</Button>
                <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Rotate page ${p.index + 1}`} onClick={() => rotate(pos, 90)}>↻</Button>
                <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Delete page ${p.index + 1}`} onClick={() => setPages((prev) => prev.filter((_, i) => i !== pos))}>✕</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ErrorMessage message={error} />
      <Button
        disabled={busy || pages.length === 0}
        onClick={() =>
          run(async () => {
            const data = await rebuildPages(pdf.bytes, pages.map((p) => ({ index: p.index, rotation: p.rotation })));
            setResult({ data, filename: `${baseName(pdf.file.name)}-organized.pdf` });
          })
        }
      >
        {busy ? "Saving..." : pages.length === 0 ? "No pages left" : "Save PDF"}
      </Button>
    </div>
  );
}
