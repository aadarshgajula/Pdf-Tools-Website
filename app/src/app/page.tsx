import ToolCard from "@/components/ToolCard";
import { CATEGORIES, TOOLS, type ToolCategory } from "@/lib/tools";

export default function Home() {
  const categories = (Object.keys(CATEGORIES) as ToolCategory[]).filter((c) => TOOLS.some((t) => t.category === c));
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Free PDF tools that <span className="text-red-600">never upload your files</span>
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Merge, split, organize, watermark, compress and convert PDFs. Everything runs in your browser, so
          private documents stay private.
        </p>
      </section>
      <div id="tools" className="mt-14 space-y-10">
        {categories.map((c) => (
          <section key={c}>
            <h2 className="text-xl font-semibold">{CATEGORIES[c].label}</h2>
            <p className="mb-4 text-sm text-neutral-500">{CATEGORIES[c].blurb}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.filter((t) => t.category === c).map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
