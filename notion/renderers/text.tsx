import Link from "next/link";
import type { ExtendedRecordMap } from "notion-types";
import React from "react";
import { getPageTitle } from "../lib/data";
import { getBlockData } from "../lib/notion-compat";
import type { RichTextItem } from "../types";

interface TextRendererProps {
  text: RichTextItem[];
  recordMap?: ExtendedRecordMap;
  className?: string; // Allow passing extra classes like for heading sizes
}

export function TextRenderer({
  text,
  recordMap,
  className,
}: TextRendererProps) {
  if (!text || text.length === 0) {
    return null;
  }

  const content = (
    <>
      {text.map((item, index) => {
        const { annotations, plain_text, href, type, mention } = item;
        const { bold, italic, strikethrough, underline, code, color } =
          annotations;

        let itemContent: React.ReactNode = plain_text;

        // Handle external object mentions (Google Drive, Figma, GitHub…)
        if (type === "mention" && mention?.type === "external_object") {
          if (!recordMap) return null;
          const eoiBlock = getBlockData(recordMap, mention.eoiId);
          if (!eoiBlock) return null;
          const eoiFormat = (
            eoiBlock as unknown as {
              format?: { original_url?: string; domain?: string };
            }
          ).format;
          if (!eoiFormat?.original_url) return null;
          const domain =
            eoiFormat.domain ?? new URL(eoiFormat.original_url).hostname;
          itemContent = (
            <a
              href={eoiFormat.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-primary transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
                alt=""
                width={16}
                height={16}
                className="w-4 h-4 inline-block"
              />
              {domain}
            </a>
          );
        }

        // Handle date mentions
        if (type === "mention" && mention?.type === "date") {
          const { startDate, startTime, endDate, endTime, dateType, timeZone } =
            mention;
          const locale = "fr-FR";
          const tz = timeZone ?? "Europe/Paris";

          const formatDate = (date: string, time?: string) => {
            const isDatetime =
              (dateType === "datetime" || dateType === "datetimerange") && time;
            const dt = isDatetime
              ? new Date(`${date}T${time}`)
              : new Date(`${date}T00:00:00`);
            return new Intl.DateTimeFormat(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
              ...(isDatetime
                ? { hour: "2-digit", minute: "2-digit", timeZone: tz }
                : {}),
            }).format(dt);
          };

          const label = endDate
            ? `${formatDate(startDate, startTime)} → ${formatDate(endDate, endTime)}`
            : formatDate(startDate, startTime);

          itemContent = (
            <span className="inline-flex items-center gap-1 text-[0.9em] font-medium bg-muted/60 rounded px-1.5 py-0.5 whitespace-nowrap">
              {label}
            </span>
          );
        }

        // Handle Mentions
        if (type === "mention" && mention?.type === "page") {
          if (!recordMap) return null;
          const mentionedPage = getBlockData(recordMap, mention.pageId);
          if (!mentionedPage) return null;

          const mentionedTitle = getPageTitle(mentionedPage);
          const pageFormat = (
            mentionedPage as unknown as {
              format?: { page_icon?: string; external_url?: string };
            }
          ).format;
          const icon = pageFormat?.page_icon;
          // External object token: page linked to an external URL (Drive, GitHub…)
          const externalUrl = pageFormat?.external_url;

          const mentionClass =
            "inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-primary transition-colors";

          const isIconUrl =
            icon && (icon.startsWith("http") || icon.startsWith("/"));
          const iconNode = isIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={icon}
              alt=""
              width={16}
              height={16}
              className="w-4 h-4 rounded-sm inline-block"
            />
          ) : null;

          if (externalUrl) {
            itemContent = (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={mentionClass}
              >
                {iconNode}
                {mentionedTitle}
              </a>
            );
          } else {
            const mentionedId = mention.pageId.replace(/-/g, "");
            itemContent = (
              <Link href={`/${mentionedId}`} className={mentionClass}>
                {iconNode}
                {mentionedTitle}
              </Link>
            );
          }
        }

        // Apply annotations
        if (code) {
          itemContent = (
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {itemContent}
            </code>
          );
        }
        if (bold) itemContent = <strong>{itemContent}</strong>;
        if (italic) itemContent = <em>{itemContent}</em>;
        if (strikethrough) itemContent = <s>{itemContent}</s>;
        if (underline) itemContent = <u>{itemContent}</u>;

        // Apply color
        if (color && color !== "default") {
          const isBackground = color.endsWith("_background");
          const colorName = isBackground
            ? color.replace("_background", "")
            : color;

          itemContent = (
            <span
              style={{
                [isBackground ? "backgroundColor" : "color"]: colorName,
              }}
            >
              {itemContent}
            </span>
          );
        }

        // Wrap in link if href exists (and not already a link from mention)
        if (href && type !== "mention") {
          if (href.startsWith("/")) {
            itemContent = (
              <Link
                href={href}
                className="text-primary font-medium no-underline px-1.5 py-0.5 -mx-0.5 rounded hover:bg-primary/10 transition-colors touch-manipulation"
              >
                {itemContent}
              </Link>
            );
          } else {
            itemContent = (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-primary"
              >
                {itemContent}
              </a>
            );
          }
        }

        return (
          <React.Fragment key={`${index}-${plain_text.slice(0, 20)}-${type}`}>
            {itemContent}
          </React.Fragment>
        );
      })}
    </>
  );

  if (className) {
    return <span className={className}>{content}</span>;
  }

  return content;
}
