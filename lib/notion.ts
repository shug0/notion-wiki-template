/**
 * Notion API Interne - Wrapper optimisé
 */

import { unstable_cache } from "next/cache";
import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";
import { parsePageId } from "notion-utils";
import { cache } from "react";
import "server-only";

// ============================================
// Client avec fetch Next.js (fix App Router)
// ============================================

const notion = new NotionAPI({
  activeUser: undefined,
  authToken: undefined,
  // @ts-expect-error - Option non doc mais supportée
  fetch: fetch, // Utilise le fetch de Next.js
});

// ============================================
// Retry logic pour erreurs réseau
// ============================================

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable =
        error instanceof Error &&
        !error.message.includes("not_found") &&
        !error.message.includes("unauthorized");

      if (isLastAttempt || !isRetryable) throw error;

      const delay = 2 ** attempt * 1000;
      console.log(`⚠️  Retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

// ============================================
// Fetch avec cache Next.js + React
// ============================================

export const getNotionPage = unstable_cache(
  cache(async (pageIdOrUrl: string): Promise<ExtendedRecordMap> => {
    const pageId = parsePageId(pageIdOrUrl) || pageIdOrUrl;

    console.log(`🔵 [Notion Internal API] Fetching page: ${pageId}`);
    const startTime = performance.now();

    return withRetry(async () => {
      const recordMap = await notion.getPage(pageId, {
        fetchCollections: true,
        signFileUrls: true,
        fetchRelationPages: false,
        collectionReducerLimit: 100,
        concurrency: 3,
      });

      await repairEmptyCollectionQueries(recordMap);
      await fetchRelationPages(recordMap);
      await fetchMentionPages(recordMap);

      const duration = performance.now() - startTime;
      const blockCount = Object.keys(recordMap.block || {}).length;
      const collectionCount = Object.keys(recordMap.collection || {}).length;

      console.log(`✅ Page fetched in ${Math.round(duration)}ms`);
      console.log(
        `   📦 Blocks: ${blockCount}, 🗂️  Collections: ${collectionCount}`,
      );

      return recordMap;
    });
  }),
  ["notion-page"],
  {
    revalidate: 3600, // 1h
    tags: ["notion"],
  },
);

/**
 * Fetch léger de la page root : structure de blocs uniquement, sans les entrées
 * de collections. Utilisé pour la nav et les métadonnées du layout.
 * Reste sous la limite 2MB de unstable_cache (~146KB vs ~4.5MB avec collections).
 */
export const getNotionPageNav = unstable_cache(
  cache(async (pageIdOrUrl: string): Promise<ExtendedRecordMap> => {
    const pageId = parsePageId(pageIdOrUrl) || pageIdOrUrl;

    console.log(`🔵 [Notion Internal API] Fetching nav: ${pageId}`);
    const startTime = performance.now();

    return withRetry(async () => {
      const recordMap = await notion.getPage(pageId, {
        fetchCollections: false,
        signFileUrls: false,
        fetchRelationPages: false,
        concurrency: 3,
      });

      const duration = performance.now() - startTime;
      console.log(
        `✅ Nav fetched in ${Math.round(duration)}ms (${Object.keys(recordMap.block || {}).length} blocks)`,
      );

      return recordMap;
    });
  }),
  ["notion-page-nav"],
  {
    revalidate: 3600, // 1h
    tags: ["notion"],
  },
);

export const getNotionCollection = unstable_cache(
  cache(
    async (
      collectionId: string,
      _collectionViewId?: string,
    ): Promise<ExtendedRecordMap> => {
      console.log(`🗂️  Fetching collection: ${collectionId}`);

      return withRetry(async () => {
        const recordMap = await notion.getPage(collectionId, {
          fetchCollections: true,
          collectionReducerLimit: 200,
        });

        return recordMap;
      });
    },
  ),
  ["notion-collection"],
  {
    revalidate: 3600,
    tags: ["notion"],
  },
);

// ============================================
// Fallback for broken collection queries
// ============================================

/**
 * notion-client fails to query collections with relation-based groupBy
 * (sends invalid payload → 400). This detects empty collection_query
 * entries and fetches results with a simple reducer fallback.
 */
async function repairEmptyCollectionQueries(
  recordMap: ExtendedRecordMap,
): Promise<void> {
  for (const blockId of Object.keys(recordMap.block)) {
    const block = unwrapValue(
      recordMap.block[blockId] as unknown as { value: Record<string, unknown> },
    );
    if (
      !block ||
      (block.type !== "collection_view" &&
        block.type !== "collection_view_page")
    )
      continue;

    const collectionId = block.collection_id as string | undefined;
    const viewIds = block.view_ids as string[] | undefined;
    if (!collectionId || !viewIds?.length) continue;

    // Check if any view has results already
    const existingQuery = recordMap.collection_query?.[collectionId];
    const hasResults = viewIds.some((vid) => {
      const viewResult = existingQuery?.[vid];
      if (!viewResult) return false;
      return Object.values(viewResult).some((reducer) => {
        const r = reducer as Record<string, unknown>;
        return (
          ((r.blockIds as string[] | undefined)?.length ??
            (r.results as unknown[] | undefined)?.length ??
            0) > 0
        );
      });
    });

    if (hasResults) continue;

    // Fetch with simple reducer
    console.log(
      `   🔧 Repairing empty collection query for ${collectionId}...`,
    );

    for (const viewId of viewIds) {
      try {
        const resp = await fetch(
          "https://www.notion.so/api/v3/queryCollection?src=repair",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collection: { id: collectionId },
              collectionView: { id: viewId },
              loader: {
                type: "reducer",
                reducers: {
                  collection_group_results: { type: "results", limit: 200 },
                },
                searchQuery: "",
                userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            }),
          },
        );

        if (!resp.ok) continue;

        const data = (await resp.json()) as {
          result?: {
            reducerResults?: Record<string, unknown>;
          };
          recordMap?: {
            block?: Record<string, unknown>;
          };
        };

        // Inject results into collection_query
        if (!recordMap.collection_query) {
          recordMap.collection_query = {};
        }
        if (!recordMap.collection_query[collectionId]) {
          recordMap.collection_query[collectionId] = {};
        }
        // Type assertion: the API response shape doesn't match the strict
        // notion-types CollectionQueryResult, but react-notion-x reads it loosely.
        (recordMap.collection_query[collectionId] as Record<string, unknown>)[
          viewId
        ] = data.result?.reducerResults;

        // Merge fetched blocks (raw, unsigned)
        if (data.recordMap?.block) {
          for (const [id, entry] of Object.entries(data.recordMap.block)) {
            if (!recordMap.block[id]) {
              recordMap.block[id] = entry as (typeof recordMap.block)[string];
            }
          }
        }

        const blockIds = (
          data.result?.reducerResults?.collection_group_results as {
            blockIds?: string[];
          }
        )?.blockIds;
        console.log(
          `   ✅ Repaired: ${blockIds?.length ?? 0} items for view ${viewId}`,
        );

        // Re-fetch collection items + their children for gallery covers
        if (blockIds?.length) {
          try {
            const itemResult = await notion.getBlocks(blockIds);
            const itemBlocks = itemResult.recordMap.block || {};

            // Merge item blocks (overwrite raw repair blocks)
            for (const [id, entry] of Object.entries(itemBlocks)) {
              recordMap.block[id] = entry as (typeof recordMap.block)[string];
            }

            // Collect first-level children IDs to fetch (for page_content_first cover)
            const childIds: string[] = [];
            for (const id of blockIds) {
              const b = unwrapValue(
                itemBlocks[id] as unknown as {
                  value: Record<string, unknown>;
                },
              );
              const content = b?.content as string[] | undefined;
              if (content?.length) childIds.push(...content.slice(0, 10));
            }

            if (childIds.length) {
              const childResult = await notion.getBlocks(childIds);
              for (const [id, entry] of Object.entries(
                childResult.recordMap.block || {},
              )) {
                if (!recordMap.block[id]) {
                  recordMap.block[id] =
                    entry as (typeof recordMap.block)[string];
                }
              }
            }
          } catch (err) {
            console.warn("Failed to re-fetch signed collection blocks:", err);
          }
        }
      } catch (err) {
        console.warn(`Failed to repair collection query for ${viewId}:`, err);
      }
    }
  }
}

// ============================================
// Fetch relation pages (handles double-nested recordMap)
// ============================================

/**
 * Unwrap a potentially double-nested recordMap entry.
 * Runtime shape can be { role, value: T } or { role, value: { role, value: T } }.
 */
function unwrapValue<T extends Record<string, unknown>>(
  entry: { value: T } | undefined,
): T | undefined {
  if (!entry?.value) return undefined;
  const v = entry.value as Record<string, unknown>;
  if (typeof v.role === "string" && v.value && typeof v.value === "object") {
    return v.value as T;
  }
  return entry.value;
}

/**
 * Fetch missing relation target pages into the recordMap.
 * notion-client's built-in fetchRelationPages doesn't handle double-nested entries.
 */
async function fetchRelationPages(recordMap: ExtendedRecordMap): Promise<void> {
  const missingIds = new Set<string>();

  for (const blockId of Object.keys(recordMap.block)) {
    const block = unwrapValue(
      recordMap.block[blockId] as unknown as { value: Record<string, unknown> },
    );
    if (block?.parent_table !== "collection" || !block.parent_id) continue;

    const collection = unwrapValue(
      recordMap.collection[block.parent_id as string] as unknown as {
        value: Record<string, unknown>;
      },
    );
    const schema = collection?.schema as
      | Record<string, { type: string }>
      | undefined;
    if (!schema) continue;

    const properties = block.properties as
      | Record<string, unknown[]>
      | undefined;
    if (!properties) continue;

    for (const [propId, propSchema] of Object.entries(schema)) {
      if (propSchema.type !== "relation") continue;
      const decorations = properties[propId];
      if (!Array.isArray(decorations)) continue;

      for (const dec of decorations) {
        if (!Array.isArray(dec) || dec[0] !== "\u2023") continue;
        const pointer = (dec[1] as Array<unknown[]>)?.[0];
        if (
          Array.isArray(pointer) &&
          pointer[0] === "p" &&
          typeof pointer[1] === "string"
        ) {
          const targetId = pointer[1] as string;
          if (!recordMap.block[targetId]) {
            missingIds.add(targetId);
          }
        }
      }
    }
  }

  if (missingIds.size === 0) return;

  console.log(`   🔗 Fetching ${missingIds.size} relation pages...`);

  try {
    const response = await notion.getBlocks(Array.from(missingIds));
    recordMap.block = { ...recordMap.block, ...response.recordMap.block };
  } catch (err) {
    console.warn("Failed to fetch relation pages:", err);
  }
}

/**
 * Fetch missing page mention blocks into the recordMap.
 * Scans all blocks' title decorations for ["p", blockId] and fetches absent ones.
 */
async function fetchMentionPages(recordMap: ExtendedRecordMap): Promise<void> {
  const missingIds = new Set<string>();

  for (const blockId of Object.keys(recordMap.block)) {
    const block = unwrapValue(
      recordMap.block[blockId] as unknown as { value: Record<string, unknown> },
    );
    if (!block) continue;

    const title = (block.properties as Record<string, unknown> | undefined)
      ?.title;
    if (!Array.isArray(title)) continue;

    for (const decoration of title) {
      if (!Array.isArray(decoration) || !Array.isArray(decoration[1])) continue;
      for (const fmt of decoration[1] as unknown[][]) {
        if (
          (fmt[0] === "p" || fmt[0] === "eoi") &&
          typeof fmt[1] === "string"
        ) {
          const targetId = fmt[1];
          if (!recordMap.block[targetId]) {
            missingIds.add(targetId);
          }
        }
      }
    }
  }

  // Also scan collection descriptions for page mentions
  for (const colId of Object.keys(recordMap.collection ?? {})) {
    const col = unwrapValue(
      (
        recordMap.collection as unknown as Record<
          string,
          { value: Record<string, unknown> }
        >
      )[colId],
    ) as Record<string, unknown> | undefined;
    const description = col?.description;
    if (!Array.isArray(description)) continue;
    for (const decoration of description) {
      if (!Array.isArray(decoration) || !Array.isArray(decoration[1])) continue;
      for (const fmt of decoration[1] as unknown[][]) {
        if (
          (fmt[0] === "p" || fmt[0] === "eoi") &&
          typeof fmt[1] === "string"
        ) {
          if (!recordMap.block[fmt[1]]) missingIds.add(fmt[1]);
        }
      }
    }
  }

  if (missingIds.size === 0) return;

  console.log(`   🔗 Fetching ${missingIds.size} mention pages...`);

  try {
    const response = await notion.getBlocks(Array.from(missingIds));
    recordMap.block = { ...recordMap.block, ...response.recordMap.block };
  } catch (err) {
    console.warn("Failed to fetch mention pages:", err);
  }
}

// ============================================
// Helpers avec typage strict
// ============================================

export function extractPageId(urlOrId: string): string | null {
  return parsePageId(urlOrId) || null;
}

function getBlockType(block: unknown): string | undefined {
  if (!block || typeof block !== "object") return undefined;
  const b = block as Record<string, unknown>;
  const value = b.value;
  if (value && typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;
    if (typeof v.type === "string") return v.type;
  }
  if (typeof b.type === "string") return b.type;
  return undefined;
}

export function isPageBlock(block: unknown): boolean {
  const type = getBlockType(block);
  return type === "page" || type === "collection_view_page";
}

export function isCollectionBlock(block: unknown): boolean {
  const type = getBlockType(block);
  return type === "collection_view" || type === "collection_view_page";
}
