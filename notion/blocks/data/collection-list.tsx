import type {
  Block,
  Collection,
  CollectionView,
  ExtendedRecordMap,
  PropertyType,
} from "notion-types";
import { cn } from "@/lib/utils";
import { getPageTitle, getPropertyValue } from "../../lib/data";
import { getBlockData, getQueryBlockIds } from "../../lib/notion-compat";
import type { NotionIconType } from "../../types";
import { notionTokens } from "../../ui/design-system";
import { PageLink } from "../../ui/page-link";
import { PropertyCell } from "./property-cell";

interface CollectionListViewProps {
  block: Block;
  recordMap: ExtendedRecordMap;
  collectionId: string;
  viewId: string;
  collection: Collection;
  view: CollectionView;
}

interface ListProperty {
  id: string;
  name: string;
  type: string;
}

function getListVisibleProperties(
  view: CollectionView,
  schema: Collection["schema"],
): ListProperty[] {
  if (view.type !== "list") return [];

  const listView = view as CollectionView & {
    format?: {
      list_properties?: Array<{ property: string; visible: boolean }>;
    };
  };
  const props: Array<{ property: string; visible: boolean }> =
    listView.format?.list_properties ?? [];

  return props
    .filter((p) => p.visible && schema[p.property] && p.property !== "title")
    .map((p) => ({
      id: p.property,
      name: schema[p.property]?.name ?? p.property,
      type: schema[p.property]?.type ?? "text",
    }));
}

export function CollectionListView({
  recordMap,
  collectionId,
  viewId,
  collection,
  view,
}: CollectionListViewProps) {
  const itemIds = getQueryBlockIds(recordMap, collectionId, viewId);

  if (itemIds.length === 0) {
    return (
      <div className={cn("my-4", notionTokens.text.caption)}>No items</div>
    );
  }

  const visibleProps = getListVisibleProperties(view, collection.schema);

  return (
    <ul className="mt-1 divide-y divide-border/50">
      {itemIds.map((id) => {
        const rowBlock = getBlockData(recordMap, id);
        if (!rowBlock) return null;

        const pageId = id.replace(/-/g, "");

        return (
          <li key={id} className="flex items-center gap-3 py-1.5">
            <div className="min-w-0 flex-1">
              <PageLink
                href={`/${pageId}`}
                title={getPageTitle(rowBlock)}
                icon={rowBlock.format?.page_icon as NotionIconType | undefined}
                block={rowBlock}
                recordMap={recordMap}
                variant="inline"
              />
            </div>

            {visibleProps.length > 0 && (
              <div className="flex shrink-0 items-center gap-3">
                {visibleProps.map((prop) => (
                  <PropertyCell
                    key={prop.id}
                    value={getPropertyValue(rowBlock, prop.id)}
                    propertyType={prop.type as PropertyType}
                    recordMap={recordMap}
                  />
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
