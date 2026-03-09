import { IconFileText } from "@tabler/icons-react";
import type {
  ExtendedRecordMap,
  PageBlock as PageBlockType,
} from "notion-types";
import { getPageTitle } from "../../lib/data";
import type { NotionIconType } from "../../types";
import { PageLink } from "../../ui/page-link";

interface PageBlockProps {
  block: PageBlockType;
  recordMap: ExtendedRecordMap;
}

export function PageBlock({ block, recordMap }: PageBlockProps) {
  const title = getPageTitle(block);
  const pageId = block.id.replace(/-/g, "");
  const format = block.format || {};
  const icon = format.page_icon as NotionIconType;

  return (
    <PageLink
      href={`/${pageId}`}
      title={title}
      icon={icon}
      fallback={<IconFileText className="w-4 h-4" />}
      block={block}
      recordMap={recordMap}
    />
  );
}
