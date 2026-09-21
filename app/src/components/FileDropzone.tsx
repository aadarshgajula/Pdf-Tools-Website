"use client";

import { useRef, useState } from "react";

interface Props {
  accept: string;
  multiple?: boolean;
  label?: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}

function matches(file: File, accept: string): boolean {
  const rules = accept.split(",").map((s) => s.trim().toLowerCase());
  const name = file.name.toLowerCase();
  return rules.some((r) =>
    r.startsWith(".") ? name.endsWith(r) : r.endsWith("/*") ? file.type.startsWith(r.slice(0, -1)) : file.type === r,
  );
}

export default function FileDropzone({ accept, multiple, label, hint, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState(false);

  function handle(list: FileList | null) {
    if (!list) return;
    const all = Array.from(list);
    const ok = all.filter((f) => matches(f, accept));
    setRejected(ok.length < all.length);
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1));
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
          over
            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
            : "border-neutral-300 hover:border-red-400 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        }`}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-lg font-semibold">{label ?? (multiple ? "Drop files here or click to browse" : "Drop a file here or click to browse")}</p>
        <p className="text-sm text-neutral-500">{hint ?? "Files stay on your device. Nothing is uploaded."}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {rejected && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          Some files were skipped because they are not a supported type ({accept}).
        </p>
      )}
    </div>
  );
}
