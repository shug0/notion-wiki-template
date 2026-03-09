import type {
  ColumnListBlock as ColumnListBlockType,
  ExtendedRecordMap,
} from "notion-types";
import { BlockChildren } from "../../lib/block-children";

export function ColumnListBlock({
  block,
  recordMap,
}: {
  block: ColumnListBlockType;
  recordMap: ExtendedRecordMap;
}) {
  return (
    <div className="notion-column-list notion-visual">
      <BlockChildren block={block} recordMap={recordMap} asFragment />
    </div>
  );
}
