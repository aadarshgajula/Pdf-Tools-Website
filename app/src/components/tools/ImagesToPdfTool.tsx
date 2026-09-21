"use client";

import { useEffect, useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, Select, TextInput } from "@/components/ui";
import { toEmbeddableImage } from "@/lib/pdf/browser";
import { imagesToPdf, type PageSize } from "@/lib/pdf/ops";
import { ResultPanel, useTask, type ResultFile } from "./shared";

interface Item {
  id: number;
  file: File;
  url: string;
}

let nextId = 1;

export default function ImagesToPdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [landscape, setLandscape] = useState(false);
  const [margin, setMargin] = useState(24);
  const [result, setResult] = useState<ResultFile | null>(null);
  const { busy, error, run } = useTask();

  useEffect(() => () => items.forEach((i) => URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  function add(files: File[]) {
    setItems((prev) => [...prev, ...files.map((file) => ({ id: nextId++, file, url: URL.createObjectURL(file) }))]);
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(id: number) {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((i) => i.id !== id);
    });
  }

  if (result) {
    return <ResultPanel results={[result]} onReset={() => { setResult(null); setItems([]); }} />;
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onFiles={add} label="Drop images here or click to add" hint="JPG, PNG or WEBP. Files stay on your device." />
      {items.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it, i) => (
              <li key={it.id} className="rounded-xl border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.url} alt={it.file.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="min-w-0 truncate text-xs text-neutral-500">{i + 1}. {it.file.name}</span>
                  <div className="flex">
                    <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Move ${it.file.name} earlier`} disabled={i === 0} onClick={() => move(i, -1)}>←</Button>
                    <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Move ${it.file.name} later`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>→</Button>
                    <Button variant="ghost" className="!px-1.5 !py-1" aria-label={`Remove ${it.file.name}`} onClick={() => remove(it.id)}>✕</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Panel className="grid gap-4 sm:grid-cols-3">
            <Field label="Page size">
              <Select value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit to image</option>
              </Select>
            </Field>
            <Field label="Orientation">
              <Select value={landscape ? "l" : "p"} disabled={pageSize === "fit"} onChange={(e) => setLandscape(e.target.value === "l")}>
                <option value="p">Portrait</option>
                <option value="l">Landscape</option>
              </Select>
            </Field>
            <Field label="Margin (pt)">
              <TextInput type="number" min={0} max={200} value={margin} onChange={(e) => setMargin(Math.min(200, Math.max(0, Number(e.target.value) || 0)))} />
            </Field>
          </Panel>
        </>
      )}
      <ErrorMessage message={error} />
      <Button
        disabled={items.length === 0 || busy}
        onClick={() =>
          run(async () => {
            const images = [];
            for (const it of items) images.push(await toEmbeddableImage(it.file));
            const data = await imagesToPdf(images, { pageSize, margin, landscape });
            setResult({ data, filename: "images.pdf" });
          })
        }
      >
        {busy ? "Creating PDF..." : items.length === 0 ? "Add images to start" : `Create PDF from ${items.length} image${items.length > 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
