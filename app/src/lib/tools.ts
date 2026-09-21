export type ToolCategory = "organize" | "edit" | "optimize" | "convert" | "security";

export type ToolId =
  | "merge"
  | "split"
  | "rotate"
  | "organize"
  | "images-to-pdf"
  | "pdf-to-images"
  | "watermark"
  | "page-numbers"
  | "compress"
  | "metadata";

export interface ToolDef {
  id: ToolId;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: ToolCategory;
  icon: string;
}

export const CATEGORIES: Record<ToolCategory, { label: string; blurb: string }> = {
  organize: { label: "Organize", blurb: "Merge, split, reorder and clean up pages." },
  edit: { label: "Edit", blurb: "Add watermarks, page numbers and metadata." },
  optimize: { label: "Optimize", blurb: "Shrink file size for sharing and email." },
  convert: { label: "Convert", blurb: "Move between PDF and image formats." },
  security: { label: "Security", blurb: "Protect and sanitize your documents." },
};

export const TOOLS: ToolDef[] = [
  {
    id: "merge",
    slug: "merge-pdf",
    name: "Merge PDF",
    short: "Combine several PDFs into one.",
    description:
      "Merge multiple PDF files into a single document. Reorder the files before combining. Runs entirely in your browser.",
    category: "organize",
    icon: "merge",
  },
  {
    id: "split",
    slug: "split-pdf",
    name: "Split PDF",
    short: "Split by page ranges or into single pages.",
    description:
      "Split a PDF into separate files by page ranges, or export every page as its own PDF. Runs entirely in your browser.",
    category: "organize",
    icon: "split",
  },
  {
    id: "organize",
    slug: "organize-pdf",
    name: "Organize Pages",
    short: "Reorder, delete and rotate pages visually.",
    description:
      "See every page as a thumbnail, then drag to reorder, delete or rotate pages before saving a new PDF.",
    category: "organize",
    icon: "grid",
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    name: "Rotate PDF",
    short: "Rotate all or selected pages.",
    description: "Rotate every page, or only the pages you choose, by 90, 180 or 270 degrees.",
    category: "organize",
    icon: "rotate",
  },
  {
    id: "watermark",
    slug: "watermark-pdf",
    name: "Add Watermark",
    short: "Stamp text across every page.",
    description:
      "Add a text watermark to every page with custom size, color, opacity and angle. Runs entirely in your browser.",
    category: "edit",
    icon: "stamp",
  },
  {
    id: "page-numbers",
    slug: "page-numbers-pdf",
    name: "Add Page Numbers",
    short: "Number pages with custom position and format.",
    description:
      "Add page numbers to a PDF. Choose position, starting number, font size and format such as 'Page 1 of 10'.",
    category: "edit",
    icon: "hash",
  },
  {
    id: "metadata",
    slug: "edit-pdf-metadata",
    name: "Edit Metadata",
    short: "View and change title, author and more.",
    description:
      "Read and edit a PDF's title, author, subject and keywords, or strip them all for privacy.",
    category: "security",
    icon: "tag",
  },
  {
    id: "compress",
    slug: "compress-pdf",
    name: "Compress PDF",
    short: "Reduce file size of scanned or image-heavy PDFs.",
    description:
      "Shrink PDFs by re-rendering pages as compressed images. Best for scans and photo-heavy files; text becomes non-selectable.",
    category: "optimize",
    icon: "compress",
  },
  {
    id: "images-to-pdf",
    slug: "images-to-pdf",
    name: "Images to PDF",
    short: "Turn JPG, PNG and WEBP into a PDF.",
    description:
      "Combine JPG, PNG or WEBP images into one PDF with your choice of page size and margins.",
    category: "convert",
    icon: "image",
  },
  {
    id: "pdf-to-images",
    slug: "pdf-to-images",
    name: "PDF to Images",
    short: "Export every page as PNG or JPG.",
    description: "Render each page of a PDF to a PNG or JPG image and download them as a ZIP.",
    category: "convert",
    icon: "image-down",
  },
];

export function getToolBySlug(slug: string): ToolDef | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
