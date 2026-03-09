"use client";

import {
  IconDatabase,
  IconExternalLink,
  IconLayoutGrid,
  IconTable,
} from "@tabler/icons-react";
import type { Block, CollectionView, ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import type { NotionIconType } from "../types";
import { notionTokens } from "./design-system";
import { NotionIcon } from "./icon";
import { PageTitleRow } from "./page-title-row";

interface CollectionHeaderProps {
  title: string;
  icon?: NotionIconType;
  block: Block;
  recordMap: ExtendedRecordMap;
  views: Array<{ id: string; view: CollectionView }>;
  currentViewId: string;
  onViewChange: (viewId: string) => void;
  /** Show external link button (inline collections only) */
  pageId?: string;
  /** Hide title+icon when already rendered as a page h1 */
  hideTitle?: boolean;
  /** Render title as h1 (full page) instead of h3 (inline) */
  titleAs?: "h1" | "h3";
}

function getViewIcon(type: string) {
  switch (type) {
    case "gallery":
      return IconLayoutGrid;
    default:
      return IconTable;
  }
}

interface ViewSwitcherButtonsProps {
  views: Array<{ id: string; view: CollectionView }>;
  currentViewId: string;
  onViewChange: (viewId: string) => void;
}

export function ViewSwitcherButtons({
  views,
  currentViewId,
  onViewChange,
}: ViewSwitcherButtonsProps) {
  if (views.length <= 1) return null;
  return (
    <div className="flex items-center gap-0.5">
      {views.map(({ id, view }) => {
        const Icon = getViewIcon(view.type);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
              id === currentViewId
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="capitalize">{view.name ?? view.type}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CollectionHeader({
  title,
  icon,
  block,
  recordMap,
  views,
  currentViewId,
  onViewChange,
  pageId,
  hideTitle = false,
  titleAs = "h3",
}: CollectionHeaderProps) {
  const isPageTitle = titleAs === "h1";

  if (isPageTitle && !hideTitle) {
    return (
      <PageTitleRow
        title={title}
        icon={icon}
        block={block}
        recordMap={recordMap}
      />
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-1 py-2 mb-2">
      {!hideTitle && (
        <div className="flex items-center gap-2 min-w-0">
          {icon ? (
            <NotionIcon
              icon={icon}
              block={block}
              recordMap={recordMap}
              size="sm"
              className="leading-none flex-shrink-0"
            />
          ) : (
            <IconDatabase className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <h3 className={cn(notionTokens.text.heading3, "truncate")}>
            {title}
          </h3>
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        <ViewSwitcherButtons
          views={views}
          currentViewId={currentViewId}
          onViewChange={onViewChange}
        />

        {pageId && (
          <a
            href={`/${pageId}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Ouvrir en pleine page"
          >
            <IconExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
