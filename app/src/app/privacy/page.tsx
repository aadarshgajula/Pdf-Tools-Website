import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How PDF Toolkit handles your files: locally in your browser, never uploaded.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
      <div className="mt-6 space-y-4 text-neutral-700 dark:text-neutral-300">
        <p>
          Every tool on this site runs entirely in your browser using JavaScript and WebAssembly. When you select a
          file, it is read into your device&apos;s memory, processed there, and the result is handed back to you as a
          download. The file is never sent to a server.
        </p>
        <p>
          You can confirm this yourself: open your browser&apos;s network inspector while using any tool and you will
          see no upload requests.
        </p>
        <p>
          This site does not require an account and does not store your documents. Closing or reloading the tab clears
          everything.
        </p>
      </div>
    </div>
  );
}
