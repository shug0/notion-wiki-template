// app/notion/[pageId]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPrivateAccessEnabled, PRIVATE_TOGGLE } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import { getSessionStore } from "@/lib/auth/session-cache";
import { getNotionPage, isCollectionBlock } from "@/lib/notion";
import {
  getCollectionDescription,
  getCollectionTitle,
  getPageCover,
  getPageDescription,
  getPageIdFromRecordMap,
  getPageTitle,
} from "@/notion/lib/data";
import { getBlockData } from "@/notion/lib/notion-compat";
import { NotionOrchestrator } from "@/notion/orchestrator";

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("not_found") ||
      error.message.includes("Not Found") ||
      error.message.includes("unauthorized"))
  );
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = await params;
  if (id === "favicon.ico") return {};
  if (!/^[0-9a-f]{32}$/i.test(id.replace(/-/g, ""))) return {};

  let recordMap;
  try {
    recordMap = await getNotionPage(id);
  } catch {
    return {};
  }
  const pageId = getPageIdFromRecordMap(recordMap);
  const pageBlock = getBlockData(recordMap, pageId);
  if (!pageBlock) return {};

  const collectionId = isCollectionBlock(pageBlock)
    ? (pageBlock as { collection_id?: string }).collection_id
    : undefined;
  const title = collectionId
    ? getCollectionTitle(recordMap, collectionId) || getPageTitle(pageBlock)
    : getPageTitle(pageBlock);
  const description = collectionId
    ? (getCollectionDescription(recordMap, collectionId) ??
      getPageDescription(recordMap, pageBlock))
    : getPageDescription(recordMap, pageBlock);
  const rawCoverUrl = getPageCover(pageBlock, recordMap);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const coverUrl = rawCoverUrl
    ? `${siteUrl}/_next/image?url=${encodeURIComponent(rawCoverUrl)}&w=1200&q=75`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      ...(description && { description }),
      ...(coverUrl && { images: [{ url: coverUrl }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      ...(description && { description }),
      ...(coverUrl && { images: [coverUrl] }),
    },
  };
}

export default async function NotionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { view?: string };
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Skip favicon requests and invalid IDs (emojis, non-hex strings)
  if (resolvedParams.id === "favicon.ico") return null;
  if (!/^[0-9a-f]{32}$/i.test(resolvedParams.id.replace(/-/g, ""))) {
    notFound();
  }

  let recordMap;
  try {
    recordMap = await getNotionPage(resolvedParams.id);
  } catch (error) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  // Seed session cache for all blocks in this render tree (callout, etc.)
  if (isPrivateAccessEnabled()) {
    const session = await getSession();
    getSessionStore().user = session;

    // Private page check — double defense (middleware is not sufficient alone)
    const pageId = getPageIdFromRecordMap(recordMap);
    const pageBlock = getBlockData(recordMap, pageId);
    const pageIcon = (pageBlock?.format as { page_icon?: string } | undefined)
      ?.page_icon;

    if (pageIcon === PRIVATE_TOGGLE && !session) notFound();
  }

  return (
    <NotionOrchestrator
      recordMap={recordMap}
      selectedViewId={resolvedSearchParams.view}
    />
  );
}
