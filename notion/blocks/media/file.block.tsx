import { IconFileDownload } from "@tabler/icons-react";
import type {
  ExtendedRecordMap,
  FileBlock as FileBlockType,
  PdfBlock as PdfBlockType,
} from "notion-types";
import { convertDecorationToRichText } from "../../lib/conversion";
import { mapImageUrl } from "../../lib/data";
import { TextRenderer } from "../../renderers/text";
import { MediaFigure } from "../../ui/figure";

interface FileBlockProps {
  block: FileBlockType | PdfBlockType;
  recordMap: ExtendedRecordMap;
}

export function FileBlock({ block, recordMap }: FileBlockProps) {
  const properties = block.properties;
  const initialUrl = properties?.source?.[0]?.[0];
  const url = initialUrl
    ? mapImageUrl(initialUrl, block, recordMap)
    : undefined;

  const isPdf = block.type === "pdf";
  const titleDecoration = "title" in properties ? properties.title : [];
  const name = isPdf
    ? "PDF Document"
    : convertDecorationToRichText(titleDecoration)?.[0]?.plain_text || "File";

  const captionDecoration =
    "caption" in properties
      ? properties.caption
      : "title" in properties
        ? properties.title
        : undefined;
  const richCaption = convertDecorationToRichText(captionDecoration);

  if (!url) return null;

  const downloadUrl = url
    ? `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(name)}`
    : undefined;

  if (isPdf) {
    return (
      <MediaFigure
        caption={richCaption}
        recordMap={recordMap}
        className="w-full"
      >
        <div className="w-full h-[600px]">
          <iframe
            src={`${url}#view=FitH`}
            title={name}
            className="w-full h-full border-0"
          />
        </div>
      </MediaFigure>
    );
  }

  return (
    <div>
      <a
        href={downloadUrl ?? url}
        download={name}
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted transition-colors group"
      >
        <div className="p-2 rounded bg-muted group-hover:bg-primary/10 transition-colors">
          <IconFileDownload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          {richCaption.length > 0 && (
            <div className="text-xs text-muted-foreground truncate">
              <TextRenderer text={richCaption} recordMap={recordMap} />
            </div>
          )}
        </div>
      </a>
    </div>
  );
}
