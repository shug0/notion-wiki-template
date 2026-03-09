import { IconExternalLink } from "@tabler/icons-react";
import type { Block } from "notion-types";
import { cn } from "@/lib/utils";
import { notionTokens } from "@/notion/ui/design-system";

interface LinkPreviewBlockProps {
  block: Block;
}

export function LinkPreviewBlock({ block }: LinkPreviewBlockProps) {
  const url = (block as Block & { properties?: { link?: [[string]] } })
    .properties?.link?.[0]?.[0];

  if (!url) return null;

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    // invalid url
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        notionTokens.text.body,
        "inline-flex items-center gap-2 text-foreground hover:underline",
      )}
    >
      <IconExternalLink className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{hostname || url}</span>
    </a>
  );
}
