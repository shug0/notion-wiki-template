/**
 * Universal page debugger — dumps everything an AI agent needs.
 * Usage: tsx scripts/debug-page.ts <pageId>
 *
 * Outputs:
 *  1. Main block info (type, parent, format)
 *  2. Block summary (count per type)
 *  3. Collections: schema, views (type, groupBy), query results
 *  4. Diagnostics: empty queries, missing relation targets, errors
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";

// ── Helpers ──────────────────────────────────────────────

function readEnvLocal(): Record<string, string> {
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function unwrap(entry: any): any {
  if (!entry?.value) return undefined;
  if (typeof entry.value.role === "string" && entry.value.value) {
    return entry.value.value;
  }
  return entry.value;
}

function heading(title: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

function sub(title: string) {
  console.log(`\n  ── ${title} ${"─".repeat(Math.max(0, 50 - title.length))}`);
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const pageId = process.argv[2];
  if (!pageId) {
    console.error("Usage: tsx scripts/debug-page.ts <pageId>");
    process.exit(1);
  }

  const env = readEnvLocal();
  const api = new NotionAPI({ authToken: env.NOTION_TOKEN });

  console.log(`Fetching page ${pageId}...`);
  const recordMap: ExtendedRecordMap = await api.getPage(pageId, {
    fetchCollections: true,
    signFileUrls: false,
  });

  const diagnostics: string[] = [];

  // ── 1. Main block ────────────────────────────────────
  heading("1. MAIN BLOCK");
  // Try both raw ID and dashed format
  const dashedId = pageId.replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
    "$1-$2-$3-$4-$5",
  );
  const mainBlock =
    unwrap(recordMap.block[pageId]) || unwrap(recordMap.block[dashedId]);
  if (mainBlock) {
    console.log(`  type:          ${mainBlock.type}`);
    console.log(`  parent_table:  ${mainBlock.parent_table}`);
    console.log(`  parent_id:     ${mainBlock.parent_id}`);
    console.log(`  collection_id: ${mainBlock.collection_id || "—"}`);
    console.log(
      `  view_ids:      ${(mainBlock.view_ids || []).join(", ") || "—"}`,
    );
    if (mainBlock.format) {
      const fmt = mainBlock.format;
      if (fmt.page_icon) console.log(`  icon:          ${fmt.page_icon}`);
      if (fmt.page_cover) console.log(`  cover:         ${fmt.page_cover}`);
    }
    const content = mainBlock.content as string[] | undefined;
    console.log(`  children:      ${content?.length ?? 0} blocks`);
  } else {
    console.log("  ⚠ Block not found in recordMap");
    diagnostics.push(`Main block ${pageId} not found`);
  }

  // ── 2. Block summary ────────────────────────────────
  heading("2. BLOCK SUMMARY");
  const typeCounts = new Map<string, number>();
  for (const entry of Object.values(recordMap.block)) {
    const block = unwrap(entry);
    const t = block?.type || "unknown";
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
  }
  const total = Object.keys(recordMap.block).length;
  console.log(`  Total: ${total} blocks`);
  for (const [type, count] of [...typeCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`    ${type.padEnd(30)} ${count}`);
  }

  // ── 3. Collections ──────────────────────────────────
  // Build set of "primary" collection IDs (directly displayed on page via a block)
  const primaryCollectionIds = new Set<string>();
  for (const entry of Object.values(recordMap.block)) {
    const block = unwrap(entry);
    if (block?.collection_id) primaryCollectionIds.add(block.collection_id);
  }

  const collectionIds = Object.keys(recordMap.collection || {});
  heading(`3. COLLECTIONS (${collectionIds.length})`);

  for (const collId of collectionIds) {
    const coll = unwrap(recordMap.collection[collId]);
    if (!coll) continue;

    const name = coll.name?.[0]?.[0] || "(untitled)";
    const isPrimary = primaryCollectionIds.has(collId);
    const schema = coll.schema || {};
    const schemaEntries = Object.entries(schema) as [string, any][];

    sub(
      `Collection: ${name} [${collId}] ${isPrimary ? "(PRIMARY)" : "(relation-only)"}`,
    );
    console.log(`  icon:   ${coll.icon || "—"}`);
    console.log(`  schema: ${schemaEntries.length} properties`);

    for (const [propId, propSchema] of schemaEntries) {
      const extra =
        propSchema.type === "relation"
          ? ` → ${propSchema.collection_id || "?"}`
          : propSchema.type === "select" || propSchema.type === "multi_select"
            ? ` [${(propSchema.options || []).map((o: any) => o.value).join(", ")}]`
            : "";
      console.log(
        `    ${propId.padEnd(6)} ${propSchema.type.padEnd(14)} "${propSchema.name}"${extra}`,
      );
    }

    // Find blocks that reference this collection (to get view_ids)
    const viewBlocks: any[] = [];
    for (const entry of Object.values(recordMap.block)) {
      const block = unwrap(entry);
      if (block?.collection_id === collId) viewBlocks.push(block);
    }

    // Views
    const allViewIds = new Set<string>();
    for (const vb of viewBlocks) {
      for (const vid of vb.view_ids || []) allViewIds.add(vid);
    }

    let hasViewInRecordMap = false;
    sub(`Views (${allViewIds.size})`);
    for (const vid of allViewIds) {
      const cv = unwrap((recordMap.collection_view as any)?.[vid]);
      if (!cv) {
        console.log(`    ${vid} — (not in recordMap, view not fetched)`);
        continue;
      }
      hasViewInRecordMap = true;
      const groupBy = cv.format?.collection_group_by;
      const groups = cv.format?.collection_groups;
      console.log(`    ${vid}`);
      console.log(`      type:    ${cv.type}`);
      console.log(
        `      groupBy: ${groupBy ? `${groupBy.type} on prop "${groupBy.property}"` : "none"}`,
      );
      if (groups) {
        console.log(
          `      groups:  ${groups.length} (hidden: ${groups.filter((g: any) => g.hidden).length})`,
        );
      }
      if (cv.query2) {
        const q2keys = Object.keys(cv.query2);
        console.log(`      query2:  {${q2keys.join(", ")}}`);
      }
    }

    // Query results
    sub("Query Results");
    const collQuery = recordMap.collection_query?.[collId];
    if (!collQuery || Object.keys(collQuery).length === 0) {
      if (isPrimary && hasViewInRecordMap) {
        console.log(
          "    ⚠ EMPTY — no collection_query results (views were fetched but query failed)",
        );
        diagnostics.push(
          `Collection "${name}" [${collId}]: collection_query is EMPTY despite views being fetched`,
        );
      } else if (isPrimary) {
        console.log("    (empty — views not fetched for this page context)");
      } else {
        console.log("    (empty — expected for relation-only collection)");
      }
    } else {
      for (const [vid, results] of Object.entries(collQuery)) {
        const r = results as Record<string, any>;
        const reducerKeys = Object.keys(r);
        console.log(`    view ${vid}:`);
        for (const key of reducerKeys) {
          const reducer = r[key];
          const blockIds = reducer?.blockIds;
          const groupResults = reducer?.results;
          if (blockIds) {
            console.log(
              `      ${key}: ${blockIds.length} items${reducer.hasMore ? " (hasMore)" : ""}`,
            );
            if (blockIds.length <= 10) {
              console.log(`        ids: ${blockIds.join(", ")}`);
            }
          } else if (groupResults) {
            console.log(`      ${key}: ${groupResults.length} groups`);
          } else {
            console.log(
              `      ${key}: ${JSON.stringify(reducer).slice(0, 120)}`,
            );
          }
        }
      }
    }
  }

  // ── 4. Relations diagnostic ─────────────────────────
  heading("4. RELATIONS");
  let missingCount = 0;
  const checkedRelations = new Set<string>();

  for (const entry of Object.values(recordMap.block)) {
    const block = unwrap(entry);
    if (block?.parent_table !== "collection" || !block.properties) continue;

    const coll = unwrap(recordMap.collection[block.parent_id]);
    const schema = coll?.schema || {};

    for (const [propId, propSchema] of Object.entries(schema) as [
      string,
      any,
    ][]) {
      if (propSchema.type !== "relation") continue;
      const decorations = block.properties[propId];
      if (!Array.isArray(decorations)) continue;

      for (const dec of decorations) {
        if (!Array.isArray(dec) || dec[0] !== "⁣") continue;
        const pointer = dec[1]?.[0];
        if (
          Array.isArray(pointer) &&
          pointer[0] === "p" &&
          typeof pointer[1] === "string"
        ) {
          const targetId = pointer[1];
          if (checkedRelations.has(targetId)) continue;
          checkedRelations.add(targetId);
          if (!recordMap.block[targetId]) {
            missingCount++;
            if (missingCount <= 10) {
              console.log(
                `  ⚠ Missing: ${targetId} (prop "${propSchema.name}" of block ${block.id})`,
              );
            }
          }
        }
      }
    }
  }
  if (missingCount === 0) {
    console.log("  ✓ All relation targets present in recordMap");
  } else {
    console.log(`  Total missing: ${missingCount}`);
    diagnostics.push(
      `${missingCount} relation target(s) missing from recordMap`,
    );
  }

  // ── 5. Diagnostics summary ──────────────────────────
  heading("5. DIAGNOSTICS");
  if (diagnostics.length === 0) {
    console.log("  ✓ No issues detected");
  } else {
    for (const d of diagnostics) {
      console.log(`  ⚠ ${d}`);
    }
  }

  console.log("");
}

main().catch(console.error);
