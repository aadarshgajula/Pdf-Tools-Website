"use client";

import { useState } from "react";
import JSZip from "jszip";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, ProgressBar, Select } from "@/components/ui";
import { baseName, formatBytes, renderPagesToImages } from "@/lib/pdf/browser";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

export default function PdfToImagesTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [scale, setScale] = useState(2);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ResultFile | null>(null);
  const { busy, error, run } = useTask();

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

  const name = baseName(pdf.file.name);
  const ext = format === "jpeg" ? "jpg" : "png";

  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{pdf.file.name}</p>
          <p className="text-sm text-neutral-500">{pdf.pageCount} pages · {formatBytes(pdf.file.size)}</p>
        </div>
        <Button variant="ghost" onClick={reset} disabled={busy}>Change file</Button>
      </Panel>
      <Panel className="grid gap-4 sm:grid-cols-2">
        <Field label="Format">
          <Select value={format} onChange={(e) => setFormat(e.target.value as "png" | "jpeg")} disabled={busy}>
            <option value="png">PNG (lossless)</option>
            <option value="jpeg">JPG (smaller)</option>
          </Select>
        </Field>
        <Field label="Resolution">
          <Select value={scale} onChange={(e) => setScale(Number(e.target.value))} disabled={busy}>
            <option value={1.4}>Low (about 100 dpi)</option>
            <option value={2}>Medium (144 dpi)</option>
            <option value={3}>High (216 dpi)</option>
            <option value={4}>Very high (288 dpi)</option>
          </Select>
        </Field>
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
            const blobs = await renderPagesToImages(pdf.bytes, format, scale, (done, total) => setProgress({ done, total }));
            if (blobs.length === 1) {
              setResult({ data: blobs[0], filename: `${name}.${ext}`, mime: `image/${format}` });
              return;
            }
            const zip = new JSZip();
            const pad = String(blobs.length).length;
            blobs.forEach((b, i) => zip.file(`${name}-page-${String(i + 1).padStart(pad, "0")}.${ext}`, b));
            const data = await zip.generateAsync({ type: "blob" });
            setResult({ data, filename: `${name}-images.zip`, mime: "application/zip" });
          })
        }
      >
        {busy ? "Rendering..." : "Convert to images"}
      </Button>
    </div>
  );
}
