"use client";

import { useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Panel } from "@/components/ui";
import { formatBytes, readFile } from "@/lib/pdf/browser";
import { mergePdfs } from "@/lib/pdf/ops";
import { ResultPanel, useTask, type ResultFile } from "./shared";

export default function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<ResultFile | null>(null);
  const { busy, error, run } = useTask();

  function move(i: number, dir: -1 | 1) {
    setFiles((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  if (result) {
    return <ResultPanel results={[result]} onReset={() => { setResult(null); setFiles([]); }} />;
  }

  return (
    <div className="space-y-4">
      <FileDropzone accept=".pdf,application/pdf" multiple onFiles={(f) => setFiles((p) => [...p, ...f])} label="Drop PDFs here or click to add" />
      {files.length > 0 && (
        <Panel className="space-y-2">
          <p className="text-sm text-neutral-500">Files are merged in this order.</p>
          <ol className="space-y-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <span className="w-6 text-sm text-neutral-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
                <span className="text-xs text-neutral-500">{formatBytes(f.size)}</span>
                <Button variant="ghost" className="!px-2 !py-1" aria-label={`Move ${f.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
                <Button variant="ghost" className="!px-2 !py-1" aria-label={`Move ${f.name} down`} disabled={i === files.length - 1} onClick={() => move(i, 1)}>↓</Button>
                <Button variant="ghost" className="!px-2 !py-1" aria-label={`Remove ${f.name}`} onClick={() => setFiles((p) => p.filter((_, k) => k !== i))}>✕</Button>
              </li>
            ))}
          </ol>
        </Panel>
      )}
      <ErrorMessage message={error} />
      <Button
        disabled={files.length < 2 || busy}
        onClick={() =>
          run(async () => {
            const buffers = await Promise.all(files.map(readFile));
            const data = await mergePdfs(buffers);
            setResult({ data, filename: "merged.pdf" });
          })
        }
      >
        {busy ? "Merging..." : files.length < 2 ? "Add at least 2 PDFs" : `Merge ${files.length} PDFs`}
      </Button>
    </div>
  );
}
