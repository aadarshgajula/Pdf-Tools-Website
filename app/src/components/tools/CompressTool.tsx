"use client";

import { useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, ProgressBar, Select } from "@/components/ui";
import { baseName, COMPRESS_LEVELS, compressPdf, formatBytes } from "@/lib/pdf/browser";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

export default function CompressTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [level, setLevel] = useState<keyof typeof COMPRESS_LEVELS>("balanced");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ResultFile | null>(null);
  const { busy, error, run } = useTask();

  if (result && pdf) {
    return (
      <ResultPanel
        results={[result]}
        originalSize={pdf.file.size}
        onReset={() => { setResult(null); reset(); }}
      />
    );
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

  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{pdf.file.name}</p>
          <p className="text-sm text-neutral-500">{pdf.pageCount} pages · {formatBytes(pdf.file.size)}</p>
        </div>
        <Button variant="ghost" onClick={reset} disabled={busy}>Change file</Button>
      </Panel>
      <Panel className="space-y-3">
        <Field label="Compression level">
          <Select value={level} onChange={(e) => setLevel(e.target.value as keyof typeof COMPRESS_LEVELS)} disabled={busy}>
            {Object.entries(COMPRESS_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>
        <p className="text-sm text-neutral-500">
          Pages are re-rendered as images, so text will no longer be selectable or searchable. This works best on
          scanned or photo-heavy PDFs. Text-based PDFs may get larger, and if so you should keep the original.
        </p>
      </Panel>
      {busy && (
        <div className="space-y-1">
          <ProgressBar done={progress.done} total={progress.total} />
          <p className="text-xs text-neutral-500">Page {progress.done} of {progress.total}</p>
        </div>
      )}
      <ErrorMessage message={error} />
      <Button
        disabled={busy}
        onClick={() =>
          run(async () => {
            setProgress({ done: 0, total: pdf.pageCount });
            const data = await compressPdf(pdf.bytes, COMPRESS_LEVELS[level], (done, total) => setProgress({ done, total }));
            setResult({ data, filename: `${baseName(pdf.file.name)}-compressed.pdf` });
          })
        }
      >
        {busy ? "Compressing..." : "Compress PDF"}
      </Button>
    </div>
  );
}
