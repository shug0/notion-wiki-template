"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CollectionView } from "notion-types";
import { ViewSwitcherButtons } from "./collection-header";

interface ViewSwitcherUrlProps {
  views: Array<{ id: string; view: CollectionView }>;
  currentViewId: string;
}

export function ViewSwitcherUrl({
  views,
  currentViewId,
}: ViewSwitcherUrlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleViewChange = (viewId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <ViewSwitcherButtons
      views={views}
      currentViewId={currentViewId}
      onViewChange={handleViewChange}
    />
  );
}
