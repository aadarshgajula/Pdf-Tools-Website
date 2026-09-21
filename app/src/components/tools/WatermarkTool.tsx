"use client";

import { useState } from "react";
import FileDropzone from "@/components/FileDropzone";
import { Button, ErrorMessage, Field, Panel, TextInput } from "@/components/ui";
import { baseName, formatBytes } from "@/lib/pdf/browser";
import { addWatermark } from "@/lib/pdf/ops";
import { ResultPanel, useTask, usePdfFile, type ResultFile } from "./shared";

export default function WatermarkTool() {
  const { pdf, loading, error: loadError, load, reset } = usePdfFile();
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(64);
  const [opacity, setOpacity] = useState(0.25);
  const [angle, setAngle] = useState(45);
  const [color, setColor] = useState("#dc2626");
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
        <div className="sm:col-span-2">
          <Field label="Watermark text" hint="Latin characters only (standard PDF font).">
            <TextInput value={text} onChange={(e) => setText(e.target.value)} maxLength={60} />
          </Field>
        </div>
        <Field label={`Font size: ${fontSize}pt`}>
          <input type="range" min={12} max={160} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-red-600" />
        </Field>
        <Field label={`Opacity: ${Math.round(opacity * 100)}%`}>
          <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-red-600" />
        </Field>
        <Field label={`Angle: ${angle}°`}>
          <input type="range" min={-90} max={90} value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full accent-red-600" />
        </Field>
        <Field label="Color">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-neutral-300 bg-transparent dark:border-neutral-700" />
        </Field>
      </Panel>
      <ErrorMessage message={error} />
      <Button
        disabled={busy || !text.trim()}
        onClick={() =>
          run(async () => {
            const data = await addWatermark(pdf.bytes, { text: text.trim(), fontSize, opacity, angle, color });
            setResult({ data, filename: `${baseName(pdf.file.name)}-watermarked.pdf` });
          })
        }
      >
        {busy ? "Adding watermark..." : "Add watermark"}
      </Button>
    </div>
  );
}
