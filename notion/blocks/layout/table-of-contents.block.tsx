import type { Block, ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import { getBlockContent } from "../../lib/conversion";
import { getBlockData } from "../../lib/notion-compat";

const HEADING_TYPES = new Set([
  "header",
  "sub_header",
  "sub_sub_header",
  "heading_1",
  "heading_2",
  "heading_3",
]);

function headingLevel(type: string): 1 | 2 | 3 {
  if (type === "header" || type === "heading_1") return 1;
  if (type === "sub_header" || type === "heading_2") return 2;
  return 3;
}

function headingText(block: Block): string {
  const fieldMap: Record<string, string> = {
    heading_1: "heading_1",
    heading_2: "heading_2",
    heading_3: "heading_3",
  };
  const content = getBlockContent(block, fieldMap[block.type] ?? "");
  return content.map((t) => t.plain_text).join("");
}

interface TableOfContentsBlockProps {
  block: Block;
  recordMap: ExtendedRecordMap;
}

export function TableOfContentsBlock({
  block,
  recordMap,
}: TableOfContentsBlockProps) {
  const parentBlock = getBlockData(recordMap, block.parent_id);
  const childIds =
    (parentBlock as { content?: string[] } | undefined)?.content ?? [];

  const headings = childIds
    .map((id) => getBlockData(recordMap, id))
    .filter((b): b is Block => !!b && HEADING_TYPES.has(b.type));

  if (headings.length === 0) return null;

  const color = (block.format as Record<string, unknown> | undefined)
    ?.block_color as string | undefined;

  return (
    <nav
      className={cn(
        "my-4 text-sm border-l-2 border-border pl-4 space-y-1",
        "xl:float-left xl:sticky xl:top-8 xl:w-56 xl:-ml-72 xl:my-0 xl:mb-4",
        color === "gray" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Table des matières
      </p>
      {headings.map((h) => {
        const level = headingLevel(h.type);
        return (
          <div
            key={h.id}
            className={cn(level === 2 && "pl-4", level === 3 && "pl-8")}
          >
            <a href={`#${h.id}`} className="hover:underline underline-offset-2">
              {headingText(h)}
            </a>
          </div>
        );
      })}
    </nav>
  );
}
