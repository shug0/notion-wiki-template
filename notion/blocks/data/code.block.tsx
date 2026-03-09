import type {
  CodeBlock as CodeBlockType,
  ExtendedRecordMap,
} from "notion-types";
import { cn } from "@/lib/utils";
import { convertDecorationToRichText } from "../../lib/conversion";
import { TextRenderer } from "../../renderers/text";
import { notionTokens } from "../../ui/design-system";

interface CodeBlockProps {
  block: CodeBlockType;
  recordMap: ExtendedRecordMap;
}

export function CodeBlock({ block, recordMap }: CodeBlockProps) {
  const properties = block.properties;
  const content = convertDecorationToRichText(properties?.title);
  const language = properties?.language?.[0]?.[0];
  const richCaption = convertDecorationToRichText(properties?.caption);

  const codeText = content.map((t) => t.plain_text).join("");

  return (
    <div
      className={cn(
        "overflow-hidden notion-visual",
        notionTokens.borders.rounded,
        notionTokens.borders.default,
        notionTokens.colors.muted,
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-muted-foreground/10 border-b">
        <span className="text-xs font-mono text-muted-foreground">
          {language}
        </span>
        {/* Could add copy button here */}
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono">
          <code>{codeText}</code>
        </pre>
      </div>
      {richCaption.length > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-t">
          <TextRenderer text={richCaption} recordMap={recordMap} />
        </div>
      )}
    </div>
  );
}
