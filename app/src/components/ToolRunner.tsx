"use client";

import type { ComponentType } from "react";
import type { ToolId } from "@/lib/tools";
import CompressTool from "./tools/CompressTool";
import ImagesToPdfTool from "./tools/ImagesToPdfTool";
import MergeTool from "./tools/MergeTool";
import MetadataTool from "./tools/MetadataTool";
import OrganizeTool from "./tools/OrganizeTool";
import PageNumbersTool from "./tools/PageNumbersTool";
import PdfToImagesTool from "./tools/PdfToImagesTool";
import RotateTool from "./tools/RotateTool";
import SplitTool from "./tools/SplitTool";
import WatermarkTool from "./tools/WatermarkTool";

const COMPONENTS: Record<ToolId, ComponentType> = {
  merge: MergeTool,
  split: SplitTool,
  rotate: RotateTool,
  organize: OrganizeTool,
  "images-to-pdf": ImagesToPdfTool,
  "pdf-to-images": PdfToImagesTool,
  watermark: WatermarkTool,
  "page-numbers": PageNumbersTool,
  compress: CompressTool,
  metadata: MetadataTool,
};

export default function ToolRunner({ id }: { id: ToolId }) {
  const Tool = COMPONENTS[id];
  return <Tool />;
}
