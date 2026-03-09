import type {
  Block,
  Collection,
  CollectionView,
  ExtendedRecordMap,
  TableCollectionView,
} from "notion-types";
import type { RichTextItem } from "../types";
import { getBlockContent } from "./conversion";
import { getBlockData, getCollectionData } from "./notion-compat";

/**
 * Retrieves the root page ID from the recordMap.
 * The first block in the recordMap is always the requested page.
 */
export function getPageIdFromRecordMap(recordMap: ExtendedRecordMap): string {
  return Object.keys(recordMap.block)[0];
}

export interface BreadcrumbItem {
  id: string;
  title: string;
  icon: string | undefined;
}

/**
 * Build ancestor breadcrumb by walking up parent_id chain.
 * Handles regular pages (parent_table=block) and collection rows (parent_table=collection).
 * Returns ancestors from root → direct parent (excludes current page).
 */
function blockToBreadcrumbItem(
  recordMap: ExtendedRecordMap,
  block: Block,
  id: string,
): BreadcrumbItem | undefined {
  const format = block.format as Record<string, unknown> | undefined;
  const rawIcon = format?.page_icon;
  const icon = typeof rawIcon === "string" ? rawIcon : undefined;

  if (block.type === "collection_view_page") {
    const b = block as unknown as Record<string, unknown>;
    const collectionId = b.collection_id as string | undefined;
    const title = getCollectionTitle(recordMap, collectionId) || "Sans titre";
    const collection = getCollectionData(recordMap, collectionId);
    const collIcon = collection?.icon;
    return {
      id: id.replace(/-/g, ""),
      title,
      icon: typeof collIcon === "string" ? collIcon : icon,
    };
  }

  if (block.type === "page") {
    const props = block.properties as Record<string, unknown> | undefined;
    const rawTitle = (props?.title as string[][] | undefined)?.[0]?.[0];
    const title = typeof rawTitle === "string" ? rawTitle : "Sans titre";
    return { id: id.replace(/-/g, ""), title, icon };
  }

  return undefined;
}

export function getBreadcrumb(
  recordMap: ExtendedRecordMap,
  pageId: string,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  let current = pageId;

  for (let i = 0; i < 20; i++) {
    const block = getBlockData(recordMap, current);
    if (!block) break;

    const b = block as unknown as Record<string, unknown>;
    const parentId = b.parent_id as string | undefined;
    const parentTable = b.parent_table as string | undefined;

    if (!parentId || parentTable === "space") break;

    // Collection row: parent_id is the collection_id, not a block.
    // Jump to the collection_view(_page) block that owns this collection.
    if (parentTable === "collection") {
      const cvEntry = Object.entries(recordMap.block).find(([id]) => {
        const blk = getBlockData(recordMap, id);
        if (!blk) return false;
        const bk = blk as unknown as Record<string, unknown>;
        return (
          (bk.type === "collection_view" ||
            bk.type === "collection_view_page") &&
          bk.collection_id === parentId
        );
      });
      if (!cvEntry) break;
      // If the cv block is a collection_view_page, capture it as an ancestor
      const cvBlock = getBlockData(recordMap, cvEntry[0]);
      if (cvBlock?.type === "collection_view_page") {
        const item = blockToBreadcrumbItem(recordMap, cvBlock, cvEntry[0]);
        if (item) items.unshift(item);
      }
      current = cvEntry[0];
      continue;
    }

    if (!recordMap.block[parentId]) break;

    const parent = getBlockData(recordMap, parentId);
    if (!parent) break;

    if (parent.type === "page" || parent.type === "collection_view_page") {
      const item = blockToBreadcrumbItem(recordMap, parent, parentId);
      if (item) items.unshift(item);
    }

    current = parentId;
  }

  return items;
}

/**
 * Extracts the title string from a page block.
 */
export function getPageTitle(pageBlock: Block): string {
  const titleArray = (pageBlock.properties?.title ?? []) as Array<
    [string, ...unknown[]]
  >;
  return titleArray.map((d) => d[0]).join("") || "Sans titre";
}

/**
 * Extracts the title string from a collection.
 * Collections use the 'name' property (Decoration[] format) instead of 'title'.
 */
export function getCollectionTitle(
  recordMap: ExtendedRecordMap,
  collectionId: string | undefined,
): string {
  const collection = getCollectionData(recordMap, collectionId);
  if (!collection) return "Database";

  const nameArray = collection.name || [];
  return nameArray[0]?.[0] || "Database";
}

/**
 * Extracts the description from a collection as plain text.
 * Collection descriptions use Decoration[][] format (same as name).
 * Page mentions (type "p") are resolved to their title if present in recordMap.
 */
export function getCollectionDescription(
  recordMap: ExtendedRecordMap,
  collectionId: string | undefined,
): string | undefined {
  const collection = getCollectionData(recordMap, collectionId);
  if (!collection) return undefined;

  const decorations = (collection as unknown as Record<string, unknown>)
    .description as Array<[string, Array<[string, ...unknown[]]>?]> | undefined;
  if (!decorations?.length) return undefined;

  const text = decorations
    .map(([chunk, annotations]) => {
      const pAnnotation = annotations?.find(([type]) => type === "p");
      if (pAnnotation) {
        const mentionedId = (pAnnotation[1] as string).replace(/-/g, "");
        const block = getBlockData(recordMap, mentionedId);
        if (block) {
          const titleProp = block.properties?.title as
            | Array<[string]>
            | undefined;
          if (titleProp) return titleProp.map(([t]) => t).join("");
        }
        return "";
      }
      return chunk === "‣" ? "" : chunk;
    })
    .join("")
    .replace(/\n/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();

  return text || undefined;
}

/**
 * Custom emoji URLs (`notion://custom_emoji/...`) cannot be resolved
 * without authenticated API access — always returns undefined.
 * Callers should render a fallback instead.
 */
export function resolveCustomEmojiUrl(icon: string): string | undefined {
  if (!icon.startsWith("notion://custom_emoji/")) return undefined;
  return undefined;
}

/**
 * Maps a Notion image URL to a public URL.
 * Handles internal Notion attachments using signed URLs if available.
 */
export function mapImageUrl(
  url: string | undefined,
  block: Block,
  recordMap: ExtendedRecordMap,
): string | undefined {
  if (!url) return undefined;

  // Handle signed URLs from recordMap — keyed by block ID or by URL
  if (recordMap.signed_urls?.[block.id]) {
    return recordMap.signed_urls[block.id];
  }
  if (recordMap.signed_urls?.[url]) {
    return recordMap.signed_urls[url];
  }

  // If it's an attachment URL, we can try to use Notion's public image proxy
  // Format: https://www.notion.so/image/<encoded_url>?table=block&id=<block_id>
  if (
    url.startsWith("attachment:") ||
    url.startsWith("https://s3.us-west-2.amazonaws.com/") ||
    url.startsWith("https://prod-files-secure.s3.us-west-2.amazonaws.com/")
  ) {
    const encodedUrl = encodeURIComponent(url);
    return `https://www.notion.so/image/${encodedUrl}?table=block&id=${block.id}`;
  }

  // Handle standard Notion image proxying for internal /images/
  if (url.startsWith("/images/")) {
    return `https://www.notion.so${url}`;
  }

  return url;
}

/**
 * Returns the children IDs (content array) of a block.
 */
export function getBlockChildrenIds(block: Block): string[] {
  return block.content || [];
}

/**
 * Extracts raw property data from a block's properties.
 * For typed rich text extraction, use getBlockContent from conversion.ts instead.
 */
export function getBlockProperty(
  block: Block,
  propertyName = "title",
): unknown[] {
  const properties = block.properties as Record<string, unknown[]> | undefined;
  return properties?.[propertyName] || [];
}

/**
 * Get visible properties for a table view with their metadata.
 * Uses type discrimination: view.type === "table" narrows to TableCollectionView.
 */
export function getTableVisibleProperties(
  view: CollectionView,
  schema: Collection["schema"],
): Array<{ id: string; name: string; type: string; width?: number }> {
  if (view.type !== "table") return [];

  const tableView = view as TableCollectionView;
  const tableProperties = tableView.format?.table_properties || [];

  return tableProperties
    .filter((prop) => prop.visible && schema[prop.property])
    .map((prop) => ({
      id: prop.property,
      name: schema[prop.property]?.name || prop.property,
      type: schema[prop.property]?.type || "text",
      width: prop.width,
    }));
}

/**
 * Extract a property value from a row block.
 */
export function getPropertyValue(rowBlock: Block, propertyId: string): unknown {
  const properties = rowBlock.properties as Record<string, unknown> | undefined;
  return properties?.[propertyId];
}

/**
 * Get the first image block's URL from a page's content.
 * Used for gallery_cover.type === "page_content".
 */
export function getFirstContentImage(
  block: Block,
  recordMap: ExtendedRecordMap,
): string | undefined {
  const content = (block as { content?: string[] }).content;
  if (!content) return undefined;

  for (const childId of content) {
    const child = getBlockData(recordMap, childId);
    if (child?.type === "image") {
      const source =
        child.format?.display_source ||
        (child.properties?.source as Array<[string]> | undefined)?.[0]?.[0];
      if (source) return mapImageUrl(source, child, recordMap);
    }
  }
  return undefined;
}

/**
 * Extract first text-like property value from a block (skipping title).
 * Useful for gallery card preview text.
 */
export function getFirstTextProperty(block: Block): string | undefined {
  const properties = block.properties as Record<string, unknown[]> | undefined;
  if (!properties) return undefined;

  for (const [key, value] of Object.entries(properties)) {
    if (key === "title") continue;
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      // Skip relation markers (‣) and decorated values (have a second element)
      if (
        Array.isArray(firstItem) &&
        typeof firstItem[0] === "string" &&
        firstItem[0] !== "\u2023" &&
        firstItem[1] === undefined
      ) {
        return firstItem[0];
      }
    }
  }

  return undefined;
}

/**
 * Extract plain text from the first text-like child block (quote, text, paragraph).
 * Used as fallback description for gallery cards without a cover image.
 */
export function getFirstChildText(
  block: Block,
  recordMap: ExtendedRecordMap,
): string | undefined {
  const TEXT_TYPES = new Set(["text", "quote", "paragraph"]);
  const childIds = (block as { content?: string[] }).content;
  if (!childIds?.length) return undefined;

  for (const childId of childIds) {
    const child = getBlockData(recordMap, childId);
    if (!child || !TEXT_TYPES.has(child.type)) continue;
    const title = (child.properties as Record<string, unknown[]> | undefined)
      ?.title;
    if (!Array.isArray(title)) continue;
    const text = title
      .map((d) => (Array.isArray(d) ? d[0] : ""))
      .filter((s): s is string => typeof s === "string")
      .join("")
      .trim();
    if (text) return text;
  }
  return undefined;
}

/**
 * Resolves a RichTextItem[] to plain text for meta descriptions.
 * Page mentions are resolved to their title via recordMap.
 * External object mentions (eoi) are skipped.
 */
function richTextToDescription(
  items: RichTextItem[],
  recordMap: ExtendedRecordMap,
): string {
  return items
    .map((item) => {
      if (item.type === "mention") {
        if (item.mention?.type === "page") {
          const mentionedBlock = getBlockData(recordMap, item.mention.pageId);
          if (mentionedBlock) {
            return getBlockContent(mentionedBlock)
              .map((i) => i.plain_text ?? "")
              .join("")
              .trim();
          }
        }
        if (item.mention?.type === "date") {
          const { startDate, startTime, endDate, endTime, dateType, timeZone } =
            item.mention;
          const tz = timeZone ?? "Europe/Paris";
          const formatDate = (date: string, time?: string) => {
            const isDatetime =
              (dateType === "datetime" || dateType === "datetimerange") && time;
            const dt = isDatetime
              ? new Date(`${date}T${time}`)
              : new Date(`${date}T00:00:00`);
            return new Intl.DateTimeFormat("fr-FR", {
              year: "numeric",
              month: "short",
              day: "numeric",
              ...(isDatetime
                ? { hour: "2-digit", minute: "2-digit", timeZone: tz }
                : {}),
            }).format(dt);
          };
          return endDate
            ? `${formatDate(startDate, startTime)} → ${formatDate(endDate, endTime)}`
            : formatDate(startDate, startTime);
        }
        return "";
      }
      return item.plain_text ?? item.text?.content ?? "";
    })
    .join("");
}

/**
 * Extracts a description from a page by finding the first non-empty text block.
 * Descends into callout blocks one level deep.
 */
function extractTextFromBlock(
  block: Block,
  recordMap: ExtendedRecordMap,
): string | undefined {
  const text = richTextToDescription(getBlockContent(block), recordMap).trim();
  return text || undefined;
}

const DESCRIPTION_MAX_LENGTH = 160;

function truncateDescription(text: string): string {
  if (text.length <= DESCRIPTION_MAX_LENGTH) return text;
  const truncated = text.slice(0, DESCRIPTION_MAX_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

function findDescriptionInBlocks(
  recordMap: ExtendedRecordMap,
  ids: string[],
  depth: number,
): string | undefined {
  if (depth > 3) return undefined;

  for (const id of ids) {
    const block = getBlockData(recordMap, id);
    if (!block) continue;

    if (["text", "paragraph", "quote"].includes(block.type)) {
      const text = extractTextFromBlock(block, recordMap);
      if (text) return truncateDescription(text);
    }

    if (block.type === "callout") {
      const result = findDescriptionInBlocks(
        recordMap,
        block.content || [],
        depth + 1,
      );
      if (result) return result;
      const ownText = extractTextFromBlock(block, recordMap);
      if (ownText) return truncateDescription(ownText);
    }

    if (["column_list", "column"].includes(block.type)) {
      const result = findDescriptionInBlocks(
        recordMap,
        block.content || [],
        depth + 1,
      );
      if (result) return result;
    }
  }

  return undefined;
}

export function getPageDescription(
  recordMap: ExtendedRecordMap,
  pageBlock: Block,
): string | undefined {
  return findDescriptionInBlocks(recordMap, pageBlock.content || [], 0);
}

/**
 * Returns the cover image URL for a page block, if present.
 */
export function getPageCover(
  pageBlock: Block,
  recordMap: ExtendedRecordMap,
): string | undefined {
  const cover = pageBlock.format?.page_cover;
  if (!cover || typeof cover !== "string") return undefined;
  return mapImageUrl(cover, pageBlock, recordMap);
}

/**
 * Extract the string value from a select property.
 * Format: [["value"]]
 */
export function getSelectValue(value: unknown): string | undefined {
  return (value as Array<[string]>)?.[0]?.[0] || undefined;
}

/**
 * Group block IDs by a property value (supports select and relation types).
 * Returns Map<groupKey, blockIds[]> with "__empty__" for items without a value.
 */
export function groupBlocksByProperty(
  blockIds: string[],
  propertyId: string,
  schema: Collection["schema"],
  recordMap: ExtendedRecordMap,
  parentPropertyKey?: string,
): Map<string, string[]> {
  const propType = schema[propertyId]?.type;
  const groups = new Map<string, string[]>();

  for (const id of blockIds) {
    const block = getBlockData(recordMap, id);
    if (!block) continue;

    // Skip sub-items (rows with a parent pointer): they are rendered as nested
    // children under their parent via buildRowTree, not as top-level group items.
    if (parentPropertyKey) {
      const parentValue = getPropertyValue(block, parentPropertyKey);
      if (getRelationIds(parentValue).length > 0) continue;
    }

    const propertyValue = getPropertyValue(block, propertyId);
    let groupKey: string;

    if (propType === "select" || propType === "multi_select") {
      groupKey = getSelectValue(propertyValue) || "__empty__";
    } else if (propType === "relation") {
      const relationIds = getRelationIds(propertyValue);
      groupKey = relationIds.length > 0 ? relationIds[0] : "__empty__";
    } else {
      groupKey = "__empty__";
    }

    const existing = groups.get(groupKey) || [];
    groups.set(groupKey, [...existing, id]);
  }

  return groups;
}

/**
 * Extract relation IDs from a Notion property value.
 * Format: [["‣", [["p", "block-id", "space-id"]]]]
 */
export function getRelationIds(propertyValue: unknown): string[] {
  if (!Array.isArray(propertyValue)) return [];
  const ids: string[] = [];
  for (const item of propertyValue) {
    if (Array.isArray(item) && item[1]) {
      for (const dec of item[1]) {
        if (
          Array.isArray(dec) &&
          dec[0] === "p" &&
          typeof dec[1] === "string"
        ) {
          ids.push(dec[1]);
        }
      }
    }
  }
  return ids;
}
