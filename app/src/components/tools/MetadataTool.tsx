"use client";

import { useEffect, useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, TextInput } from "@/components/ui";
import { baseName, formatBytes } from "@/lib/pdf/browser";
import { readMetadata, stripMetadata, writeMetadata, type Metadata } from "@/lib/pdf/ops";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

const EMPTY: Metadata = { title: "", author: "", subject: "", keywords: "", creator: "", producer: "" };

const FIELDS: { key: keyof Metadata; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "subject", label: "Subject" },
  { key: "keywords", label: "Keywords (comma-separated)" },
  { key: "creator", label: "Creator" },
  { key: "producer", label: "Producer" },
];

export default function MetadataTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [meta, setMeta] = useState<Metadata>(EMPTY);
  const [result, setResult] = useState<ResultFile | null>(null);
  const { busy, error, run } = useTask();

  useEffect(() => {
    if (!pdf) return;
    readMetadata(pdf.bytes).then(setMeta).catch(() => setMeta(EMPTY));
  }, [pdf]);

  if (result) {
    return <ResultPanel results={[result]} onReset={() => { setResult(null); reset(); }} />;
  }
  if (!pdf) {
    return (
      <div className="space-y-3">
        <FileDropzone accept=".pdf,application/pdf" onFiles={(f) => load(f[0])} />
        {loading && <p className="text-sm text-neutral-500">Reading PDF...</p>}
        <ErrorMessage message={loadError} />
      </div>
    );
  }

  async function save(strip: boolean) {
    if (!pdf) return;
    const data = strip ? await stripMetadata(pdf.bytes) : await writeMetadata(pdf.bytes, meta);
    setResult({ data, filename: `${baseName(pdf.file.name)}-${strip ? "clean" : "metadata"}.pdf` });
  }

  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{pdf.file.name}</p>
          <p className="text-sm text-neutral-500">{pdf.pageCount} pages · {formatBytes(pdf.file.size)}</p>
        </div>
        <Button variant="ghost" onClick={reset}>Change file</Button>
      </Panel>
      <Panel className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <TextInput value={meta[f.key]} onChange={(e) => setMeta((m) => ({ ...m, [f.key]: e.target.value }))} />
          </Field>
        ))}
      </Panel>
      <ErrorMessage message={error} />
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={() => run(() => save(false))}>
          {busy ? "Saving..." : "Save changes"}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => run(() => save(true))}>
          Strip all metadata
        </Button>
      </div>
    </div>
  );
}
