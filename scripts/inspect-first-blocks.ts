/**
 * Inspect the first content blocks of the root Notion page
 * to determine what to use as page description for SEO.
 *
 * Usage: tsx scripts/inspect-first-blocks.ts [pageId]
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { NotionAPI } from "notion-client";

async function readEnvLocal(): Promise<Record<string, string>> {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf-8");
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=["']?([^"'\n]*)["']?$/);
    if (match) result[match[1].trim()] = match[2].trim();
  }
  return result;
}

function extractText(properties: Record<string, unknown> | undefined): string {
  if (!properties) return "";
  const title = (properties.title as [string, unknown][][] | undefined) ?? [];
  return title
    .map((chunk) => chunk[0])
    .filter((t) => typeof t === "string")
    .join("")
    .trim();
}

async function main() {
  const env = await readEnvLocal();
  const pageId = process.argv[2] ?? env["NEXT_PUBLIC_ROOT_NOTION_PAGE_ID"];

  if (!pageId) {
    console.error(
      "No pageId found. Pass as arg or set NEXT_PUBLIC_ROOT_NOTION_PAGE_ID in .env.local",
    );
    process.exit(1);
  }

  const api = new NotionAPI();
  const recordMap = await api.getPage(pageId);

  console.log(
    "Total blocks in recordMap:",
    Object.keys(recordMap.block).length,
  );

  const rootId = Object.keys(recordMap.block)[0];
  const raw = recordMap.block[rootId];
  // notion-types@7.7.3 double-nesting issue: value may be nested
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootBlock = (raw as any)?.value?.value ?? (raw as any)?.value;
  if (!rootBlock) {
    console.error("Root block not found");
    process.exit(1);
  }

  console.log("Root block type:", rootBlock.type);
  console.log("Root block content count:", rootBlock.content?.length ?? 0);
  console.log(
    "Root block raw (partial):",
    JSON.stringify(
      {
        type: rootBlock.type,
        content: rootBlock.content?.slice(0, 5),
        properties: rootBlock.properties,
      },
      null,
      2,
    ),
  );

  const children = rootBlock.content ?? [];
  console.log(
    `\nRoot page: "${extractText(rootBlock.properties)}" (${rootId})`,
  );
  console.log(`\nAll blocks (depth ≤ 3):\n`);

  function printBlocks(ids: string[], depth: number) {
    if (depth > 3) return;
    for (const childId of ids.slice(0, 20)) {
      const rawChild = recordMap.block[childId];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const block = (rawChild as any)?.value?.value ?? (rawChild as any)?.value;
      if (!block || !block.type) continue;
      const text = extractText(block.properties);
      const preview = text.length > 100 ? text.slice(0, 100) + "…" : text;
      const indent = "  ".repeat(depth);
      console.log(
        `${indent}[${block.type.padEnd(20)}] ${preview || "(no text)"}`,
      );
      if (block.content?.length) printBlocks(block.content, depth + 1);
    }
  }

  printBlocks(children, 0);
}

main().catch(console.error);
