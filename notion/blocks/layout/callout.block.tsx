import type {
  CalloutBlock as CalloutBlockType,
  ExtendedRecordMap,
} from "notion-types";
import { cn } from "@/lib/utils";
import { BlockChildren } from "../../lib/block-children";
import { getBlockContent } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";
import type { NotionIconType } from "../../types";
import { type CalloutColor, calloutVariants } from "../../ui/design-system";
import { NotionIcon } from "../../ui/icon";

interface CalloutBlockProps {
  block: CalloutBlockType;
  recordMap: ExtendedRecordMap;
}

const normalizeCalloutColor = (color: string): CalloutColor => {
  const normalized = color.replace("_background", "");
  const validColors: CalloutColor[] = [
    "gray",
    "brown",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "pink",
    "red",
  ];
  return validColors.includes(normalized as CalloutColor)
    ? (normalized as CalloutColor)
    : "gray";
};

export function CalloutBlock({ block, recordMap }: CalloutBlockProps) {
  const format = block.format || {
    page_icon: "💡",
    block_color: "gray_background",
  };
  const icon = format.page_icon as NotionIconType;
  const color = format.block_color || "gray_background";
  const content = getBlockContent(block);
  const hasChildren = block.content && block.content.length > 0;
  const normalizedColor = normalizeCalloutColor(color);

  return (
    <div
      className={cn(
        calloutVariants({ color: normalizedColor }),
        "notion-visual",
      )}
    >
      <div className="flex-shrink-0">
        <NotionIcon
          icon={icon}
          block={block}
          recordMap={recordMap}
          size="2xl"
          fallback={<span>💡</span>}
        />
      </div>
      <div className="flex-1 min-w-0">
        {content && content.length > 0 && (
          <div>
            <TextRenderer text={content} recordMap={recordMap} />
          </div>
        )}
        {hasChildren && (
          <BlockChildren
            block={block}
            recordMap={recordMap}
            className={content && content.length > 0 ? "mt-2" : undefined}
          />
        )}
      </div>
    </div>
  );
}
