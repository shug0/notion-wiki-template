"use client";

import { IconDice5 } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { RollRow } from "@/notion/ui/collection-random-roll";

function pick(rows: RollRow[]): RollRow {
  return rows[Math.floor(Math.random() * rows.length)];
}

export function RandomRollWidget({
  rows,
  title,
}: {
  rows: RollRow[];
  title: string;
}) {
  const [picked, setPicked] = useState<RollRow | null>(null);

  useEffect(() => {
    setPicked(pick(rows));
  }, [rows]);

  function reroll() {
    setPicked(pick(rows));
  }

  return (
    <div className="min-h-svh bg-background flex items-start justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          <button
            type="button"
            onClick={reroll}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
              "border border-border bg-background hover:bg-muted transition-colors cursor-pointer",
            )}
          >
            <IconDice5 className="size-3.5" />
            Relancer
          </button>
        </div>

        {/* Result */}
        {picked ? (
          <>
            <div className="flex items-baseline gap-3 px-4 py-3 border-b border-border">
              {picked.deValue !== undefined && (
                <span className="text-muted-foreground text-sm tabular-nums font-mono shrink-0">
                  #{picked.deValue}
                </span>
              )}
              <span className="font-semibold text-base leading-snug">
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
        ) : (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            Chargement…
          </div>
        )}
      </div>
    </div>
  );
}
