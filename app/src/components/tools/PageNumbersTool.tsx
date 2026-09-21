"use client";

import { useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, Select, TextInput } from "@/components/ui";
import { baseName, formatBytes } from "@/lib/pdf/browser";
import { addPageNumbers, type NumberPosition } from "@/lib/pdf/ops";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "top-left", label: "Top left" },
];

const FORMATS = ["{n}", "Page {n}", "Page {n} of {total}", "{n} / {total}", "- {n} -"];

export default function PageNumbersTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [position, setPosition] = useState<NumberPosition>("bottom-center");
  const [format, setFormat] = useState("Page {n} of {total}");
  const [start, setStart] = useState(1);
  const [fontSize, setFontSize] = useState(11);
  const [skipFirst, setSkipFirst] = useState(false);
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
        <Field label="Position">
          <Select value={position} onChange={(e) => setPosition(e.target.value as NumberPosition)}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Format" hint="Use {n} for the page number and {total} for the last number.">
          <TextInput list="pn-formats" value={format} onChange={(e) => setFormat(e.target.value)} />
          <datalist id="pn-formats">
            {FORMATS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Field>
        <Field label="Start at">
          <TextInput type="number" min={0} value={start} onChange={(e) => setStart(Math.max(0, Number(e.target.value) || 0))} />
        </Field>
        <Field label="Font size (pt)">
          <TextInput type="number" min={6} max={36} value={fontSize} onChange={(e) => setFontSize(Math.min(36, Math.max(6, Number(e.target.value) || 11)))} />
        </Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} className="accent-red-600" />
          Skip the first page (for cover pages)
        </label>
      </Panel>
      <ErrorMessage message={error} />
      <Button
        disabled={busy || !format.includes("{n}")}
        onClick={() =>
          run(async () => {
            const data = await addPageNumbers(pdf.bytes, { position, format, start, fontSize, skipFirst });
            setResult({ data, filename: `${baseName(pdf.file.name)}-numbered.pdf` });
          })
        }
      >
        {busy ? "Adding numbers..." : !format.includes("{n}") ? "Format needs {n}" : "Add page numbers"}
      </Button>
    </div>
  );
}
