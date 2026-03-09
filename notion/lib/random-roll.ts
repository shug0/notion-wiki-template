import type { Collection, ExtendedRecordMap } from "notion-types";
import type { RollProp, RollRow } from "@/notion/ui/collection-random-roll";
import { getBlockData, getQueryBlockIds } from "./notion-compat";

export function buildRandomRollRows(
  recordMap: ExtendedRecordMap,
  collectionId: string,
  viewId: string,
  collection: Collection | undefined,
): RollRow[] {
  if (!collection || !collectionId || !viewId) return [];

  const deKey = Object.entries(collection.schema).find(
    ([, prop]) => prop.type === "auto_increment_id",
  )?.[0];

  if (!deKey) return [];

  const extraSchemaEntries = Object.entries(collection.schema).filter(
    ([key, prop]) =>
      key !== "title" && key !== deKey && prop.type !== "auto_increment_id",
  );

  const rowIds = getQueryBlockIds(recordMap, collectionId, viewId);

  return rowIds.flatMap((rowId) => {
    const block = getBlockData(recordMap, rowId);
    if (!block) return [];

    const title =
      (block.properties?.title as [string, unknown][] | undefined)?.[0]?.[0] ??
      "(sans titre)";
    const deRaw = (
      block.properties?.[deKey] as [string, unknown][] | undefined
    )?.[0]?.[0];
    const deValue = deRaw ? Number(deRaw) : undefined;

    const extraProps: RollProp[] = extraSchemaEntries.flatMap(([key, prop]) => {
      const raw = (
        block.properties?.[key] as [string, unknown][] | undefined
      )?.[0]?.[0];
      if (!raw) return [];
      return [{ label: prop.name, type: prop.type, value: String(raw) }];
    });

    return [{ id: rowId, title: String(title), deValue, extraProps }];
  });
}
