import Image from "next/image";
import type { Block, ExtendedRecordMap } from "notion-types";
import { cn } from "@/lib/utils";
import { mapImageUrl } from "../lib/data";
import type { NotionIconType } from "../types";
import { type NotionIconVariants, notionIconVariants } from "./design-system";

interface NotionIconProps extends NotionIconVariants {
  icon: NotionIconType;
  block: Block;
  recordMap: ExtendedRecordMap;
  fallback?: React.ReactNode;
  className?: string;
}

const imageSizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 40,
  "2xl": 32,
} as const;

export function NotionIcon({
  icon,
  block,
  recordMap,
  size = "md",
  fallback,
  className,
}: NotionIconProps) {
  const imageSize = imageSizeMap[size || "md"];

  // String icon
  if (typeof icon === "string") {
    // Custom emoji: not resolvable without auth → use fallback
    if (icon.startsWith("notion://custom_emoji/")) return fallback ?? null;

    return (
      <span className={cn(notionIconVariants({ size }), className)}>
        {icon}
      </span>
    );
  }

  // Object with type
  if (typeof icon === "object" && icon !== null && "type" in icon) {
    if (icon.type === "emoji") {
      return (
        <span className={cn(notionIconVariants({ size }), className)}>
          {icon.emoji}
        </span>
      );
    }

    const iconUrl =
      icon.type === "external"
        ? mapImageUrl(icon.external.url, block, recordMap)
        : icon.type === "file"
          ? mapImageUrl(icon.file.url, block, recordMap)
          : undefined;

    if (iconUrl) {
      return (
        <Image
          src={iconUrl}
          alt=""
          width={imageSize}
          height={imageSize}
          className={cn(
            notionIconVariants({ size }),
            "object-contain",
            className,
          )}
          unoptimized
        />
      );
    }
  }

  return fallback ?? null;
}
