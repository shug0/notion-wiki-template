/**
 * Debug DOM structure of Notion blocks
 * Renders each block to static HTML and extracts: root tag, classes, data-* attributes
 * Usage: tsx scripts/debug-dom.ts [pageId]
 *
 * Note: Client components ("use client": Toggle) won't render with renderToStaticMarkup — expected.
 */
import * as fs from "node:fs";
import * as path from "node:path";

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

async function main() {
  const pageId = process.argv[2] ?? "27a4d690237c80f49b23f576fa400ad0";
  const env = await readEnvLocal();
  const { NotionAPI } = await import("notion-client");
  const api = new NotionAPI({ authToken: env["NOTION_TOKEN"] });

  console.log(`Fetching page ${pageId}...`);
  const recordMap = await api.getPage(pageId);

  const { getBlockChildrenIds } = await import("../notion/lib/data");
  const { getBlockData } = await import("../notion/lib/notion-compat");

  // notion-client returns keys with dashes; getBlockData needs the exact key format
  const normalizedId = pageId.replace(/-/g, "");
  const dashedId = [
    normalizedId.slice(0, 8),
    normalizedId.slice(8, 12),
    normalizedId.slice(12, 16),
    normalizedId.slice(16, 20),
    normalizedId.slice(20),
  ].join("-");

  const pageBlock =
    getBlockData(recordMap, dashedId) ?? getBlockData(recordMap, normalizedId);
  if (!pageBlock) {
    console.error(
      "Page block not found. Available keys:",
      Object.keys(recordMap.block).slice(0, 3),
    );
    return;
  }

  const childIds = getBlockChildrenIds(pageBlock);
  console.log(`\nFound ${childIds.length} child blocks\n`);

  const header = [
    "Type".padEnd(22),
    "Tag".padEnd(12),
    "Classes (first element)".padEnd(60),
    "Data attrs",
  ].join(" ");
  console.log(header);
  console.log("-".repeat(header.length + 20));

  const { renderToStaticMarkup } = await import("react-dom/server");
  const { getBlockComponent } = await import("../notion/lib/registry");
  const React = await import("react");

  for (const blockId of childIds) {
    const block = getBlockData(recordMap, blockId);
    if (!block) {
      console.log("???".padEnd(22), `(missing: ${blockId})`);
      continue;
    }

    const blockType = block.type as string;

    try {
      const config = getBlockComponent(blockType);
      if (!config) {
        console.log(blockType.padEnd(22), "(no component)");
        continue;
      }

      const { Component, props: extraProps = {} } = config;
      const element = React.createElement(Component as never, {
        block,
        recordMap,
        ...extraProps,
      });

      const html = renderToStaticMarkup(element);

      // Parse root element
      const tagMatch = html.match(/^<(\w+)/);
      const classMatch = html.match(/class="([^"]*)"/);
      const dataAttrs = [...html.matchAll(/data-([a-z-]+)="([^"]*)"/g)]
        .map((m) => `data-${m[1]}=${m[2]}`)
        .join(" ");

      const tag = tagMatch?.[1] ?? "?";
      const classes = classMatch?.[1] ?? "";
      const truncClasses =
        classes.length > 58 ? `${classes.slice(0, 55)}...` : classes;

      console.log(
        blockType.padEnd(22),
        tag.padEnd(12),
        truncClasses.padEnd(60),
        dataAttrs,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const shortMsg = msg.length > 70 ? `${msg.slice(0, 67)}...` : msg;
      console.log(blockType.padEnd(22), `(error: ${shortMsg})`);
    }
  }
}

main().catch(console.error);
