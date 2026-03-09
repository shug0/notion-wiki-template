import type { Block, ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import { NotionBlockRenderer } from "../renderer";

interface BlockChildrenProps {
  block: Block;
  recordMap: ExtendedRecordMap;
  className?: string;
  asFragment?: boolean;
}

/**
 * Common component to render the children of a Notion block.
 * Encapsulates the standard pattern of checking for content and mapping through children IDs.
 * Pass `asFragment` to skip the wrapper div (e.g. when the parent manages layout itself).
 */
export function BlockChildren({
  block,
  recordMap,
  className,
  asFragment = false,
}: BlockChildrenProps) {
  const childrenIds = block?.content;

  if (!childrenIds || childrenIds?.length === 0) {
    return null;
  }

  const children = childrenIds.map((childId: string) => (
    <NotionBlockRenderer
      key={childId}
      blockId={childId}
      recordMap={recordMap}
    />
  ));

  if (asFragment) {
    return <>{children}</>;
  }

  return (
    <div className={cn("w-full notion-blocks", className)}>{children}</div>
  );
}
