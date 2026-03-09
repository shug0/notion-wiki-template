"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Block, CollectionView, ExtendedRecordMap } from "notion-types";
import type { NotionIconType } from "../types";
import { CollectionHeader, ViewSwitcherButtons } from "./collection-header";

interface CollectionHeaderUrlProps {
  title: string;
  icon?: NotionIconType;
  block: Block;
  recordMap: ExtendedRecordMap;
  views: Array<{ id: string; view: CollectionView }>;
  currentViewId: string;
}

function useViewChangeHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (viewId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewId);
    router.push(`${pathname}?${params.toString()}`);
  };
}

export function CollectionHeaderUrl({
  title,
  icon,
  block,
  recordMap,
  views,
  currentViewId,
}: CollectionHeaderUrlProps) {
  const handleViewChange = useViewChangeHandler();

  return (
    <CollectionHeader
      title={title}
      icon={icon}
      block={block}
      recordMap={recordMap}
      views={views}
      currentViewId={currentViewId}
      onViewChange={handleViewChange}
      titleAs="h1"
    />
  );
}

export function ViewSwitcherUrl({
  views,
  currentViewId,
}: {
  views: Array<{ id: string; view: CollectionView }>;
  currentViewId: string;
}) {
  const handleViewChange = useViewChangeHandler();
  return (
    <ViewSwitcherButtons
      views={views}
      currentViewId={currentViewId}
      onViewChange={handleViewChange}
    />
  );
}
