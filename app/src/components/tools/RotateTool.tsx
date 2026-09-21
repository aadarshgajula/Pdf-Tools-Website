"use client";

import { useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, Select, TextInput } from "@/components/ui";
import { baseName, formatBytes } from "@/lib/pdf/browser";
import { parseRanges, rotatePdf } from "@/lib/pdf/ops";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

export default function RotateTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [angle, setAngle] = useState(90);
  const [scope, setScope] = useState<"all" | "some">("all");
  const [pageSpec, setPageSpec] = useState("1");
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
        <Field label="Rotation">
          <Select value={angle} onChange={(e) => setAngle(Number(e.target.value))}>
            <option value={90}>90° clockwise</option>
            <option value={180}>180°</option>
            <option value={270}>90° counter-clockwise</option>
          </Select>
        </Field>
        <Field label="Pages">
          <Select value={scope} onChange={(e) => setScope(e.target.value as "all" | "some")}>
            <option value="all">All pages</option>
            <option value="some">Selected pages</option>
          </Select>
        </Field>
        {scope === "some" && (
          <div className="sm:col-span-2">
            <Field label="Which pages" hint='Example: "1, 3-5, 9-"'>
              <TextInput value={pageSpec} onChange={(e) => setPageSpec(e.target.value)} />
            </Field>
          </div>
        )}
      </Panel>
      <ErrorMessage message={error} />
      <Button
        disabled={busy}
        onClick={() =>
          run(async () => {
            const indices = scope === "all" ? null : parseRanges(pageSpec, pdf.pageCount).flat();
            const data = await rotatePdf(pdf.bytes, angle, indices);
            setResult({ data, filename: `${baseName(pdf.file.name)}-rotated.pdf` });
          })
        }
      >
        {busy ? "Rotating..." : "Rotate PDF"}
      </Button>
    </div>
  );
}
