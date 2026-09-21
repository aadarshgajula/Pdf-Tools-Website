"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
    secondary:
      "border border-neutral-300 bg-white hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800 disabled:opacity-50",
    ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
      {message}
    </p>
  );
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-red-600 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// Maps a tool's `icon` key to a simple inline SVG.
export function ToolIcon({ name, size = 24 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    merge: <path d="M6 4v6a4 4 0 004 4h8m0 0l-3-3m3 3l-3 3M6 20v-2" />,
    split: <path d="M12 3v6m0 0l-5 5v6m5-11l5 5v6" />,
    grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
    rotate: <path d="M20 12a8 8 0 11-2.3-5.7M20 4v5h-5" />,
    stamp: <path d="M8 21h8M12 17v4M7 17h10a2 2 0 002-2 4 4 0 00-4-4V7a3 3 0 10-6 0v4a4 4 0 00-4 4 2 2 0 002 2z" />,
    hash: <path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16" />,
    tag: <path d="M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01" />,
    compress: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
    image: <path d="M4 5h16v14H4zM4 16l4-4 4 4 3-3 5 5M9 9.5h.01" />,
    "image-down": <path d="M4 5h16v9M4 5v14h9M4 16l4-4 3 3M16 16v5m0 0l-2-2m2 2l2-2" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name] ?? paths.grid}
    </svg>
  );
}
