"use client";

import { IconDice5 } from "@tabler/icons-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type RollProp = {
  label: string;
  type: "text" | "multi_select" | string;
  value: string;
};

export type RollRow = {
  id: string;
  title: string;
  deValue?: number;
  extraProps?: RollProp[];
};

export function CollectionRandomRoll({ rows }: { rows: RollRow[] }) {
  const [picked, setPicked] = useState<RollRow | null>(null);

  if (rows.length === 0) return null;

  function roll() {
    setPicked(rows[Math.floor(Math.random() * rows.length)]);
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <button
        onClick={roll}
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-md border border-border",
          "bg-muted/40 px-3 py-1.5 text-sm font-medium transition-colors",
          "hover:bg-muted cursor-pointer",
        )}
      >
        <IconDice5 className="size-4" />
        Lancer le dé
      </button>

      {picked && (
        <div className="w-full max-w-lg rounded-lg border border-border bg-muted/30 overflow-hidden">
          {/* Header : numéro + titre */}
          <div className="flex items-baseline gap-3 px-4 py-3 border-b border-border bg-muted/40">
            {picked.deValue !== undefined && (
              <span className="text-muted-foreground text-sm tabular-nums font-mono shrink-0">
                #{picked.deValue}
              </span>
            )}
            <span className="font-semibold text-base leading-snug">
              {picked.title}
            </span>
          </div>

          {/* Extra props */}
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
        </div>
      )}
    </div>
  );
}
