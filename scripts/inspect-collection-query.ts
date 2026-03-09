import { NotionAPI } from "notion-client";
import type { ExtendedRecordMap } from "notion-types";

async function main() {
  const pageId = process.argv[2] || "2694d690237c805ea645f30b51094db1";

  console.log(`\n🔍 Inspecting collection query structure for: ${pageId}\n`);

  const notion = new NotionAPI();
  const recordMap: ExtendedRecordMap = await notion.getPage(pageId, {
    fetchCollections: true,
    collectionReducerLimit: 100,
  });

  // Find collection blocks
  const blocks = Object.values(recordMap.block);
  const collectionBlocks = blocks.filter((rawBlock) => {
    const blockData =
      (rawBlock?.value as unknown as Record<string, unknown>)?.value ||
      rawBlock?.value;
    const type = (blockData as unknown as Record<string, unknown>)?.type;
    return type === "collection_view" || type === "collection_view_page";
  });

  if (collectionBlocks.length === 0) {
    console.log("❌ No collection blocks found");
    return;
  }

  // Analyze each collection
  collectionBlocks.forEach((rawBlock, index) => {
    const blockData =
      (rawBlock?.value as unknown as Record<string, unknown>)?.value ||
      rawBlock?.value;
    const block = blockData as unknown as Record<string, unknown>;

    const collectionId = block.collection_id as string;
    const viewIds = (block.view_ids as string[]) || [];

    console.log(`${"=".repeat(80)}`);
    console.log(`Collection #${index + 1}: ${block.id}`);
    console.log(`${"=".repeat(80)}\n`);

    console.log(`Collection ID: ${collectionId}`);
    console.log(`View IDs: ${viewIds.join(", ")}\n`);

    // Check if collection_query exists
    const collectionQuery = recordMap.collection_query?.[collectionId];
    if (!collectionQuery) {
      console.log("❌ No collection_query data for this collection\n");
      return;
    }

    console.log("✅ collection_query exists\n");

    // Inspect each view
    viewIds.forEach((viewId, vIndex) => {
      console.log(`${"─".repeat(80)}`);
      console.log(`View #${vIndex + 1}: ${viewId}`);
      console.log(`${"─".repeat(80)}\n`);

      const queryResult = collectionQuery[viewId];
      if (!queryResult) {
        console.log("❌ No query results for this view\n");
        return;
      }

      // Show the structure
      console.log("📊 Query Result Structure:");
      console.log(`   Keys: ${Object.keys(queryResult).join(", ")}\n`);

      // Check for blockIds (simple view)
      const blockIds = (queryResult as { blockIds?: string[] }).blockIds;
      if (blockIds) {
        console.log(`✅ blockIds found: ${blockIds.length} items`);
        console.log(`   First 5: ${blockIds.slice(0, 5).join(", ")}\n`);
      } else {
        console.log("❌ No blockIds property\n");
      }

      // Check for table_groups (grouped view)
      const queryObj = queryResult as unknown as Record<string, unknown>;
      const tableGroups = queryObj.table_groups as
        | { results?: unknown[]; type?: string; version?: string }
        | undefined;

      if (tableGroups) {
        console.log("✅ table_groups found:");
        console.log(`   Type: ${tableGroups.type}`);
        console.log(`   Version: ${tableGroups.version}`);
        console.log(`   Results: ${tableGroups.results?.length || 0} groups\n`);

        if (tableGroups.results && tableGroups.results.length > 0) {
          console.log("📋 First group structure:");
          const firstGroup = tableGroups.results[0] as Record<string, unknown>;
          console.log(`   Keys: ${Object.keys(firstGroup).join(", ")}`);
          console.log(
            `   Full structure:\n${JSON.stringify(firstGroup, null, 2)}\n`,
          );

          // Try to extract IDs
          console.log("🔍 Attempting to extract row IDs from groups:");
          const extractedIds: string[] = [];

          for (const group of tableGroups.results) {
            const g = group as Record<string, unknown>;

            // Method 1: group.value.value.id
            const valueObj = g.value as Record<string, unknown> | undefined;
            const nestedValue = valueObj?.value as
              | Record<string, unknown>
              | undefined;
            const groupId = nestedValue?.id as string | undefined;

            if (groupId) {
              extractedIds.push(groupId);
              console.log(`   ✓ Found ID in value.value.id: ${groupId}`);
            }

            // Method 2: group.blockIds
            const groupBlockIds = g.blockIds as string[] | undefined;
            if (groupBlockIds) {
              extractedIds.push(...groupBlockIds);
              console.log(`   ✓ Found ${groupBlockIds.length} IDs in blockIds`);
            }

            // Method 3: group.aggregationResults
            const aggResults = g.aggregationResults as
              | Array<Record<string, unknown>>
              | undefined;
            if (aggResults) {
              console.log(
                `   • aggregationResults: ${aggResults.length} items`,
              );
            }
          }

          console.log(`\n   📦 Total extracted IDs: ${extractedIds.length}`);
          if (extractedIds.length > 0) {
            console.log(`   First 5: ${extractedIds.slice(0, 5).join(", ")}`);
          }
          console.log();
        }
      } else {
        console.log("❌ No table_groups property\n");
      }

      // Check other possible keys
      const otherKeys = Object.keys(queryObj).filter(
        (k) => k !== "blockIds" && k !== "table_groups",
      );
      if (otherKeys.length > 0) {
        console.log("🔍 Other keys in query result:");
        for (const key of otherKeys.slice(0, 5)) {
          const value = queryObj[key];
          const valueType = Array.isArray(value)
            ? `Array[${(value as unknown[]).length}]`
            : typeof value;
          console.log(`   - ${key}: ${valueType}`);
        }
        console.log();
      }

      // Check if rows exist in recordMap.block
      console.log("🔍 Checking if row blocks exist in recordMap.block:");
      const allBlockIds = Object.keys(recordMap.block);
      console.log(`   Total blocks in recordMap: ${allBlockIds.length}\n`);

      // Try to find page blocks that could be rows
      const pageBlocks = allBlockIds
        .map((id) => {
          const block = recordMap.block[id]?.value;
          const blockObj = block as unknown as Record<string, unknown>;
          return {
            id,
            type: blockObj?.type,
            parent: blockObj?.parent_id,
          };
        })
        .filter((b) => b.type === "page" && b.parent === collectionId);

      if (pageBlocks.length > 0) {
        console.log(
          `✅ Found ${pageBlocks.length} page blocks with parent = collectionId`,
        );
        console.log(
          `   First 5 IDs: ${pageBlocks
            .slice(0, 5)
            .map((b) => b.id)
            .join(", ")}\n`,
        );
      } else {
        console.log("❌ No page blocks found with parent = collectionId\n");
      }
    });
  });

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80) + "\n");
  console.log("This script shows:");
  console.log("1. Whether blockIds exists (simple views)");
  console.log("2. Whether table_groups exists (grouped views)");
  console.log("3. The exact structure of the data");
  console.log("4. How to extract row IDs from the actual structure\n");
}

main().catch(console.error);
