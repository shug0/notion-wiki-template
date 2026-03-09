import { NotionAPI } from "notion-client";

async function main() {
  const blockId = process.argv[2];

  if (!blockId) {
    console.error("Please provide a Notion Block ID as an argument.");
    process.exit(1);
  }

  console.log(`Fetching block ${blockId}...`);
  const notion = new NotionAPI();

  try {
    // getPage also returns all blocks in the recordMap
    const recordMap = await notion.getPage(blockId);
    const block = recordMap.block[blockId]?.value;

    if (!block) {
      console.log(`Block ${blockId} not found in the recordMap.`);

      // Try to find blocks that have this ID as parent
      const children = Object.values(recordMap.block).filter((b) => {
        // biome-ignore lint/suspicious/noExplicitAny: legacy recordMap structure
        const value = b.value as any;
        return (
          value?.value?.parent_id === blockId || value?.parent_id === blockId
        );
      });

      console.log(`Found ${children.length} blocks with this ID as parent.`);
      children.forEach((c) => {
        // biome-ignore lint/suspicious/noExplicitAny: legacy recordMap structure
        const b = (c.value as any)?.value || (c.value as any);
        console.log(
          `- [${b.type}] ${b.id}: "${b.properties?.title?.[0]?.[0] || ""}"`,
        );
      });

      return;
    }

    console.log("\n--- Block Data ---");
    console.log(JSON.stringify(block, null, 2));

    if (block.content) {
      console.log(`\n--- Children (${block.content.length}) ---`);
      for (const childId of block.content) {
        const child = recordMap.block[childId]?.value;
        if (child) {
          console.log(
            `- [${child.type}] ${childId}: "${child.properties?.title?.[0]?.[0] || ""}"`,
          );
        } else {
          console.log(`- ${childId}: (Not in recordMap)`);
        }
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(`Error fetching block: ${e.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

main().catch(console.error);
