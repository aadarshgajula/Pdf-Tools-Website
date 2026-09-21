import Link from "next/link";
import type { ToolDef } from "@/lib/tools";
import { ToolIcon } from "./ui";

export default function ToolCard({ tool }: { tool: ToolDef }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-red-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40">
        <ToolIcon name={tool.icon} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold group-hover:text-red-600">{tool.name}</span>
        <span className="mt-0.5 block text-sm text-neutral-500">{tool.short}</span>
      </span>
    </Link>
  );
}
