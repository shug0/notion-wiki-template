import type { Block, ExtendedRecordMap } from "notion-types";

import {
  getBlockChildrenIds,
  getCollectionTitle,
  getPageIdFromRecordMap,
  getPageTitle,
} from "@/notion/lib/data";
import {
  getBlockData,
  getCollectionId,
  isCollectionBlock,
} from "@/notion/lib/notion-compat";

type NavItem = {
  id: string;
  title: string;
  icon: string | undefined;
  href: string;
};

/** h2-level grouping within a nav entry */
type NavSection = {
  title: string;
  items: NavItem[];
};

/** h1-level nav entry (top-level menu trigger) */
type NavGroup = {
  title: string;
  sections: NavSection[];
};

type NavTree = {
  /** Main nav entries (h1 → trigger, h2 → dropdown section) */
  groups: NavGroup[];
  /** Sidebar links (h2 as section headers) */
  sidebar: NavSection[];
};

// --- Icon resolution ---

function isEmojiIcon(icon: string): boolean {
  return !icon.startsWith("http") && !icon.startsWith("/");
}

function resolveIcon(
  recordMap: ExtendedRecordMap,
  block: Block,
  blockId: string,
): string | undefined {
  const raw = recordMap.block?.[blockId] as
    | { value?: { format?: { page_icon?: string } } }
    | undefined;
  const blockIcon = raw?.value?.format?.page_icon;
  if (blockIcon && isEmojiIcon(blockIcon)) return blockIcon;

  if (isCollectionBlock(block)) {
    const collectionId = getCollectionId(block);
    if (collectionId) {
      const rawCol = recordMap.collection?.[collectionId] as
        | { value?: { value?: { icon?: string }; icon?: string } }
        | undefined;
      const icon = rawCol?.value?.value?.icon ?? rawCol?.value?.icon;
      if (icon && typeof icon === "string" && isEmojiIcon(icon)) return icon;
    }
  }

  return undefined;
}

// --- Block → NavItem ---

function blockToNavItem(
  recordMap: ExtendedRecordMap,
  block: Block,
  blockId: string,
): NavItem | undefined {
  const title = isCollectionBlock(block)
    ? getCollectionTitle(recordMap, getCollectionId(block)) ||
      getPageTitle(block)
    : getPageTitle(block);

  if (!title || title === "Untitled" || title === "Sans titre")
    return undefined;

  const cleanId = blockId.replace(/-/g, "");
  return {
    id: cleanId,
    title,
    icon: resolveIcon(recordMap, block, blockId),
    href: `/${cleanId}`,
  };
}

function getHeadingText(block: Block): string {
  return block.properties?.title?.[0]?.[0] ?? "";
}

// --- Text block parsing ---

function extractPageRefsFromText(
  recordMap: ExtendedRecordMap,
  block: Block,
): NavItem[] {
  const title = block.properties?.title;
  if (!title) return [];

  const items: NavItem[] = [];
  for (const segment of title) {
    const decorations = segment[1] as unknown[][] | undefined;
    if (!decorations) continue;
    for (const deco of decorations) {
      if (deco[0] === "p" && typeof deco[1] === "string") {
        const pageBlock = getBlockData(recordMap, deco[1]);
        if (!pageBlock) continue;
        const item = blockToNavItem(recordMap, pageBlock, deco[1]);
        if (item) items.push(item);
      }
    }
  }
  return items;
}

function extractExternalLinkFromText(block: Block): NavItem | undefined {
  const title = block.properties?.title;
  if (!title) return undefined;

  let fullText = "";
  let linkUrl: string | undefined;

  for (const segment of title) {
    fullText += (segment[0] as string) ?? "";
    const decorations = segment[1] as unknown[][] | undefined;
    if (!decorations) continue;
    for (const deco of decorations) {
      if (deco[0] === "a" && typeof deco[1] === "string") {
        linkUrl = deco[1] as string;
      }
    }
  }

  if (!linkUrl || !fullText.trim()) return undefined;

  const trimmed = fullText.trim();
  const emojiMatch = trimmed.match(
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u,
  );
  const icon = emojiMatch ? emojiMatch[1] : undefined;
  const label = emojiMatch
    ? trimmed.slice(emojiMatch[0].length).trim()
    : trimmed;

  if (!label) return undefined;
  return { id: linkUrl, title: label, icon, href: linkUrl };
}

// --- Heading types ---

const H1_TYPE = "header";
const H2_H3_TYPES = new Set(["sub_header", "sub_sub_header"]);
const CONTAINER_TYPES = new Set(["column_list", "column"]);

// --- Main nav: hierarchical parse (h1 → group, h2 → section) ---

/**
 * One-pass recursive parse. Shares currentGroup/currentSection via closure
 * so container traversal (column_list, column) keeps the h1/h2 context.
 */
function buildNavGroups(
  recordMap: ExtendedRecordMap,
  blockIds: string[],
): NavGroup[] {
  const groups: NavGroup[] = [];
  let currentGroup: NavGroup = { title: "", sections: [] };
  let currentSection: NavSection = { title: "", items: [] };

  function pushSection() {
    if (currentSection.items.length > 0 || currentSection.title) {
      currentGroup.sections.push({ ...currentSection });
      currentSection = { title: "", items: [] };
    }
  }

  function pushGroup() {
    pushSection();
    const hasItems = currentGroup.sections.some((s) => s.items.length > 0);
    if (hasItems || currentGroup.title) {
      groups.push({ ...currentGroup });
    }
    currentGroup = { title: "", sections: [] };
    currentSection = { title: "", items: [] };
  }

  function processBlocks(ids: string[]) {
    for (const id of ids) {
      const block = getBlockData(recordMap, id);
      if (!block) continue;

      if (block.type === H1_TYPE) {
        pushGroup();
        currentGroup = { title: getHeadingText(block), sections: [] };
        currentSection = { title: "", items: [] };
        continue;
      }

      if (H2_H3_TYPES.has(block.type)) {
        pushSection();
        currentSection = { title: getHeadingText(block), items: [] };
        continue;
      }

      if (block.type === "page" || block.type === "collection_view_page") {
        const item = blockToNavItem(recordMap, block, id);
        if (item) currentSection.items.push(item);
        continue;
      }

      // Recurse into containers — inherits current group/section context
      if (CONTAINER_TYPES.has(block.type)) {
        processBlocks(getBlockChildrenIds(block));
        continue;
      }

      if (block.type === "text") {
        const pageRefs = extractPageRefsFromText(recordMap, block);
        currentSection.items.push(...pageRefs);
      }
    }
  }

  processBlocks(blockIds);
  pushGroup();

  return groups.filter((g) => g.sections.some((s) => s.items.length > 0));
}

// --- Sidebar: flat parse (h2 as section title) ---

function buildSidebarSections(
  recordMap: ExtendedRecordMap,
  blockIds: string[],
): NavSection[] {
  const sections: NavSection[] = [];
  let current: NavSection = { title: "", items: [] };

  for (const id of blockIds) {
    const block = getBlockData(recordMap, id);
    if (!block) continue;

    if (block.type === H1_TYPE || H2_H3_TYPES.has(block.type)) {
      if (current.items.length > 0 || current.title) {
        sections.push({ ...current });
      }
      current = { title: getHeadingText(block), items: [] };
      continue;
    }

    if (block.type === "page" || block.type === "collection_view_page") {
      const item = blockToNavItem(recordMap, block, id);
      if (item) current.items.push(item);
      continue;
    }

    if (block.type === "text") {
      const pageRefs = extractPageRefsFromText(recordMap, block);
      current.items.push(...pageRefs);
      const extLink = extractExternalLinkFromText(block);
      if (extLink) current.items.push(extLink);
    }
  }

  if (current.items.length > 0 || current.title) sections.push(current);
  return sections.filter((s) => s.items.length > 0);
}

// --- Public API ---

function buildNavTree(recordMap: ExtendedRecordMap): NavTree {
  const rootId = getPageIdFromRecordMap(recordMap);
  const rootBlock = getBlockData(recordMap, rootId);
  if (!rootBlock) return { groups: [], sidebar: [] };

  const rootChildren = getBlockChildrenIds(rootBlock);

  const firstChild = rootChildren[0];
  const firstBlock = firstChild
    ? getBlockData(recordMap, firstChild)
    : undefined;

  if (!firstBlock || firstBlock.type !== "column_list") {
    const groups = buildNavGroups(recordMap, rootChildren);
    return { groups, sidebar: [] };
  }

  const columnIds = getBlockChildrenIds(firstBlock);
  const leftColumn = columnIds[0]
    ? getBlockData(recordMap, columnIds[0])
    : undefined;
  const rightColumn = columnIds[1]
    ? getBlockData(recordMap, columnIds[1])
    : undefined;

  const leftChildIds = leftColumn ? getBlockChildrenIds(leftColumn) : [];
  const groups = buildNavGroups(recordMap, leftChildIds);

  const sidebar = rightColumn
    ? buildSidebarSections(recordMap, getBlockChildrenIds(rightColumn))
    : [];

  return { groups, sidebar };
}

export { buildNavTree };
export type { NavGroup, NavItem, NavSection, NavTree };
