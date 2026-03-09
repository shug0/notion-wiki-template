"use client";

import { IconExternalLink, IconLink } from "@tabler/icons-react";
import Image from "next/image";
import type { BookmarkBlock as BookmarkBlockType } from "notion-types";
import { memo, useCallback, useMemo, useState } from "react";

interface BookmarkBlockProps {
  block: BookmarkBlockType;
}

export const BookmarkBlock = memo(function BookmarkBlock({
  block,
}: BookmarkBlockProps) {
  const [failedImages, setFailedImages] = useState<Set<"icon" | "cover">>(
    () => new Set(),
  );

  const bookmarkData = useMemo(() => {
    const link = block.properties?.link?.[0]?.[0] || "";
    const title = block.properties?.title?.[0]?.[0] || link;
    const description = block.properties?.description?.[0]?.[0];
    const icon = block.format?.bookmark_icon;
    const cover = block.format?.bookmark_cover;

    let hostname = "";
    if (link) {
      try {
        hostname = new URL(link).hostname;
      } catch {
        // Invalid URL - keep empty string
      }
    }

    return { link, title, description, icon, cover, hostname };
  }, [block.properties, block.format]);

  const handleImageError = useCallback((type: "icon" | "cover") => {
    setFailedImages((prev) => new Set(prev).add(type));
  }, []);

  if (!bookmarkData.link) return null;

  const showIcon = bookmarkData.icon && !failedImages.has("icon");
  const showCover = bookmarkData.cover && !failedImages.has("cover");

  return (
    <a
      href={bookmarkData.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline flex-1"
    >
      <div className="flex h-full rounded-lg border bg-card text-card-foreground hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden">
        {/* Text content */}
        <div className="flex flex-col justify-between flex-1 min-w-0 p-4 gap-3">
          {/* Top: icon + title + external link */}
          <div className="flex items-start gap-2">
            {showIcon && (
              <Image
                src={bookmarkData.icon}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 rounded flex-shrink-0 mt-0.5"
                loading="lazy"
                onError={() => handleImageError("icon")}
                unoptimized
              />
            )}
            <span className="text-sm font-semibold leading-snug flex-1 min-w-0 line-clamp-2">
              {bookmarkData.title}
            </span>
            <IconExternalLink
              className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
          </div>

          {/* Middle: description */}
          {bookmarkData.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {bookmarkData.description}
            </p>
          )}

          {/* Bottom: URL */}
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <IconLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            {bookmarkData.hostname || bookmarkData.link}
          </p>
        </div>

        {/* Cover image */}
        {showCover && (
          <div className="w-32 flex-shrink-0 relative">
            <Image
              src={bookmarkData.cover}
              alt=""
              fill
              className="object-cover"
              loading="lazy"
              onError={() => handleImageError("cover")}
              unoptimized
            />
          </div>
        )}
      </div>
    </a>
  );
});
