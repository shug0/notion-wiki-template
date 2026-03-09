import type {
  ExtendedRecordMap,
  TableBlock as TableBlockType,
  TableRowBlock as TableRowBlockType,
} from "notion-types";
import { cn } from "@/lib/utils";
import { BlockChildren } from "../../lib/block-children";
import { convertDecorationToRichText } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";

interface TableBlockProps {
  block: TableBlockType;
  recordMap: ExtendedRecordMap;
}

export function TableBlock({ block, recordMap }: TableBlockProps) {
  const format = block.format || {
    table_block_column_header: false,
    table_block_row_header: false,
  };
  const hasColumnHeader = format.table_block_column_header;
  const hasRowHeader = format.table_block_row_header;

  return (
    <div className="w-full overflow-x-auto notion-visual">
      <table className="w-full border-collapse text-sm">
        <tbody
          className={cn(
            hasColumnHeader &&
              "[&>tr:first-child]:bg-muted/50 [&>tr:first-child]:font-semibold",
            hasRowHeader &&
              "[&>tr>td:first-child]:bg-muted/30 [&>tr>td:first-child]:font-semibold",
          )}
        >
          <BlockChildren block={block} recordMap={recordMap} asFragment />
        </tbody>
      </table>
    </div>
  );
}

export function TableRowBlock({
  block,
  recordMap,
}: {
  block: TableRowBlockType;
  recordMap: ExtendedRecordMap;
}) {
  const content = block.properties || {};
  const propertyIds = Object.keys(content);

  return (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
      {propertyIds.map((propId) => (
        <td key={propId} className="p-3 border-r last:border-r-0 align-top">
          <TextRenderer
            text={convertDecorationToRichText(content[propId])}
            recordMap={recordMap}
          />
        </td>
      ))}
    </tr>
  );
}
