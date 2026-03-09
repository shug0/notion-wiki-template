import type { ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import { TextRenderer } from "../renderers/text";
import type { RichTextItem } from "../types";
import {
  type MediaFigureVariants,
  mediaFigureVariants,
  notionTokens,
} from "./design-system";

interface MediaFigureProps extends MediaFigureVariants {
  caption?: RichTextItem[];
  recordMap: ExtendedRecordMap;
  children: React.ReactNode;
  className?: string;
}

export function MediaFigure({
  caption,
  recordMap,
  children,
  spacing,
  className,
}: MediaFigureProps) {
  const hasCaption = caption && caption.length > 0;

  return (
    <figure
      className={cn(
        mediaFigureVariants({ spacing }),
        "notion-visual",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-xl">{children}</div>
      {hasCaption && (
        <figcaption
          className={cn(
            notionTokens.spacing.caption,
            notionTokens.text.caption,
          )}
        >
          <TextRenderer text={caption} recordMap={recordMap} />
        </figcaption>
      )}
    </figure>
  );
}
