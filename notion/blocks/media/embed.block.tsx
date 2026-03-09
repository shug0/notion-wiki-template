import type { Block, ExtendedRecordMap } from "notion-types";

interface EmbedBlockProps {
  block: Block;
  recordMap: ExtendedRecordMap;
}

function isSameDomain(url: string): boolean {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return new URL(url).hostname === new URL(siteUrl).hostname;
  } catch {
    return false;
  }
}

export function EmbedBlock({ block }: EmbedBlockProps) {
  const url = (block.properties as Record<string, [[string]]> | undefined)
    ?.source?.[0]?.[0];
  if (!url) return null;

  const format = block.format as
    | {
        block_width?: number;
        block_height?: number;
        block_full_width?: boolean;
        block_page_width?: boolean;
        block_align?: string;
      }
    | undefined;
  const height = format?.block_height ?? 400;
  const fullWidth = format?.block_full_width || format?.block_page_width;
  const width = fullWidth ? undefined : (format?.block_width ?? undefined);
  const sameDomain = isSameDomain(url);

  return (
    <div
      className={
        sameDomain
          ? "my-4 overflow-hidden"
          : "my-4 overflow-hidden rounded-md border border-border"
      }
      style={width ? { width } : undefined}
    >
      <iframe
        src={url}
        height={height}
        className={fullWidth || !width ? "w-full" : undefined}
        style={width ? { width } : undefined}
        allowFullScreen
        loading="lazy"
        title="Embed"
      />
    </div>
  );
}
