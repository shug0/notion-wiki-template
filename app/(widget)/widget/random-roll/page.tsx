import { notFound } from "next/navigation";
import type { ExtendedRecordMap } from "notion-types";
import { getNotionPage } from "@/lib/notion";
import { getCollectionTitle, getPageIdFromRecordMap } from "@/notion/lib/data";
import {
  getBlockData,
  getCollectionData,
  getCollectionId,
  getViewIds,
  isCollectionBlock,
} from "@/notion/lib/notion-compat";
import { buildRandomRollRows } from "@/notion/lib/random-roll";
import { RandomRollWidget } from "./widget";

export default async function RandomRollWidgetPage({
  searchParams,
}: {
  searchParams: { collection?: string; view?: string };
}) {
  const { collection: collectionPageId, view: viewParam } = await searchParams;

  if (!collectionPageId) notFound();

  let recordMap: ExtendedRecordMap;
  try {
    recordMap = await getNotionPage(collectionPageId);
  } catch {
    notFound();
  }

  const pageId = getPageIdFromRecordMap(recordMap);
  const pageBlock = getBlockData(recordMap, pageId);
  if (!pageBlock || !isCollectionBlock(pageBlock)) notFound();

  const collectionId = getCollectionId(pageBlock) ?? "";
  const collection = getCollectionData(recordMap, collectionId);
  const viewIds = getViewIds(pageBlock);
  const viewId =
    viewParam && viewIds.includes(viewParam) ? viewParam : (viewIds[0] ?? "");

  const rows = buildRandomRollRows(recordMap, collectionId, viewId, collection);
  if (rows.length === 0) notFound();

  const title = getCollectionTitle(recordMap, collectionId) ?? "";

  return <RandomRollWidget rows={rows} title={title} />;
}
