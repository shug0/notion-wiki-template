import { getNotionPage } from "@/lib/notion";
import { NotionOrchestrator } from "@/notion/orchestrator";

export default async function Page() {
  const pageId = process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;

  if (!pageId) {
    throw new Error("NEXT_PUBLIC_ROOT_NOTION_PAGE_ID is not defined");
  }

  const recordMap = await getNotionPage(pageId);

  return <NotionOrchestrator recordMap={recordMap} />;
}
