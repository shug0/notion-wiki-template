import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";
import {
  getBlockChildrenIds,
  getCollectionTitle,
  getPageIdFromRecordMap,
  getPageTitle,
} from "../notion/lib/data";
import { buildNavTree } from "../notion/lib/nav-tree";
import { getBlockData, getCollectionId } from "../notion/lib/notion-compat";

function printBlockTree(
  recordMap: ExtendedRecordMap,
  blockIds: string[],
  indent = 0,
  maxDepth = 5,
) {
  if (indent >= maxDepth) return;
  const pad = "  ".repeat(indent);

  for (const id of blockIds) {
    const block = getBlockData(recordMap, id);
    if (!block) {
      console.log(`${pad}${id.substring(0, 8)}  ???`);
      continue;
    }
    const type = block.type;
    let label = "";

    if (type === "page") {
      label = getPageTitle(block);
    } else if (type === "collection_view_page") {
      const colId = getCollectionId(block);
      label = colId
        ? getCollectionTitle(recordMap, colId)
        : getPageTitle(block);
    } else if (
      type === "header" ||
      type === "sub_header" ||
      type === "sub_sub_header"
    ) {
      label = block.properties?.title?.[0]?.[0] ?? "";
    } else if (type === "text") {
      const title = block.properties?.title;
      if (title) {
        const textParts: string[] = [];
        for (const segment of title) {
          const text = segment[0] ?? "";
          const decorations = segment[1];
          if (decorations) {
            for (const deco of decorations) {
              if (deco[0] === "a") textParts.push(`${text} [→${deco[1]}]`);
              else if (deco[0] === "p")
                textParts.push(`${text} [page:${deco[1]}]`);
            }
            if (
              !decorations.some((d: unknown[]) => d[0] === "a" || d[0] === "p")
            )
              textParts.push(text);
          } else {
            textParts.push(text);
          }
        }
        label = textParts.join("").substring(0, 100);
      }
    }

    const icon = block.format?.page_icon ?? "";
    console.log(
      `${pad}${id.substring(0, 8)}  ${type.padEnd(25)} ${icon} ${label}`,
    );

    const children = getBlockChildrenIds(block);
    if (children.length > 0) {
      printBlockTree(recordMap, children, indent + 1, maxDepth);
    }
  }
}

async function main() {
  const pageId = process.argv[2] || process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;
  const verbose =
    process.argv.includes("--verbose") || process.argv.includes("-v");

  if (!pageId) {
    console.error(
      "Usage: npx tsx scripts/debug-nav-tree.ts [pageId] [--verbose]\n" +
        "Or set NEXT_PUBLIC_ROOT_NOTION_PAGE_ID in .env",
    );
    process.exit(1);
  }

  console.log(`Fetching recordMap for ${pageId}...\n`);
  const notion = new NotionAPI();
  const recordMap = await notion.getPage(pageId);

  if (verbose) {
    const rootId = getPageIdFromRecordMap(recordMap);
    const rootBlock = getBlockData(recordMap, rootId)!;
    console.log(
      `Root: ${rootId} (${rootBlock.type}), ${Object.keys(recordMap.block).length} blocks total\n`,
    );
    console.log("=== Full Block Tree ===\n");
    printBlockTree(recordMap, getBlockChildrenIds(rootBlock));
    console.log();
  }

  const { groups, sidebar } = buildNavTree(recordMap);

  console.log("=== Nav Groups ===\n");
  for (const group of groups) {
    console.log(`[${group.title || "(ungrouped)"}]`);
    for (const section of group.sections) {
      if (section.title) console.log(`  ## ${section.title}`);
      for (const item of section.items) {
        const icon = item.icon ? `${item.icon} ` : "  ";
        console.log(`    ${icon}${item.title}  →  ${item.href}`);
      }
    }
  }

  if (sidebar.length > 0) {
    console.log("\n=== Sidebar ===\n");
    for (const section of sidebar) {
      console.log(`[${section.title || "(ungrouped)"}]`);
      for (const item of section.items) {
        const icon = item.icon ? `${item.icon} ` : "  ";
        console.log(`  ${icon}${item.title}  →  ${item.href}`);
      }
    }
  }

  const totalItems =
    groups.reduce(
      (n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0),
      0,
    ) + sidebar.reduce((n, s) => n + s.items.length, 0);
  console.log(
    `\nTotal: ${groups.length} groups, ${sidebar.length} sidebar groups, ${totalItems} items`,
  );
}

main().catch(console.error);
