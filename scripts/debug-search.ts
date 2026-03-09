// Usage: tsx scripts/debug-search.ts [query] [ancestorId]
export {};
async function main() {
  const { NotionAPI } = await import("notion-client");

  const query = process.argv[2] ?? "test";
  const ancestorId = process.argv[3] ?? "27a4d690237c80f49b23f576fa400ad0";

  const client = new NotionAPI();

  console.log(`Searching "${query}" in ${ancestorId}...`);

  const results = await client.search({
    ancestorId,
    query,
    limit: 10,
    filters: {
      isDeletedOnly: false,
      excludeTemplates: true,
      isNavigableOnly: true,
      requireEditPermissions: false,
    },
  });

  console.log(`\nTotal: ${results.total}`);
  console.log(`Results: ${results.results.length}`);

  for (const result of results.results) {
    console.log(`\n--- ${result.id} (score: ${result.score}) ---`);
    console.log(`  Path: ${result.highlight?.pathText}`);
    console.log(`  Text: ${result.highlight?.text}`);
  }

  // Raw dump du premier résultat pour inspecter la structure
  if (results.results.length > 0) {
    console.log("\n=== RAW first result ===");
    console.log(JSON.stringify(results.results[0], null, 2));

    // Vérifier si les pages sont dans le recordMap
    const firstId = results.results[0].id;
    const inMap = results.recordMap?.block?.[firstId];
    console.log(`\nFirst result in recordMap: ${inMap ? "YES" : "NO"}`);
    if (inMap) {
      console.log(JSON.stringify(inMap, null, 2));
    }
  }
}
main().catch(console.error);
