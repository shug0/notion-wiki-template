import Image from "next/image";
import Link from "next/link";
import type { ExtendedRecordMap, PageBlock } from "notion-types";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { PageProperties } from "../blocks/data/page-properties";
import {
  getBreadcrumb,
  getPageIdFromRecordMap,
  getPageTitle,
  mapImageUrl,
} from "../lib/data";
import type { NotionIconType } from "../types";
import { PageTitleRow } from "../ui/page-title-row";

interface NotionHeaderProps {
  recordMap: ExtendedRecordMap;
  pageBlock: PageBlock;
  title?: string;
  icon?: NotionIconType;
  containerSize?: "default" | "wide";
  hideTitle?: boolean;
}

export function NotionHeader({
  recordMap,
  pageBlock,
  title: titleOverride,
  icon: iconOverride,
  containerSize,
  hideTitle = false,
}: NotionHeaderProps) {
  const title = titleOverride || getPageTitle(pageBlock);
  const format = pageBlock.format || {};
  const pageCover = mapImageUrl(format.page_cover, pageBlock, recordMap);
  const pageIcon = iconOverride || (format.page_icon as NotionIconType);
  const size = containerSize ?? (format.page_full_width ? "wide" : "default");
  // Notion stores page_cover_position as 0=bottom, 1=top — invert for CSS object-position
  const coverPosition = format.page_cover_position ?? 0.5;
  const objectPosition = `center ${(1 - coverPosition) * 100}%`;

  const pageId = getPageIdFromRecordMap(recordMap);
  const breadcrumb = getBreadcrumb(recordMap, pageId);

  return (
    <>
      {pageCover && (
        <div className="w-full h-[30vh] max-h-[300px] relative bg-muted">
          <Image
            width={1920}
            height={1080}
            src={pageCover}
            alt={`Couverture de ${title}`}
            className="w-full h-full object-cover"
            style={{ objectPosition }}
            sizes="100vw"
            priority
          />
        </div>
      )}

      <Container
        size={size}
        className={pageCover ? "pt-4 md:pt-6" : "pt-4 md:pt-8"}
      >
        {breadcrumb.length > 0 && (
          <Breadcrumb className="mb-4 md:mb-6">
            <BreadcrumbList>
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;
                // On mobile: hide everything except the immediate parent (last item)
                const hiddenOnMobile = !isLast;
                // Show ellipsis on mobile before the last parent if ancestors are hidden
                const showEllipsisBefore = isLast && breadcrumb.length > 1;

                return (
                  <React.Fragment key={item.id}>
                    {showEllipsisBefore && (
                      <>
                        <BreadcrumbItem className="sm:hidden">
                          <span className="text-muted-foreground">…</span>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="sm:hidden" />
                      </>
                    )}
                    <BreadcrumbItem
                      className={hiddenOnMobile ? "hidden sm:flex" : undefined}
                    >
                      <BreadcrumbLink
                        render={
                          <Link
                            href={`/${item.id}`}
                            className="flex items-center gap-1"
                          >
                            {item.icon && (
                              <span className="text-sm leading-none">
                                {item.icon}
                              </span>
                            )}
                            <span className="truncate max-w-[120px] sm:max-w-[200px]">
                              {item.title}
                            </span>
                          </Link>
                        }
                      />
                    </BreadcrumbItem>
                    <BreadcrumbSeparator
                      className={hiddenOnMobile ? "hidden sm:flex" : undefined}
                    />
                  </React.Fragment>
                );
              })}
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1">
                  {pageIcon && typeof pageIcon === "string" && (
                    <span className="text-sm leading-none">{pageIcon}</span>
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    {title}
                  </span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {!hideTitle && (
          <>
            <PageTitleRow
              title={title}
              icon={pageIcon}
              block={pageBlock}
              recordMap={recordMap}
            />
            <PageProperties pageBlock={pageBlock} recordMap={recordMap} />
          </>
        )}
      </Container>
    </>
  );
}
