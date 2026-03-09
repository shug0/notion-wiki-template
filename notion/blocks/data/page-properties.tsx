"use client";

import { IconDatabase } from "@tabler/icons-react";
import type { ExtendedRecordMap, PageBlock, PropertyType } from "notion-types";
import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getPropertyValue } from "../../lib/data";
import { getCollectionData } from "../../lib/notion-compat";
import { PropertyCell } from "./property-cell";

const EXCLUDED_TYPES = new Set<PropertyType>(["created_by", "last_edited_by"]);

function isPropertyEmpty(value: unknown, type: PropertyType): boolean {
  if (EXCLUDED_TYPES.has(type)) return true;
  if (!Array.isArray(value) || value.length === 0) return true;
  const firstItem = (value as Array<unknown>)[0];
  if (!Array.isArray(firstItem)) return true;
  const str = (firstItem as Array<unknown>)[0];
  return str === undefined || str === null || str === "";
}

interface PagePropertiesProps {
  pageBlock: PageBlock;
  recordMap: ExtendedRecordMap;
  className?: string;
}

export function PageProperties({
  pageBlock,
  recordMap,
  className,
}: PagePropertiesProps) {
  if (pageBlock.parent_table !== "collection") return null;

  const collection = getCollectionData(recordMap, pageBlock.parent_id);
  if (!collection?.schema) return null;

  const properties = Object.entries(collection.schema)
    .filter(([id, schemaProp]) => {
      if (schemaProp.type === "title") return false;
      const value = getPropertyValue(pageBlock, id);
      return !isPropertyEmpty(value, schemaProp.type as PropertyType);
    })
    .map(([id, schemaProp]) => ({
      id,
      name: schemaProp.name,
      type: schemaProp.type as PropertyType,
      value: getPropertyValue(pageBlock, id),
    }));

  if (properties.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card",
          "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted transition-colors",
          className,
        )}
      >
        <IconDatabase size={12} />
        <span className="text-[10px] uppercase tracking-wider font-medium">
          Propriétés
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-fit p-3">
        <dl className="grid grid-cols-[minmax(100px,auto)_1fr] gap-x-4 gap-y-1.5">
          {properties.map(({ id, name, type, value }) => (
            <React.Fragment key={id}>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap self-center">
                {name}
              </dt>
              <dd
                className="text-sm min-w-0 max-w-xs overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                <PropertyCell
                  value={value}
                  propertyType={type}
                  recordMap={recordMap}
                />
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </PopoverContent>
    </Popover>
  );
}
