"use client";

import { IconDatabase } from "@tabler/icons-react";
import type {
  Block,
  Collection,
  CollectionView,
  ExtendedRecordMap,
} from "notion-types";
import { useState } from "react";
import { getCollectionTitle } from "../../lib/data";
import {
  getCollectionData,
  getCollectionId,
  getCollectionViewData,
  getViewIds,
} from "../../lib/notion-compat";
import type { NotionIconType } from "../../types";
import { CollectionHeader } from "../../ui/collection-header";
import { PageLink } from "../../ui/page-link";
import { CollectionGalleryView } from "./collection-gallery";
import { CollectionListView } from "./collection-list";
import { CollectionTableView } from "./collection-table";

interface CollectionViewRendererProps {
  block: Block;
  recordMap: ExtendedRecordMap;
  collectionId: string;
  viewId: string;
  collection: Collection;
  view: CollectionView;
}

/**
 * Shared renderer that dispatches to the correct view component
 * based on `view.type`. Used by both CollectionBlock (inline) and
 * NotionOrchestrator (full collection pages).
 */
export function CollectionViewRenderer({
  block,
  recordMap,
  collectionId,
  viewId,
  collection,
  view,
}: CollectionViewRendererProps) {
  switch (view.type) {
    case "table":
      return (
        <CollectionTableView
          block={block}
          recordMap={recordMap}
          collectionId={collectionId}
          viewId={viewId}
          collection={collection}
          view={view}
        />
      );

    case "gallery":
      return (
        <CollectionGalleryView
          block={block}
          recordMap={recordMap}
          collectionId={collectionId}
          viewId={viewId}
          collection={collection}
          view={view}
        />
      );

    case "list":
      return (
        <CollectionListView
          block={block}
          recordMap={recordMap}
          collectionId={collectionId}
          viewId={viewId}
          collection={collection}
          view={view}
        />
      );

    default:
      return (
        <div className="text-muted-foreground">
          Collection view type &ldquo;{view.type}&rdquo; not yet supported
        </div>
      );
  }
}

interface CollectionBlockProps {
  block: Block;
  recordMap: ExtendedRecordMap;
}

export function CollectionBlock({ block, recordMap }: CollectionBlockProps) {
  const viewIds = getViewIds(block);

  // For linked databases, collection_id is in collection_view.format.collection_pointer.id
  const collectionIdFromBlock = getCollectionId(block);
  const collectionIdFromView = (() => {
    if (collectionIdFromBlock || !viewIds[0]) return undefined;
    const cv = getCollectionViewData(recordMap, viewIds[0]) as unknown as
      | Record<string, unknown>
      | undefined;
    const fmt = cv?.format as Record<string, unknown> | undefined;
    const ptr = fmt?.collection_pointer as Record<string, unknown> | undefined;
    return ptr?.id as string | undefined;
  })();
  const collectionId = collectionIdFromBlock ?? collectionIdFromView;
  const isLinked = !collectionIdFromBlock && !!collectionIdFromView;
  const title = getCollectionTitle(recordMap, collectionId);
  const collection = getCollectionData(recordMap, collectionId);
  const icon = collection?.icon as NotionIconType;

  // For linked DBs, link to the source collection_view_page (collection.parent_id)
  // For regular inline DBs, link to the collection_view block itself
  const sourcePageId = isLinked
    ? ((
        (collection as unknown as Record<string, unknown>)?.parent_id as
          | string
          | undefined
      )?.replace(/-/g, "") ?? block.id.replace(/-/g, ""))
    : block.id.replace(/-/g, "");
  const pageId = sourcePageId;

  const [selectedViewId, setSelectedViewId] = useState<string>(
    viewIds[0] ?? "",
  );

  if (!viewIds.length || !collection || !collectionId) {
    return (
      <PageLink
        href={`/${pageId}`}
        title={title}
        icon={icon}
        fallback={<IconDatabase className="w-4 h-4" />}
        block={block}
        recordMap={recordMap}
      />
    );
  }

  const view = getCollectionViewData(recordMap, selectedViewId);

  if (!view) {
    return (
      <PageLink
        href={`/${pageId}`}
        title={title}
        icon={icon}
        fallback={<IconDatabase className="w-4 h-4" />}
        block={block}
        recordMap={recordMap}
      />
    );
  }

  const views = viewIds
    .map((id) => ({ id, view: getCollectionViewData(recordMap, id) }))
    .filter(
      (v): v is { id: string; view: CollectionView } => v.view !== undefined,
    );

  return (
    <div className="my-4">
      <CollectionHeader
        title={title}
        icon={icon}
        block={block}
        recordMap={recordMap}
        views={views}
        currentViewId={selectedViewId}
        onViewChange={setSelectedViewId}
        pageId={pageId}
      />
      <CollectionViewRenderer
        block={block}
        recordMap={recordMap}
        collectionId={collectionId}
        viewId={selectedViewId}
        collection={collection}
        view={view}
      />
    </div>
  );
}
