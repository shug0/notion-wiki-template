import { IconDatabase } from "@tabler/icons-react";
import type { Block, ExtendedRecordMap } from "notion-types";
import { getCollectionTitle } from "../../lib/data";
import { getCollectionData, getCollectionId } from "../../lib/notion-compat";
import type { NotionIconType } from "../../types";
import { PageLink } from "../../ui/page-link";

interface CollectionPageBlockProps {
  block: Block;
  recordMap: ExtendedRecordMap;
}

/**
 * Renders a collection_view_page as a simple link (when listed in another page).
 * The full collection view is rendered by NotionOrchestrator when visiting the page directly.
 */
export function CollectionPageBlock({
  block,
  recordMap,
}: CollectionPageBlockProps) {
  const collectionId = getCollectionId(block);
  const title = getCollectionTitle(recordMap, collectionId);
  const collection = getCollectionData(recordMap, collectionId);

  // Collection.icon is typed as string, cast to our richer NotionIconType
  const icon = collection?.icon as NotionIconType;

  // Generate page ID for link
  const pageId = block.id.replace(/-/g, "");

  return (
    <PageLink
      href={`/${pageId}`}
      title={title}
      icon={icon}
      fallback={<IconDatabase className="w-4 h-4" />}
      block={block}
      recordMap={recordMap}
    />
  );
}
