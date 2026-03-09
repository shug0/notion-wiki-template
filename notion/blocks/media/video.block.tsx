import type {
  ExtendedRecordMap,
  VideoBlock as VideoBlockType,
} from "notion-types";
import { convertDecorationToRichText } from "../../lib/conversion";
import { mapImageUrl } from "../../lib/data";
import { MediaFigure } from "../../ui/figure";
import { VideoEmbed } from "../../ui/video-embed";

interface VideoBlockProps {
  block: VideoBlockType;
  recordMap: ExtendedRecordMap;
}

export function VideoBlock({ block, recordMap }: VideoBlockProps) {
  const properties = block.properties;
  const format = block.format;
  const rawUrl = format?.display_source || properties?.source?.[0]?.[0];

  if (!rawUrl || typeof rawUrl !== "string") return null;

  const url = mapImageUrl(rawUrl, block, recordMap);
  if (!url || typeof url !== "string") return null;

  const richCaption = convertDecorationToRichText(properties?.caption);

  return (
    <MediaFigure caption={richCaption} recordMap={recordMap}>
      <VideoEmbed url={url} />
    </MediaFigure>
  );
}
