import Image from "next/image";
import type {
  ExtendedRecordMap,
  ImageBlock as ImageBlockType,
} from "notion-types";
import { convertDecorationToRichText } from "../../lib/conversion";
import { mapImageUrl } from "../../lib/data";
import { MediaFigure } from "../../ui/figure";

interface ImageBlockProps {
  block: ImageBlockType;
  recordMap: ExtendedRecordMap;
}

export function ImageBlock({ block, recordMap }: ImageBlockProps) {
  const format = block.format;
  const properties = block.properties;
  const rawUrl = format?.display_source || properties?.source?.[0]?.[0];

  if (!rawUrl || typeof rawUrl !== "string") return null;

  const url = mapImageUrl(rawUrl, block, recordMap);
  if (!url || typeof url !== "string") return null;

  const richCaption = convertDecorationToRichText(properties?.caption);
  const altText = richCaption.map((t) => t.text).join("") || "Image";

  const blockWidth = format?.block_width;
  const blockHeight = format?.block_height;
  const isFullWidth =
    !blockWidth || format?.block_full_width || format?.block_page_width;

  return (
    <MediaFigure caption={richCaption} recordMap={recordMap}>
      <Image
        src={url}
        alt={altText}
        width={blockWidth || 800}
        height={blockHeight || 400}
        className={
          isFullWidth
            ? "h-auto w-full rounded-md"
            : "h-auto max-w-full rounded-md"
        }
        style={isFullWidth ? undefined : { width: blockWidth }}
        unoptimized
      />
    </MediaFigure>
  );
}
