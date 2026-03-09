import type { MetadataRoute } from "next";
import { getNotionPage } from "@/lib/notion";
import { buildNavTree } from "@/notion/lib/nav-tree";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pageId = process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;
  if (!pageId) return [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const recordMap = await getNotionPage(pageId);
  const navTree = buildNavTree(recordMap);

  const hrefs = new Set<string>();

  for (const group of navTree.groups) {
    for (const section of group.sections) {
      for (const item of section.items) {
        if (!item.href.startsWith("http")) hrefs.add(item.href);
      }
    }
  }

  for (const section of navTree.sidebar) {
    for (const item of section.items) {
      if (!item.href.startsWith("http")) hrefs.add(item.href);
    }
  }

  return Array.from(hrefs).map((href) => ({
    url: `${siteUrl}${href}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
