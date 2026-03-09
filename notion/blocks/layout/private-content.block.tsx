import Link from "next/link";
import type { ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import { notionTokens } from "@/notion/ui/design-system";
import type { RichTextItem } from "@/notion/types";
import { TextRenderer } from "@/notion/renderers/text";

interface PrivateContentBlockProps {
  label?: RichTextItem[];
  recordMap?: ExtendedRecordMap;
}

export function PrivateContentBlock({ label, recordMap }: PrivateContentBlockProps) {
  const hasLabel = label && label.length > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-dashed px-4 py-3",
        "border-muted-foreground/30 bg-muted/30 text-muted-foreground text-left",
        notionTokens.text.caption,
      )}
    >
      <span className="text-base select-none">🔒</span>
      <span className="flex-1 text-left">
        {hasLabel && recordMap ? (
          <TextRenderer text={label} recordMap={recordMap} />
        ) : (
          "Contenu réservé aux membres"
        )}
      </span>
      <Link
        href="/login"
        className="text-xs underline underline-offset-2 hover:text-foreground transition-colors shrink-0"
      >
        Se connecter
      </Link>
    </div>
  );
}
