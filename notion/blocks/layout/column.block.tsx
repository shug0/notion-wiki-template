import type {
  ColumnBlock as ColumnBlockType,
  ExtendedRecordMap,
} from "notion-types";
import { BlockChildren } from "../../lib/block-children";

export function ColumnBlock({
  block,
  recordMap,
}: {
  block: ColumnBlockType;
  recordMap: ExtendedRecordMap;
}) {
  const ratio = block.format?.column_ratio;

  return (
    <div
      className="notion-column"
      style={
        ratio ? ({ "--column-ratio": ratio } as React.CSSProperties) : undefined
      }
    >
      <BlockChildren block={block} recordMap={recordMap} />
    </div>
  );
}
