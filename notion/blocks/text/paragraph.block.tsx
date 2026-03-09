import type { ExtendedRecordMap, TextBlock } from "notion-types";
import { cn } from "@/lib/utils";
import { BlockChildren } from "../../lib/block-children";
import { getBlockContent } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";
import { notionTokens } from "../../ui/design-system";

interface ParagraphBlockProps {
  block: TextBlock;
  recordMap: ExtendedRecordMap;
}

export function ParagraphBlock({ block, recordMap }: ParagraphBlockProps) {
  const content = getBlockContent(block, "paragraph");
  const isEmpty =
    content.length === 0 ||
    (content.length === 1 && content[0]?.plain_text === "");

  const hasChildren = block.content && block.content.length > 0;

  if (isEmpty) {
    // Empty paragraph = spacer, but still render children if any (indented)
    return (
      <>
        <div className="h-4" />
        {hasChildren && (
          <BlockChildren
            block={block}
            recordMap={recordMap}
            className={notionTokens.spacing.nestedContent}
          />
        )}
      </>
    );
  }

  return (
    <div className={cn(notionTokens.text.body)}>
      <p>
        <TextRenderer text={content} recordMap={recordMap} />
      </p>
      <BlockChildren
        block={block}
        recordMap={recordMap}
        className={cn(notionTokens.spacing.nestedContent, "mt-2")}
      />
    </div>
  );
}
