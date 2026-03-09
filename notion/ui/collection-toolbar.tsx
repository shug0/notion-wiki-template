"use client";

import { IconDice5, IconExternalLink } from "@tabler/icons-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CollectionView } from "notion-types";
import { useRef, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ViewSwitcherButtons } from "./collection-header";
import type { RollRow } from "./collection-random-roll";

interface CollectionToolbarProps {
  rows?: RollRow[];
  views: Array<{ id: string; view: CollectionView }>;
  currentViewId: string;
  collectionPageId: string;
}

export function CollectionToolbar({
  rows,
  views,
  currentViewId,
  collectionPageId,
}: CollectionToolbarProps) {
  if ((!rows || rows.length === 0) && views.length <= 1) return null;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<RollRow | null>(null);
  const isRolling = useRef(false);

  function roll() {
    if (!rows || rows.length === 0) return;
    isRolling.current = true;
    setPicked(rows[Math.floor(Math.random() * rows.length)]);
    setOpen(true);
    // Reset après que le PopoverTrigger ait pu appeler onOpenChange
    Promise.resolve().then(() => {
      isRolling.current = false;
    });
  }

  function handleViewChange(viewId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", viewId);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasRows = rows && rows.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
      {hasRows && (
        <Popover
          open={open}
          onOpenChange={(v) => {
            if (isRolling.current) return;
            setOpen(v);
          }}
        >
          <div className="inline-flex items-center rounded-md border border-border overflow-hidden">
            <PopoverTrigger
              render={
                <button
                  type="button"
                  onClick={roll}
                  className={cn(
                    "inline-flex items-center gap-2 border-r border-border",
                    "bg-muted/40 px-3 py-1.5 text-sm font-medium transition-colors",
                    "hover:bg-muted cursor-pointer",
                  )}
                >
                  <IconDice5 className="size-4" />
                  Lancer le dé
                </button>
              }
            />
            <a
              href={`/widget/random-roll?collection=${collectionPageId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors",
                "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <IconExternalLink className="size-3.5" />
              <span className="text-xs">Widget</span>
            </a>
          </div>
          <PopoverContent
            align="start"
            side="bottom"
            className="w-80 gap-0 p-0"
          >
            {picked && (
              <>
                <div className="flex items-baseline gap-3 px-4 py-3 border-b border-border">
                  {picked.deValue !== undefined && (
                    <span className="text-muted-foreground text-sm tabular-nums font-mono shrink-0">
                      #{picked.deValue}
                    </span>
                  )}
                  <span className="font-semibold text-sm leading-snug">
                    {picked.title}
                  </span>
                </div>
                {picked.extraProps && picked.extraProps.length > 0 && (
                  <div className="px-4 py-3 flex flex-col gap-2.5">
                    {picked.extraProps.map((prop) => (
                      <div key={prop.label} className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          {prop.label}
                        </span>
                        {prop.type === "multi_select" ? (
                          <div className="flex flex-wrap gap-1.5">
                            {prop.value.split(",").map((tag) => (
                              <span
                                key={tag}
                                className="inline-block rounded-full bg-muted border border-border px-2 py-0.5 text-xs font-medium"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-foreground leading-relaxed">
                            {prop.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </PopoverContent>
        </Popover>
      )}

      <ViewSwitcherButtons
        views={views}
        currentViewId={currentViewId}
        onViewChange={handleViewChange}
      />
    </div>
  );
}
