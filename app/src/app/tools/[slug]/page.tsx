import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolCard from "@/components/ToolCard";
import ToolRunner from "@/components/ToolRunner";
import { getToolBySlug, TOOLS } from "@/lib/tools";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.description };
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();
  const related = TOOLS.filter((t) => t.id !== tool.id && t.category === tool.category).slice(0, 3);
  const others = related.length ? related : TOOLS.filter((t) => t.id !== tool.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/#tools" className="text-sm text-neutral-500 hover:text-red-600">← All tools</Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{tool.name}</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">{tool.description}</p>
      <div className="mt-8">
        <ToolRunner id={tool.id} />
      </div>
      <section className="mt-16">
        <h2 className="mb-4 text-lg font-semibold">More tools</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {others.map((t) => (
            <ToolCard key={t.id} tool={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
