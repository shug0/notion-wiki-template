import { IconForms } from "@tabler/icons-react";
import type {
  Block,
  CollectionView,
  Decoration,
  ExtendedRecordMap,
  PageBlock,
} from "notion-types";
import { Container } from "@/components/ui/container";
import { CollectionViewRenderer } from "./blocks/data/collection.block";
import { BlockChildren } from "./lib/block-children";
import { convertDecorationToRichText } from "./lib/conversion";
import { getCollectionTitle, getPageIdFromRecordMap } from "./lib/data";
import {
  getBlockData,
  getCollectionData,
  getCollectionId,
  getCollectionViewData,
  getQueryBlockIds,
  getViewIds,
  isCollectionBlock,
} from "./lib/notion-compat";
import { buildRandomRollRows } from "./lib/random-roll";
import { NotionHeader } from "./renderers/header";
import { TextRenderer } from "./renderers/text";
import type { NotionIconType } from "./types";
import { CollectionHeaderUrl } from "./ui/collection-header-url";
import { CollectionToolbar } from "./ui/collection-toolbar";

function FormFallback() {
  return (
    <div className="my-4 flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      <IconForms className="mt-0.5 size-4 shrink-0" />
      <span>
        Ce formulaire est un contenu natif Notion — non pris en charge par ce
        site.
      </span>
    </div>
  );
}

/**
 * Orchestrates the rendering of a full Notion page.
 */
export function NotionOrchestrator({
  recordMap,
  selectedViewId,
}: {
  recordMap: ExtendedRecordMap;
  selectedViewId?: string;
}) {
  const pageId = getPageIdFromRecordMap(recordMap);
  const pageBlock = getBlockData(recordMap, pageId) as PageBlock | undefined;

  if (!pageBlock) {
    return (
      <Container className="py-8">
        <p className="text-destructive font-medium">
          ❌ Page content missing or inaccessible
        </p>
      </Container>
    );
  }

  const isWidePage = !!pageBlock.format?.page_full_width;

  // Check if this is a collection page (both collection_view and collection_view_page)
  // PageBlock is part of the Block union, so this cast is safe
  const block = pageBlock as Block;
  const isCollectionPage = isCollectionBlock(block);

  // If it's a collection page, render the collection view instead of children
  if (isCollectionPage) {
    const collectionId = getCollectionId(block);
    const viewIds = getViewIds(block);
    const collection = getCollectionData(recordMap, collectionId);

    // Determine which view to show (from URL or default to first)
    const viewId =
      selectedViewId && viewIds.includes(selectedViewId)
        ? selectedViewId
        : viewIds[0];
    const view = viewId ? getCollectionViewData(recordMap, viewId) : undefined;

    // Get collection title and icon
    const collectionTitle = getCollectionTitle(recordMap, collectionId);
    const collectionIcon = collection?.icon as NotionIconType;

    // Build views array for the switcher
    const views = viewIds
      .map((id) => {
        const v = getCollectionViewData(recordMap, id);
        return v ? { id, view: v } : null;
      })
      .filter((v): v is { id: string; view: CollectionView } => v !== null);

    const rawDescription = (collection as unknown as Record<string, unknown>)
      ?.description as Decoration[] | undefined;
    const collectionDescription = rawDescription?.length
      ? convertDecorationToRichText(rawDescription)
      : null;

    const randomRollRows = buildRandomRollRows(
      recordMap,
      collectionId ?? "",
      viewId ?? "",
      collection,
    );

    const containerSize =
      isWidePage || view?.type === "table" || view?.type === "gallery"
        ? "wide"
        : "default";

    const collectionContent = (
      <main
        id="main-content"
        className="notion-page animate-in fade-in duration-500"
      >
        <NotionHeader
          recordMap={recordMap}
          pageBlock={pageBlock}
          title={collectionTitle}
          icon={collectionIcon}
          containerSize={containerSize}
          hideTitle
        />

        <Container className="pb-16" size={containerSize}>
          <div className="notion-content">
            {viewId && (
              <CollectionHeaderUrl
                title={collectionTitle}
                icon={collectionIcon}
                block={block}
                recordMap={recordMap}
                views={views}
                currentViewId={viewId}
              />
            )}

            {collectionDescription && collectionDescription.length > 0 && (
              <p className="text-muted-foreground text-sm mb-8 -mt-5 whitespace-pre-line">
                <TextRenderer
                  text={collectionDescription}
                  recordMap={recordMap}
                />
              </p>
            )}

            {viewId && (randomRollRows.length > 0 || views.length > 1) && (
              <CollectionToolbar
                rows={randomRollRows}
                views={views}
                currentViewId={viewId}
                collectionPageId={pageId}
              />
            )}

            {/* Collection view */}
            {collection && collectionId && viewId && view ? (
              <CollectionViewRenderer
                block={block}
                recordMap={recordMap}
                collectionId={collectionId}
                viewId={viewId}
                collection={collection}
                view={view}
              />
            ) : (
              <div className="text-muted-foreground">
                Collection data incomplete
              </div>
            )}
          </div>
        </Container>
      </main>
    );

    return collectionContent;
  }

  // Regular page rendering
  const pageContent = (
    <main
      id="main-content"
      className="notion-page animate-in fade-in duration-500"
    >
      {/* Centralized Page Header (Breadcrumbs, Cover, Title) */}
      <NotionHeader recordMap={recordMap} pageBlock={pageBlock} />

      <Container className="pb-16" size={isWidePage ? "wide" : "default"}>
        <div className="notion-content">
          {(block.type as string) === "form" ? (
            <FormFallback />
          ) : (
            <BlockChildren block={pageBlock} recordMap={recordMap} />
          )}
        </div>
      </Container>
    </main>
  );

  return pageContent;
}
