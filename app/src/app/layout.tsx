import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PDF Toolkit - Free private PDF tools that run in your browser",
    template: "%s | PDF Toolkit",
  },
  description:
    "Merge, split, organize, watermark, compress and convert PDFs for free. Everything runs in your browser, so your files never leave your device.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm text-white">PDF</span>
              Toolkit
            </Link>
            <nav className="flex items-center gap-5 text-sm font-medium">
              <Link href="/#tools" className="hover:text-red-600">All tools</Link>
              <Link href="/privacy" className="hover:text-red-600">Privacy</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-200 py-6 text-center text-sm text-neutral-500 dark:border-neutral-800">
          Your files are processed locally in your browser and never uploaded.
        </footer>
      </body>
    </html>
  );
}
