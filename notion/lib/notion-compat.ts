import type {
  Block,
  Collection,
  CollectionView,
  CollectionViewBlock,
  CollectionViewPageBlock,
  ExtendedRecordMap,
} from "notion-types";

/**
 * Compatibility layer for notion-types@7.7.3.
 *
 * The installed NotionMap<T> types assume `{ role, value: T }`,
 * but runtime data can be double-nested: `{ role, value: { role, value: T } }`.
 * These helpers handle both shapes and return properly typed values.
 */

/**
 * Extract a typed value from a NotionMap entry, handling double-nesting.
 * Runtime: value can be T or { role: string; value: T }
 */
function extractValue<T extends { id: string }>(
  mapEntry: { value: T } | undefined,
): T | undefined {
  if (!mapEntry?.value) return undefined;
  const v = mapEntry.value as Record<string, unknown>;
  // Double-nested: { role: ..., value: T } where inner value has `id`
  if (
    typeof v.role === "string" &&
    v.value &&
    typeof v.value === "object" &&
    typeof (v.value as Record<string, unknown>).id === "string"
  ) {
    return v.value as T;
  }
  return mapEntry.value;
}

export function getCollectionData(
  recordMap: ExtendedRecordMap,
  collectionId: string | undefined,
): Collection | undefined {
  if (!collectionId) return undefined;
  return extractValue(recordMap.collection?.[collectionId]);
}

export function getCollectionViewData(
  recordMap: ExtendedRecordMap,
  viewId: string | undefined,
): CollectionView | undefined {
  if (!viewId) return undefined;
  return extractValue(recordMap.collection_view?.[viewId]);
}

export function getBlockData(
  recordMap: ExtendedRecordMap,
  blockId: string,
): Block | undefined {
  return extractValue(recordMap.block?.[blockId]);
}

// Type guards for collection blocks

export function isCollectionViewBlock(
  block: Block,
): block is CollectionViewBlock {
  return block.type === "collection_view";
}

export function isCollectionViewPageBlock(
  block: Block,
): block is CollectionViewPageBlock {
  return block.type === "collection_view_page";
}

export function isCollectionBlock(
  block: Block,
): block is CollectionViewBlock | CollectionViewPageBlock {
  return (
    block.type === "collection_view" || block.type === "collection_view_page"
  );
}

/**
 * Extract collection ID from a block (collection_view or collection_view_page).
 */
export function getCollectionId(block: Block): string | undefined {
  if (isCollectionBlock(block)) return block.collection_id;
  return undefined;
}

/**
 * Extract view IDs from a block (collection_view or collection_view_page).
 */
export function getViewIds(block: Block): string[] {
  if (isCollectionBlock(block)) return block.view_ids || [];
  return [];
}

/**
 * Extract row IDs from collection query results.
 * Handles simple views (blockIds), grouped views (results:* keys),
 * and board views (collection_group_results / reducerResults).
 * Fallback: if current view has no blockIds, try other views from same collection.
 */
export function getQueryBlockIds(
  recordMap: ExtendedRecordMap,
  collectionId: string,
  viewId: string,
): string[] {
  const queryResult = recordMap.collection_query?.[collectionId]?.[viewId];
  if (!queryResult) return tryFallbackViews(recordMap, collectionId, viewId);

  // Simple view: blockIds directly available
  if (queryResult.blockIds?.length) {
    return queryResult.blockIds;
  }

  // Grouped views v1: groupResults array
  if (queryResult.groupResults?.length) {
    return queryResult.groupResults.flatMap((g) => g.blockIds);
  }

  // Board view: collection_group_results
  if (queryResult.collection_group_results?.blockIds?.length) {
    return queryResult.collection_group_results.blockIds;
  }

  // Reducer view
  if (queryResult.reducerResults?.collection_group_results?.blockIds?.length) {
    return queryResult.reducerResults.collection_group_results.blockIds;
  }

  // Table groups v2: "results:relation:[object Object]" serialization bug in notion-client
  // causes rows belonging to named groups to be lost (blockIds: []).
  // When table_groups is present, scan the recordMap directly for all rows of this collection.
  const tableGroups = (queryResult as unknown as Record<string, unknown>)
    .table_groups;
  if (tableGroups) {
    return scanCollectionRows(recordMap, collectionId);
  }

  // Grouped views v2: dynamic "results:*" keys (not in official types)
  // These keys are added at runtime but aren't in CollectionQueryResult
  const allIds: string[] = [];
  for (const [key, val] of Object.entries(queryResult)) {
    if (
      key.startsWith("results:") &&
      val &&
      typeof val === "object" &&
      "blockIds" in val
    ) {
      const blockIds = (val as { blockIds: string[] }).blockIds;
      if (blockIds?.length) {
        allIds.push(...blockIds);
      }
    }
  }

  if (allIds.length > 0) return allIds;

  // Fallback: try other views from same collection (e.g., gallery view without blockIds)
  return tryFallbackViews(recordMap, collectionId, viewId);
}

/**
 * Scan recordMap for all page blocks belonging to a collection.
 * Used when the query result uses table_groups v2 where notion-client
 * serializes grouped result keys as "[object Object]", losing row IDs.
 */
function scanCollectionRows(
  recordMap: ExtendedRecordMap,
  collectionId: string,
): string[] {
  const ids: string[] = [];
  for (const [id, raw] of Object.entries(recordMap.block)) {
    const block = extractValue(raw as { value: Block });
    if (!block) continue;
    const b = block as unknown as Record<string, unknown>;
    if (
      b.type === "page" &&
      b.parent_table === "collection" &&
      b.parent_id === collectionId
    ) {
      ids.push(id);
    }
  }
  return ids;
}

/**
 * Fallback: try to get blockIds from other views of the same collection.
 * Useful when gallery view doesn't have blockIds but table view does.
 *
 * WARNING: The fallback view may have different filters/sorts than the
 * requested view. This means the returned IDs might not match what the
 * user expects for the current view. This is a best-effort fallback —
 * no runtime warning is emitted since this runs in RSC context.
 */
function tryFallbackViews(
  recordMap: ExtendedRecordMap,
  collectionId: string,
  currentViewId: string,
): string[] {
  const collectionQuery = recordMap.collection_query?.[collectionId];
  if (!collectionQuery) return [];

  // Try all other views in this collection
  for (const [viewId, queryResult] of Object.entries(collectionQuery)) {
    if (viewId === currentViewId) continue; // Skip current view

    // Try collection_group_results first (most common for table views)
    if (
      queryResult &&
      typeof queryResult === "object" &&
      "collection_group_results" in queryResult
    ) {
      const groupResults = queryResult.collection_group_results as {
        blockIds?: string[];
      };
      if (groupResults.blockIds?.length) {
        return groupResults.blockIds;
      }
    }

    // Try direct blockIds
    if (
      queryResult &&
      typeof queryResult === "object" &&
      "blockIds" in queryResult
    ) {
      const blockIds = (queryResult as { blockIds?: string[] }).blockIds;
      if (blockIds?.length) {
        return blockIds;
      }
    }
  }

  return [];
}
