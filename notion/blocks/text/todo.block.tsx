import type { ExtendedRecordMap, TodoBlock } from "notion-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { BlockChildren } from "../../lib/block-children";
import { getBlockContent } from "../../lib/conversion";
import { getNestedContentBorder } from "../../lib/styles";
import { TextRenderer } from "../../renderers/text";
import { notionTokens } from "../../ui/design-system";

interface ToDoBlockProps {
  block: TodoBlock;
  recordMap: ExtendedRecordMap;
}

export function ToDoBlock({ block, recordMap }: ToDoBlockProps) {
  const content = getBlockContent(block, "to_do");
  const checked = block?.properties?.checked?.[0]?.[0] === "Yes";

  return (
    <div className="flex flex-col gap-1 my-1">
      <div className="flex items-start gap-2 group">
        <div className="flex items-center h-7">
          <Checkbox
            id={block.id}
            checked={checked}
            className="w-4 h-4 rounded-sm border-2"
            disabled
          />
        </div>
        <Label
          htmlFor={block.id}
          className={cn(
            notionTokens.text.body,
            "font-normal cursor-pointer select-none",
            checked && "text-muted-foreground line-through decoration-1",
          )}
        >
          <TextRenderer text={content} recordMap={recordMap} />
        </Label>
      </div>

      <BlockChildren
        block={block}
        recordMap={recordMap}
        className={getNestedContentBorder("ml-2")}
      />
    </div>
  );
}
