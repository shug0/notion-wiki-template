"use client";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import type {
  Block,
  Collection,
  CollectionView,
  ExtendedRecordMap,
  PropertyType,
} from "notion-types";
import { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getPageTitle,
  getPropertyValue,
  getRelationIds,
  getSelectValue,
  getTableVisibleProperties,
  groupBlocksByProperty,
} from "../../lib/data";
import { getBlockData, getQueryBlockIds } from "../../lib/notion-compat";
import type { NotionIconType, RelationPropertySchema } from "../../types";
import { PageLink } from "../../ui/page-link";
import { PropertyCell } from "./property-cell";

interface CollectionTableViewProps {
  block: Block;
  recordMap: ExtendedRecordMap;
  collectionId: string;
  viewId: string;
  collection: Collection;
  view: CollectionView;
}

interface RowNode {
  id: string;
  children: RowNode[];
}

/**
 * Build a tree from flat row IDs using Notion's sub-items feature.
 *
 * `subitem_property` (e.g. "WkKf" = "Sous-élément") is a self-referential
 * relation. Its schema entry has a `property` key pointing to the inverse
 * relation (e.g. "wvi]" = "élément parent").
 *
 * Strategy:
 * 1. Primary — read the PARENT pointer on each child row (inverse relation).
 *    Most reliable: the user sets the parent on the child, not children on parent.
 * 2. Fallback — read the CHILDREN list from subitem_property directly.
 *    Used when only the parent → children direction is populated.
 */
function buildRowTree(
  rowIds: string[],
  recordMap: ExtendedRecordMap,
  subitemPropertyKey: string | undefined,
  schema: Collection["schema"],
  fullPool?: Set<string>,
): RowNode[] {
  if (!subitemPropertyKey) {
    return rowIds.map((id) => ({ id, children: [] }));
  }

  const allIds = new Set(rowIds);
  // Use Set per parent for deduplication (both strategies can find the same edge)
  const childrenByParent = new Map<string, Set<string>>();
  const childIds = new Set<string>();

  function link(parentId: string, childId: string) {
    if (!childrenByParent.has(parentId))
      childrenByParent.set(parentId, new Set());
    childrenByParent.get(parentId)!.add(childId);
    childIds.add(childId);
  }

  const subitemDef = schema[subitemPropertyKey] as
    | RelationPropertySchema
    | undefined;
  const parentPropertyKey = subitemDef?.property;

  // Strategy 2: children list on parent row (parent.WkKf → [children])
  // Search in fullPool (all collection rows) so sub-items that were excluded
  // from grouping still appear under their parent in the correct group.
  const childSearchPool = fullPool ?? allIds;
  for (const id of rowIds) {
    const block = getBlockData(recordMap, id);
    if (!block) continue;
    const childRelation = getPropertyValue(block, subitemPropertyKey);
    for (const cid of getRelationIds(childRelation).filter((cid) =>
      childSearchPool.has(cid),
    )) {
      allIds.add(cid);
      link(id, cid);
    }
  }

  // Strategy 1: parent pointer on child row (child.wvi] → parent)
  // Search fullPool (not just allIds) to discover children that belong to other
  // groups — e.g. sub-items with a different Zone value that wouldn't appear in
  // the current group's rowIds but whose parent IS in allIds.
  if (parentPropertyKey) {
    const searchPool = fullPool ?? allIds;
    for (const id of [...searchPool]) {
      const block = getBlockData(recordMap, id);
      if (!block) continue;
      const parentRelation = getPropertyValue(block, parentPropertyKey);
      const parentId = getRelationIds(parentRelation)[0];
      if (parentId && allIds.has(parentId)) {
        allIds.add(id);
        link(parentId, id);
      }
    }
  }

  // Convert Sets back to ordered arrays (preserves rowIds insertion order)
  function getOrderedChildren(id: string): string[] {
    const set = childrenByParent.get(id);
    return set ? [...allIds].filter((rid) => set.has(rid)) : [];
  }

  function buildNode(id: string): RowNode {
    return { id, children: getOrderedChildren(id).map(buildNode) };
  }

  return rowIds.filter((id) => !childIds.has(id)).map(buildNode);
}

interface ColumnConfig {
  id: string;
  name: string;
  type: string;
  width?: number;
}

interface RollupSchema {
  type: "rollup";
  relation_property: string;
  target_property: string;
  target_property_type: string;
}

/**
 * Resolve a rollup value by following relation → target property.
 * Returns { value, displayType } so PropertyCell renders with the correct type.
 */
function resolveRollup(
  rowBlock: Block,
  colId: string,
  schema: Collection["schema"],
  recordMap: ExtendedRecordMap,
): { value: unknown; displayType: PropertyType } | undefined {
  const def = schema[colId] as unknown as RollupSchema | undefined;
  if (def?.type !== "rollup") return undefined;

  // First check if Notion stored the computed value directly on the block
  const directValue = getPropertyValue(rowBlock, colId);
  if (directValue) {
    return {
      value: directValue,
      displayType: (def.target_property_type || "text") as PropertyType,
    };
  }

  // Otherwise resolve via relation → target property
  const relationValue = getPropertyValue(rowBlock, def.relation_property);
  const relationIds = getRelationIds(relationValue);
  if (relationIds.length === 0) return undefined;

  const targetBlock = getBlockData(recordMap, relationIds[0]);
  if (!targetBlock) return undefined;

  const targetValue = getPropertyValue(targetBlock, def.target_property);
  return {
    value: targetValue,
    displayType: (def.target_property_type || "text") as PropertyType,
  };
}

function renderRowTree(
  nodes: RowNode[],
  columns: ColumnConfig[],
  schema: Collection["schema"],
  recordMap: ExtendedRecordMap,
  depth: number,
  collapsedRows: Set<string>,
  onToggleRow: (id: string) => void,
): React.ReactNode[] {
  return nodes.flatMap((node) => {
    const rowBlock = getBlockData(recordMap, node.id);
    if (!rowBlock) return [];

    const pageId = node.id.replace(/-/g, "");
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsedRows.has(node.id);

    const row = (
      <TableRow key={node.id}>
        {columns.map((col) => {
          let value = getPropertyValue(rowBlock, col.id);
          let displayType = col.type as PropertyType;

          // Resolve rollups
          if (col.type === "rollup") {
            const resolved = resolveRollup(rowBlock, col.id, schema, recordMap);
            if (resolved) {
              value = resolved.value;
              displayType = resolved.displayType;
            }
          }

          const isTitle = col.type === "title";

          if (isTitle) {
            return (
              <TableCell
                key={col.id}
                style={
                  depth > 0
                    ? { paddingLeft: `${0.75 + depth * 1.5}rem` }
                    : undefined
                }
              >
                <div className="flex items-center gap-1">
                  {hasChildren && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onToggleRow(node.id);
                      }}
                      className="shrink-0 p-1 -ml-1 text-muted-foreground hover:text-foreground rounded"
                    >
                      {isCollapsed ? (
                        <IconChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <IconChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <PageLink
                    href={`/${pageId}`}
                    title={getPageTitle(rowBlock)}
                    icon={
                      rowBlock.format?.page_icon as NotionIconType | undefined
                    }
                    block={rowBlock}
                    recordMap={recordMap}
                    variant="inline"
                  />
                </div>
              </TableCell>
            );
          }

          return (
            <TableCell
              key={col.id}
              style={
                col.type === "auto_increment_id" ? { width: "1px" } : undefined
              }
            >
              <PropertyCell
                value={value}
                propertyType={col.type as PropertyType}
                recordMap={recordMap}
              />
            </TableCell>
          );
        })}
      </TableRow>
    );

    return [
      row,
      ...(!isCollapsed
        ? renderRowTree(
            node.children,
            columns,
            schema,
            recordMap,
            depth + 1,
            collapsedRows,
            onToggleRow,
          )
        : []),
    ];
  });
}

function renderTable(
  rowIds: string[],
  columns: ColumnConfig[],
  recordMap: ExtendedRecordMap,
  subitemPropertyKey: string | undefined,
  schema: Collection["schema"],
  collapsedRows: Set<string>,
  onToggleRow: (id: string) => void,
  fullPool?: Set<string>,
  bordered = true,
): React.ReactNode {
  const tree = buildRowTree(
    rowIds,
    recordMap,
    subitemPropertyKey,
    schema,
    fullPool,
  );

  const table = (
    <Table className="[&_td:first-child]:pl-4 [&_th:first-child]:pl-4">
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead
              key={col.id}
              style={
                col.type === "auto_increment_id"
                  ? { width: "1px" }
                  : col.width
                    ? { width: `${col.width}px` }
                    : undefined
              }
              className={undefined}
            >
              {col.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(() => {
          const rows = renderRowTree(
            tree,
            columns,
            schema,
            recordMap,
            0,
            collapsedRows,
            onToggleRow,
          );
          if (rows.length === 0) {
            return (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-muted-foreground h-24"
                >
                  No items
                </TableCell>
              </TableRow>
            );
          }
          return rows;
        })()}
      </TableBody>
    </Table>
  );

  return bordered ? (
    <div className="border rounded-lg overflow-hidden">{table}</div>
  ) : (
    table
  );
}

export function CollectionTableView({
  block,
  recordMap,
  collectionId,
  viewId,
  collection,
  view,
}: CollectionTableViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleRow = useCallback((id: string) => {
    setCollapsedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const columns = getTableVisibleProperties(view, collection.schema);
  const rowIds = useMemo(
    () => getQueryBlockIds(recordMap, collectionId, viewId),
    [recordMap, collectionId, viewId],
  );

  if (columns.length === 0) {
    return (
      <div className="my-4 text-sm text-muted-foreground">
        No visible properties configured
      </div>
    );
  }

  // collection.format.subitem_property is a Notion extension not in the official types
  const subitemPropertyKey = (
    collection.format as Record<string, unknown> | undefined
  )?.subitem_property as string | undefined;

  // parentPropertyKey = inverse relation of subitem (e.g. "wvi]" = "élément parent")
  const subitemDef = subitemPropertyKey
    ? (collection.schema[subitemPropertyKey] as
        | RelationPropertySchema
        | undefined)
    : undefined;
  const parentPropertyKey = subitemDef?.property;

  // fullPool: all row IDs — used by buildRowTree to find children across groups
  const fullPool = useMemo(() => new Set(rowIds), [rowIds]);

  // Grouping support
  const groupByPropertyId = (view.format as Record<string, unknown> | undefined)
    ?.collection_group_by as { property: string } | undefined;

  if (groupByPropertyId?.property) {
    const propId = groupByPropertyId.property;
    const groupedIds = groupBlocksByProperty(
      rowIds,
      propId,
      collection.schema,
      recordMap,
      parentPropertyKey,
    );

    const propertySchema = collection.schema[propId];
    const propertyName = propertySchema?.name || propId;
    const propertyType = propertySchema?.type;

    return (
      <div className="my-3 space-y-4">
        {Array.from(groupedIds.entries()).map(([groupKey, ids]) => {
          let groupTitle: string;
          if (groupKey === "__empty__") {
            groupTitle = `Sans « ${propertyName} »`;
          } else if (
            propertyType === "select" ||
            propertyType === "multi_select"
          ) {
            groupTitle = groupKey;
          } else {
            const refBlock = getBlockData(recordMap, groupKey);
            groupTitle = refBlock ? getPageTitle(refBlock) : groupKey;
          }

          const isGroupCollapsed = collapsedGroups.has(groupKey);

          return (
            <div key={groupKey}>
              <button
                onClick={() => toggleGroup(groupKey)}
                className="flex items-center gap-1.5 w-full text-left py-1 mb-1 text-muted-foreground hover:text-foreground"
              >
                {isGroupCollapsed ? (
                  <IconChevronRight className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <IconChevronDown className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="text-sm font-medium uppercase tracking-wide">
                  {groupTitle}
                </span>
              </button>
              {!isGroupCollapsed &&
                renderTable(
                  ids,
                  columns,
                  recordMap,
                  subitemPropertyKey,
                  collection.schema,
                  collapsedRows,
                  toggleRow,
                  fullPool,
                  true,
                )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="my-3">
      {renderTable(
        rowIds,
        columns,
        recordMap,
        subitemPropertyKey,
        collection.schema,
        collapsedRows,
        toggleRow,
      )}
    </div>
  );
}
