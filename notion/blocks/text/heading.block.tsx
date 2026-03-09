import type {
  ExtendedRecordMap,
  HeaderBlock,
  SubHeaderBlock,
  SubSubHeaderBlock,
} from "notion-types";
import { cn } from "@/lib/utils";
import { getBlockContent } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";
import { notionTokens } from "../../ui/design-system";

interface HeadingBlockProps {
  block: HeaderBlock | SubHeaderBlock | SubSubHeaderBlock;
  recordMap: ExtendedRecordMap; // Kept for interface consistency across all blocks
  level: 1 | 2 | 3;
}

export function HeadingBlock({ block, recordMap, level }: HeadingBlockProps) {
  // Map block type to field name for modern format
  const fieldMap: Record<string, string> = {
    heading_1: "heading_1",
    heading_2: "heading_2",
    heading_3: "heading_3",
  };

  const fieldName = fieldMap[block.type];
  const content = getBlockContent(block, fieldName);

  // Semantically, heading_1 should be h2 if the Page Title is h1
  const semanticLevel = level + 1;
  const Tag = `h${semanticLevel}` as "h2" | "h3" | "h4";

  const classes = {
    2: notionTokens.text.heading1,
    3: notionTokens.text.heading2,
    4: notionTokens.text.heading3,
  };

  return (
    <Tag
      id={block.id}
      className={cn(classes[semanticLevel as keyof typeof classes])}
    >
      <TextRenderer text={content} recordMap={recordMap} />
    </Tag>
  );
}
