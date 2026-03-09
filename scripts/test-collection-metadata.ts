/**
 * Test script: inspect collection metadata for generateMetadata
 * Usage: pnpm tsx scripts/test-collection-metadata.ts <page-id>
 */
async function main() {
  const pageId = process.argv[2] || "31b4d690237c80dd9076f5f7763dcf7d";
  console.log(`\nTesting collection metadata for: ${pageId}\n`);

  const { NotionAPI } = await import("notion-client");
  const client = new NotionAPI();
  const recordMap = await client.getPage(pageId);

  // Find collection
  const colKeys = Object.keys(recordMap.collection || {});
  if (!colKeys.length) {
    console.log("No collection found in recordMap");
    return;
  }

  const collectionId = colKeys[0];
  const collection = recordMap.collection[collectionId]?.value?.value;
  if (!collection) {
    console.log("Collection value not found");
    return;
  }

  console.log("=== Collection raw ===");
  console.log("name:", JSON.stringify(collection.name));
  console.log("description:", JSON.stringify(collection.description));

  // Notation Notion : Decoration[][] = Array<[text, annotations?]>
  // Les mentions de page ont une annotation ["p", pageId, spaceId]
  type Annotation = [string, ...unknown[]];
  type Decoration = [string, Annotation[]?];

  const decorationToPlainText = (
    decorations: Decoration[] | undefined,
  ): string => {
    if (!decorations) return "";
    return decorations
      .map(([text, annotations]) => {
        const pAnnotation = annotations?.find(([type]) => type === "p");
        if (pAnnotation) {
          const mentionedId = (pAnnotation[1] as string).replace(/-/g, "");
          const blockEntry = Object.entries(recordMap.block || {}).find(
            ([id]) => id.replace(/-/g, "") === mentionedId,
          );
          if (blockEntry) {
            const block = blockEntry[1]?.value?.value;
            const titleProp = block?.properties?.title as
              | Decoration[]
              | undefined;
            if (titleProp) return titleProp.map(([t]) => t).join("");
          }
          return "";
        }
        return text === "‣" ? "" : text;
      })
      .join("")
      .replace(/\n/g, " ")
      .trim();
  };

  const description = decorationToPlainText(
    collection.description as Decoration[],
  );

  console.log("\n=== Plain text description ===");
  console.log(description || "(empty)");

  // Items de la collection
  const pageBlocks = Object.entries(recordMap.block || {})
    .filter(([, entry]) => {
      const b = entry?.value?.value;
      return b?.type === "page" && b?.parent_id === collection.id;
    })
    .map(([, entry]) => entry?.value?.value);

  const sampleTitles = pageBlocks.slice(0, 5).map((b) => {
    const titleProp = b?.properties?.title as Decoration[] | undefined;
    return titleProp?.[0]?.[0] || "?";
  });

  console.log(`\n=== Items: ${pageBlocks.length} pages ===`);
  console.log("Sample:", sampleTitles);

  console.log("\n=== Proposed metadata ===");
  const title = (collection.name as Decoration[])?.[0]?.[0] || "Database";
  const finalDescription =
    description || (sampleTitles.length ? sampleTitles.join(", ") : undefined);

  const truncated =
    finalDescription && finalDescription.length > 160
      ? finalDescription.slice(0, 157) + "…"
      : finalDescription;

  console.log("title:", title);
  console.log("description:", truncated);
}

main().catch(console.error);
