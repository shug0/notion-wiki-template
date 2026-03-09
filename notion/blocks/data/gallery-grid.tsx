import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { notionIconVariants, notionTokens } from "../../ui/design-system";
import type { GalleryCardData } from "./collection-gallery";

interface GalleryGridProps {
  cards: GalleryCardData[];
}

export function GalleryGrid({ cards }: GalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <GalleryCard key={card.id} card={card} />
      ))}
    </div>
  );
}

const aspectMap = {
  small: "aspect-[4/1]",
  medium: "aspect-video",
  large: "aspect-[4/3]",
} as const;

function GalleryCard({ card }: { card: GalleryCardData }) {
  const aspectClass = aspectMap[card.coverSize];

  return (
    <Link
      href={card.href}
      className={cn(
        "group block overflow-hidden transition-all hover:shadow-md",
        notionTokens.borders.default,
        notionTokens.borders.rounded,
      )}
    >
      {/* Cover */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
          aspectClass,
          notionTokens.colors.muted,
        )}
      >
        {card.coverUrl ? (
          <Image
            src={card.coverUrl}
            alt={card.title}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-start gap-3 p-8">
            {card.iconEmoji && (
              <span className="text-4xl leading-none">{card.iconEmoji}</span>
            )}
            {card.description ? (
              <p
                className="text-left text-lg italic text-foreground/70 line-clamp-4 leading-snug"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {card.description}
              </p>
            ) : (
              <span className="text-left text-base font-medium text-foreground/70 line-clamp-2">
                {card.title}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <div
        className={cn("flex items-center gap-2 p-3", notionTokens.text.body)}
      >
        <CardIcon emoji={card.iconEmoji} url={card.iconUrl} />
        <span className="truncate font-medium">{card.title}</span>
      </div>
    </Link>
  );
}

function CardIcon({
  emoji,
  url,
}: {
  emoji: string | undefined;
  url: string | undefined;
}) {
  if (emoji) {
    return (
      <span className={cn(notionIconVariants({ size: "sm" }), "shrink-0")}>
        {emoji}
      </span>
    );
  }
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={16}
        height={16}
        className={cn(
          notionIconVariants({ size: "sm" }),
          "object-contain shrink-0",
        )}
        unoptimized
      />
    );
  }
  return null;
}
