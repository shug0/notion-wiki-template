import { NextResponse } from "next/server";
import { NotionAPI } from "notion-client";

const HIGHLIGHT_OPEN = "<gzkNfoUU>";
const HIGHLIGHT_CLOSE = "</gzkNfoUU>";

function strip(str: string): string {
  return str.replaceAll(HIGHLIGHT_OPEN, "").replaceAll(HIGHLIGHT_CLOSE, "");
}

type BlockEntry = {
  value?: {
    type?: string;
    collection_id?: string;
    properties?: { title?: string[][] };
    format?: { page_icon?: string };
    parent_table?: string;
    parent_id?: string;
  };
};

type CollectionEntry = {
  value?: { name?: string[][] };
};

function getBlockTitle(entry: BlockEntry | undefined): string {
  const decorations = entry?.value?.properties?.title;
  if (!Array.isArray(decorations)) return "";
  return decorations
    .flat()
    .filter((s): s is string => typeof s === "string")
    .join("");
}

function getCollectionName(entry: CollectionEntry | undefined): string {
  const name = entry?.value?.name;
  if (!Array.isArray(name)) return "";
  return name
    .flat()
    .filter((s): s is string => typeof s === "string")
    .join("");
}

/** Remonte la chaîne parent pour construire le breadcrumb sans la racine. */
function buildParentPath(
  blockValue: BlockEntry["value"] | undefined,
  blockMap: Record<string, BlockEntry>,
  collectionMap: Record<string, CollectionEntry>,
  rootId: string,
  depth = 0,
): string {
  if (!blockValue || depth > 3) return "";
  const { parent_table, parent_id } = blockValue;
  if (!parent_id || parent_id === rootId) return "";

  if (parent_table === "collection") {
    // Item de collection — afficher le nom de la collection
    return getCollectionName(collectionMap[parent_id]);
  }

  if (parent_table === "block") {
    const parentEntry = blockMap[parent_id];
    const parentTitle = getBlockTitle(parentEntry);
    if (!parentTitle) return "";

    const grandParentPath = buildParentPath(
      parentEntry?.value,
      blockMap,
      collectionMap,
      rootId,
      depth + 1,
    );
    return grandParentPath
      ? `${grandParentPath} › ${parentTitle}`
      : parentTitle;
  }

  return "";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json({ results: [] });

  const rawPageId =
    process.env.NOTION_PAGE_ID ?? process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;
  if (!rawPageId) {
    return NextResponse.json(
      { error: "NOTION_PAGE_ID not configured" },
      { status: 500 },
    );
  }

  const ancestorId = rawPageId.replace(/-/g, "");
  const client = new NotionAPI({ authToken: process.env.NOTION_TOKEN });

  const response = await client.search({
    ancestorId,
    query: q,
    limit: 20,
    filters: {
      isDeletedOnly: false,
      excludeTemplates: true,
      isNavigableOnly: true,
      requireEditPermissions: false,
    },
  });

  const blockMap = (response.recordMap?.block ?? {}) as Record<
    string,
    BlockEntry
  >;
  const collectionMap = (response.recordMap?.collection ?? {}) as Record<
    string,
    CollectionEntry
  >;

  const results = response.results.map((item) => {
    const entry = blockMap[item.id];
    const isCollectionPage =
      entry?.value?.type === "collection_view_page" ||
      entry?.value?.type === "collection_view";
    const collectionName = isCollectionPage
      ? getCollectionName(collectionMap[entry?.value?.collection_id ?? ""])
      : undefined;
    const title = collectionName || getBlockTitle(entry) || "Sans titre";
    const icon = entry?.value?.format?.page_icon;

    // Path : hiérarchie parente sans la racine ni le titre courant
    const path = buildParentPath(
      entry?.value,
      blockMap,
      collectionMap,
      ancestorId,
    );

    // Snippet : highlight.text si ce n'est pas une URL brute
    const h = item.highlight as Record<string, string> | undefined;
    const rawSnippet = h?.text?.trim();
    const snippet =
      rawSnippet && !/^https?:\/\/|^www\./.test(rawSnippet)
        ? rawSnippet
        : undefined;

    return { id: item.id, title, path, snippet, icon };
  });

  return NextResponse.json({ results });
}
