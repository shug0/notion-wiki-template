import { Suspense } from "react";
import { getNotionPage } from "@/lib/notion";
import { getPageIdFromRecordMap, mapImageUrl } from "@/notion/lib/data";
import { getBlockData } from "@/notion/lib/notion-compat";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const pageId = process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;
  let coverUrl: string | undefined;

  if (pageId) {
    try {
      const recordMap = await getNotionPage(pageId);
      const rootId = getPageIdFromRecordMap(recordMap);
      const rootBlock = getBlockData(recordMap, rootId);
      const cover = rootBlock?.format?.page_cover;
      if (cover && typeof cover === "string") {
        coverUrl = mapImageUrl(cover, rootBlock, recordMap) ?? undefined;
      }
    } catch {
      // Cover non disponible — page login reste fonctionnelle sans image
    }
  }

  return (
    <Suspense>
      <LoginForm coverUrl={coverUrl} />
    </Suspense>
  );
}
