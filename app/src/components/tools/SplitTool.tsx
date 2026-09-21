"use client";

import { useState } from "react";
import JSZip from "jszip";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, Select, TextInput } from "@/components/ui";
import { baseName, formatBytes } from "@/lib/pdf/browser";
import { parseRanges, splitByGroups } from "@/lib/pdf/ops";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

export default function SplitTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [mode, setMode] = useState<"ranges" | "every">("ranges");
  const [ranges, setRanges] = useState("1-3, 4-");
  const [results, setResults] = useState<ResultFile[] | null>(null);
  const { busy, error, run } = useTask();

  if (results) {
    return <ResultPanel results={results} onReset={() => { setResults(null); reset(); }} />;
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

  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate font-medium">{pdf.file.name}</p>
          <p className="text-sm text-neutral-500">{pdf.pageCount} pages · {formatBytes(pdf.file.size)}</p>
        </div>
        <Button variant="ghost" onClick={reset}>Change file</Button>
      </Panel>
      <Panel className="space-y-4">
        <Field label="Split mode">
          <Select value={mode} onChange={(e) => setMode(e.target.value as "ranges" | "every")}>
            <option value="ranges">By page ranges</option>
            <option value="every">Every page as its own PDF</option>
          </Select>
        </Field>
        {mode === "ranges" && (
          <Field label="Page ranges" hint='Each comma-separated part becomes its own PDF. Example: "1-3, 5, 8-" gives three files.'>
            <TextInput value={ranges} onChange={(e) => setRanges(e.target.value)} placeholder="1-3, 4-" />
          </Field>
        )}
      </Panel>
      <ErrorMessage message={error} />
      <Button
        disabled={busy}
        onClick={() =>
          run(async () => {
            const groups =
              mode === "every"
                ? Array.from({ length: pdf.pageCount }, (_, i) => [i])
                : parseRanges(ranges, pdf.pageCount);
            const parts = await splitByGroups(pdf.bytes, groups);
            const files = parts.map((data, i) => ({
              data,
              filename: mode === "every" ? `${name}-page-${i + 1}.pdf` : `${name}-part-${i + 1}.pdf`,
            }));
            if (files.length > 3) {
              const zip = new JSZip();
              files.forEach((f) => zip.file(f.filename, f.data as Uint8Array));
              const blob = await zip.generateAsync({ type: "blob" });
              setResults([{ data: blob, filename: `${name}-split.zip`, mime: "application/zip" }]);
            } else {
              setResults(files);
            }
          })
        }
      >
        {busy ? "Splitting..." : "Split PDF"}
      </Button>
    </div>
  );
}
