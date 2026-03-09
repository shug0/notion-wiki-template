import { IconDatabase } from "@tabler/icons-react";
import type { Block, ExtendedRecordMap } from "notion-types";
import type { NotionIconType } from "../types";
import { NotionIcon } from "./icon";

interface PageTitleRowProps {
  title: string;
  icon?: NotionIconType;
  block: Block;
  recordMap: ExtendedRecordMap;
}

export function PageTitleRow({
  title,
  icon,
  block,
  recordMap,
}: PageTitleRowProps) {
  return (
    <div className="flex items-center gap-3 mb-8 min-w-0">
      {icon ? (
        <NotionIcon
          icon={icon}
          block={block}
          recordMap={recordMap}
          size="xl"
          className="leading-none flex-shrink-0"
        />
      ) : (
        (block.type === "collection_view" ||
          block.type === "collection_view_page") && (
          <IconDatabase className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground shrink-0" />
        )
      )}
      <h1 className="font-extrabold break-words tracking-tight text-foreground">
        {title}
      </h1>
    </div>
  );
}
