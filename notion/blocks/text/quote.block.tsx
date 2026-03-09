import type {
  ExtendedRecordMap,
  QuoteBlock as QuoteBlockType,
} from "notion-types";
import { cn } from "@/lib/utils";
import { BlockChildren } from "../../lib/block-children";
import { getBlockContent } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";
import { notionTokens } from "../../ui/design-system";

interface QuoteBlockProps {
  block: QuoteBlockType;
  recordMap: ExtendedRecordMap;
}

export function QuoteBlock({ block, recordMap }: QuoteBlockProps) {
  const content = getBlockContent(block, "quote");
  const hasChildren = block.content?.length && block.content.length > 0;

  return (
    <blockquote
      className={cn(notionTokens.borders.quote, "pl-6 italic notion-visual")}
    >
      <TextRenderer text={content} recordMap={recordMap} />
      {hasChildren && (
        <div className="mt-2 not-italic">
          <BlockChildren block={block} recordMap={recordMap} />
        </div>
      )}
    </blockquote>
  );
}
