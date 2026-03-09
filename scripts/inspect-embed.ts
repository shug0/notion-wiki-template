async function main() {
  const { NotionAPI } = await import("notion-client");
  const client = new NotionAPI();
  const recordMap = await client.getPage("31b4d690237c80bca294d91aa16b959e");

  for (const entry of Object.values(recordMap.block || {})) {
    const block = (entry as Record<string, unknown>)?.value as
      | Record<string, unknown>
      | undefined;
    const inner =
      (block?.value as Record<string, unknown> | undefined) ?? block;
    if (inner?.type === "embed" || inner?.type === "iframe") {
      console.log("TYPE:", inner.type);
      console.log("format:", JSON.stringify(inner.format, null, 2));
      console.log("properties:", JSON.stringify(inner.properties, null, 2));
    }
  }
}
main().catch(console.error);
