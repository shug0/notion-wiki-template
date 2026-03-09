import type {
  BulletedListBlock,
  ExtendedRecordMap,
  NumberedListBlock,
} from "notion-types";
import { BlockChildren } from "../../lib/block-children";
import { getBlockContent } from "../../lib/conversion";
import { getNestedContentBorder } from "../../lib/styles";
import { TextRenderer } from "../../renderers/text";
import type { RichTextItem } from "../../types";
import { notionTokens } from "../../ui/design-system";

interface ListBlockProps {
  block: BulletedListBlock | NumberedListBlock;
  recordMap: ExtendedRecordMap;
  type: "bulleted_list_item" | "numbered_list_item" | "bulleted_list";
}

export function ListBlock({ block, recordMap, type }: ListBlockProps) {
  let content: RichTextItem[];
  if (type === "bulleted_list") {
    content = getBlockContent(block);
  } else if (type === "bulleted_list_item") {
    content = getBlockContent(block, "bulleted_list_item");
  } else {
    content = getBlockContent(block, "numbered_list_item");
  }

  return (
    <li className="list-none my-1 ml-4">
      <div className="flex items-start">
        <span className="mr-2 select-none text-muted-foreground">
          {type === "numbered_list_item" ? "1." : "•"}
        </span>
        <div className="flex-1">
          <div className={notionTokens.text.body}>
            <TextRenderer text={content} recordMap={recordMap} />
          </div>
          <BlockChildren
            block={block}
            recordMap={recordMap}
            className={getNestedContentBorder("mt-2")}
          />
        </div>
      </div>
    </li>
  );
}
