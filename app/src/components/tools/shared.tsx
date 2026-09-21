"use client";

import { useCallback, useState } from "react";
import { Button, Panel } from "@/components/ui";
import { downloadBlob, formatBytes, getPageCount, readFile } from "@/lib/pdf/browser";

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/encrypted/i.test(msg) || /PasswordException|No password given/i.test(msg)) {
    return "This PDF is password-protected. Remove the password first, then try again.";
  }
  if (/Invalid PDF|Failed to parse|InvalidPDFException|No PDF header/i.test(msg)) {
    return "This file could not be read as a PDF. It may be corrupted.";
  }
  return msg;
}

export function useTask() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}

export interface LoadedPdf {
  file: File;
  bytes: ArrayBuffer;
  pageCount: number;
}

export function usePdfFile() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const bytes = await readFile(file);
      const pageCount = await getPageCount(bytes);
      setPdf({ file, bytes, pageCount });
    } catch (e) {
      setPdf(null);
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return { pdf, loading, error, load, reset: () => setPdf(null) };
}

export interface ResultFile {
  data: Uint8Array | Blob;
  filename: string;
  mime?: string;
}

export function ResultPanel({
  results,
  originalSize,
  onReset,
}: {
  results: ResultFile[];
  originalSize?: number;
  onReset: () => void;
}) {
  const total = results.reduce((s, r) => s + (r.data instanceof Blob ? r.data.size : r.data.byteLength), 0);
  return (
    <Panel className="space-y-4 text-center">
      <p className="text-lg font-semibold">Done</p>
      <p className="text-sm text-neutral-500">
        {results.length === 1 ? results[0].filename : `${results.length} files`} · {formatBytes(total)}
        {originalSize
          ? total < originalSize
            ? ` (was ${formatBytes(originalSize)}, ${Math.round((1 - total / originalSize) * 100)}% smaller)`
            : ` (was ${formatBytes(originalSize)}, no reduction)`
          : ""}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {results.map((r) => (
          <Button key={r.filename} onClick={() => downloadBlob(r.data, r.filename, r.mime)}>
            Download {results.length > 1 ? r.filename : ""}
          </Button>
        ))}
        <Button variant="secondary" onClick={onReset}>
          Start over
        </Button>
      </div>
    </Panel>
  );
}
