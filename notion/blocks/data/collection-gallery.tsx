import type {
  Block,
  Collection,
  CollectionView,
  ExtendedRecordMap,
} from "notion-types";
import { cn } from "@/lib/utils";
import {
  getFirstChildText,
  getFirstContentImage,
  getFirstTextProperty,
  getPageTitle,
  groupBlocksByProperty,
  mapImageUrl,
} from "../../lib/data";
import { getBlockData, getQueryBlockIds } from "../../lib/notion-compat";
import type { NotionIconType } from "../../types";
import { notionTokens } from "../../ui/design-system";
import { GalleryGrid } from "./gallery-grid";

interface CollectionGalleryViewProps {
  block: Block;
  recordMap: ExtendedRecordMap;
  collectionId: string;
  viewId: string;
  collection: Collection;
  view: CollectionView;
}

/** Serializable card data passed from RSC → client grid */
export interface GalleryCardData {
  id: string;
  title: string;
  href: string;
  coverUrl: string | undefined;
  description: string | undefined;
  /** Emoji string for the icon (pre-resolved server-side) */
  iconEmoji: string | undefined;
  /** Image URL for the icon (pre-resolved server-side) */
  iconUrl: string | undefined;
  coverSize: "small" | "medium" | "large";
}

export function CollectionGalleryView({
  recordMap,
  collectionId,
  viewId,
  collection,
  view,
}: CollectionGalleryViewProps) {
  const itemIds = getQueryBlockIds(recordMap, collectionId, viewId);

  if (itemIds.length === 0) {
    return (
      <div className={cn("my-4", notionTokens.text.caption)}>No items</div>
    );
  }

  const showIcon = view.format?.show_page_icon ?? true;
  const coverSize = view.format?.gallery_cover_size || "medium";

  // Pre-compute card data server-side (fully serializable, no recordMap needed client-side)
  const toCardData = (block: Block): GalleryCardData => {
    const { emoji, url } = showIcon
      ? resolveIcon(block.format?.page_icon as NotionIconType, block, recordMap)
      : { emoji: undefined, url: undefined };

    return {
      id: block.id,
      title:
        (block.properties?.title?.[0]?.[0] as string | undefined) ||
        "Sans titre",
      href: `/${block.id.replace(/-/g, "")}`,
      coverUrl: resolveCoverUrl(block, view, recordMap),
      description:
        getFirstTextProperty(block) ?? getFirstChildText(block, recordMap),
      iconEmoji: emoji,
      iconUrl: url,
      coverSize: coverSize as GalleryCardData["coverSize"],
    };
  };

  // Grouping
  const groupByPropertyId = view.format?.collection_group_by?.property;

  if (groupByPropertyId) {
    const groupedIds = groupBlocksByProperty(
      itemIds,
      groupByPropertyId,
      collection.schema,
      recordMap,
    );

    const propertySchema = collection.schema[groupByPropertyId];
    const propertyName = propertySchema?.name || groupByPropertyId;
    const propertyType = propertySchema?.type;

    return (
      <div className="mt-4 space-y-8">
        {Array.from(groupedIds.entries()).map(([groupKey, ids]) => {
          let groupTitle: string;
          if (groupKey === "__empty__") {
            groupTitle = `Sans « ${propertyName} »`;
          } else if (
            propertyType === "select" ||
            propertyType === "multi_select"
          ) {
            groupTitle = groupKey;
          } else {
            const refBlock = getBlockData(recordMap, groupKey);
            groupTitle = refBlock ? getPageTitle(refBlock) : groupKey;
          }

          const cards = ids
            .map((id) => getBlockData(recordMap, id))
            .filter((b): b is Block => b !== undefined)
            .map(toCardData);

          return (
            <div key={groupKey}>
              <h3 className={cn("mb-4", notionTokens.text.heading3)}>
                {groupTitle}
              </h3>
              <GalleryGrid cards={cards} />
            </div>
          );
        })}
      </div>
    );
  }

  // No grouping
  const cards = itemIds
    .map((id) => getBlockData(recordMap, id))
    .filter((b): b is Block => b !== undefined)
    .map(toCardData);

  return (
    <div className="mt-4">
      <GalleryGrid cards={cards} />
    </div>
  );
}

/** Resolve cover URL based on view config */
function resolveCoverUrl(
  block: Block,
  view: CollectionView,
  recordMap: ExtendedRecordMap,
): string | undefined {
  const coverType = view.format?.gallery_cover?.type ?? "page_cover";

  if (coverType === "page_cover") {
    const cover = block.format?.page_cover;
    const url = cover ? mapImageUrl(cover, block, recordMap) : undefined;
    // Fallback to first content image if no page cover
    return url ?? getFirstContentImage(block, recordMap);
  }
  // "page_content" and "page_content_first" both mean: first image in page body
  if (coverType === "page_content" || coverType === "page_content_first") {
    return getFirstContentImage(block, recordMap);
  }
  if (coverType === "property") {
    const propertyId = view.format?.gallery_cover?.property;
    if (propertyId) {
      const prop = block.properties?.[propertyId] as unknown;
      // File property format: [[filename, [["a", url]]]]
      const url = extractFileUrl(prop);
      if (url) return mapImageUrl(url, block, recordMap);
    }
  }
  return undefined;
}

/** Extract file URL from a Notion file property value: [[name, [["a", url]]]] */
function extractFileUrl(prop: unknown): string | undefined {
  if (!Array.isArray(prop) || prop.length === 0) return undefined;
  const decorations = prop[0]?.[1];
  if (!Array.isArray(decorations)) return undefined;
  for (const d of decorations) {
    if (Array.isArray(d) && d[0] === "a" && typeof d[1] === "string") {
      return d[1];
    }
  }
  return undefined;
}

/** Pre-resolve icon to plain emoji string or image URL */
function resolveIcon(
  icon: NotionIconType | undefined,
  block: Block,
  recordMap: ExtendedRecordMap,
): { emoji: string | undefined; url: string | undefined } {
  if (!icon) return { emoji: undefined, url: undefined };

  // String icon
  if (typeof icon === "string") {
    if (icon.startsWith("notion://custom_emoji/"))
      return { emoji: undefined, url: undefined };
    return { emoji: icon, url: undefined };
  }

  // Object icon
  if (typeof icon === "object" && "type" in icon) {
    if (icon.type === "emoji") return { emoji: icon.emoji, url: undefined };

    const rawUrl =
      icon.type === "external"
        ? icon.external.url
        : icon.type === "file"
          ? icon.file.url
          : undefined;

    return {
      emoji: undefined,
      url: rawUrl ? mapImageUrl(rawUrl, block, recordMap) : undefined,
    };
  }

  return { emoji: undefined, url: undefined };
}
