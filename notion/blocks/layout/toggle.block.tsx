"use client";
import { IconChevronRight } from "@tabler/icons-react";
import type {
  ExtendedRecordMap,
  ToggleBlock as ToggleBlockType,
} from "notion-types";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BlockChildren } from "../../lib/block-children";
import { getBlockContent } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";

interface ToggleBlockProps {
  block: ToggleBlockType;
  recordMap: ExtendedRecordMap;
}

export function ToggleBlock({ block, recordMap }: ToggleBlockProps) {
  // Extract content using centralized conversion helper
  const content = getBlockContent(block, "toggle");
  const hasChildren = block.content?.length && block.content.length > 0;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2 notion-visual"
    >
      <CollapsibleTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 font-medium rounded-lg transition-colors px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 touch-manipulation",
              isOpen && "bg-muted/50",
            )}
          >
            <IconChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground",
                isOpen && "rotate-90 text-foreground",
              )}
            />
            <TextRenderer text={content} recordMap={recordMap} />
          </button>
        }
      />
      <CollapsibleContent className="pl-6">
        {hasChildren && <BlockChildren block={block} recordMap={recordMap} />}
      </CollapsibleContent>
    </Collapsible>
  );
}
