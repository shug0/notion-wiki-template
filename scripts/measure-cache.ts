import { NotionAPI } from "notion-client";

async function main() {
  const notion = new NotionAPI();
  const id = "1344d690237c808bb94ff13af4f78a60";

  const r1 = await notion.getPage(id, { fetchCollections: false });
  const size1 = JSON.stringify(r1).length;

  const r2 = await notion.getPage(id, {
    fetchCollections: true,
    collectionReducerLimit: 100,
  });
  const size2 = JSON.stringify(r2).length;

  console.log(
    "Sans collections:",
    Math.round(size1 / 1024),
    "KB - blocks:",
    Object.keys(r1.block || {}).length,
  );
  console.log(
    "Avec collections:",
    Math.round(size2 / 1024),
    "KB - blocks:",
    Object.keys(r2.block || {}).length,
  );
  console.log("Collections count:", Object.keys(r2.collection || {}).length);
  console.log("2MB limit:", 2048, "KB");
  console.log(
    "Sans collections cacheable:",
    size1 < 2 * 1024 * 1024 ? "OUI" : "NON",
  );
  console.log(
    "Avec collections cacheable:",
    size2 < 2 * 1024 * 1024 ? "OUI" : "NON",
  );
}

main();
