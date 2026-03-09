import { cn } from "@/lib/utils";
import { notionTokens } from "./design-system";

interface VideoEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

type VideoPlatform = "youtube" | "vimeo" | "native";

function detectPlatform(url: string): VideoPlatform {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  return "native";
}

function extractYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") return urlObj.pathname.slice(1);
    if (urlObj.hostname.includes("youtube.com")) {
      const embedMatch = urlObj.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
      return urlObj.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

function extractVimeoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split("/").filter(Boolean)[0] || null;
  } catch {
    return null;
  }
}

const iframeAllow =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";

export function VideoEmbed({
  url,
  title = "Video Player",
  className,
}: VideoEmbedProps) {
  const platform = detectPlatform(url);

  if (platform === "youtube") {
    const videoId = extractYouTubeId(url);
    if (!videoId) return null;

    return (
      <div
        className={cn(
          "aspect-video w-full overflow-hidden",
          notionTokens.borders.rounded,
          notionTokens.borders.default,
          notionTokens.colors.muted,
          className,
        )}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`${title} (YouTube)`}
          className="w-full h-full border-0"
          allow={iframeAllow}
          allowFullScreen
        />
      </div>
    );
  }

  if (platform === "vimeo") {
    const videoId = extractVimeoId(url);
    if (!videoId) return null;

    return (
      <div
        className={cn(
          "aspect-video w-full overflow-hidden",
          notionTokens.borders.rounded,
          notionTokens.borders.default,
          notionTokens.colors.muted,
          className,
        )}
      >
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title={`${title} (Vimeo)`}
          className="w-full h-full border-0"
          allow={iframeAllow}
          allowFullScreen
        />
      </div>
    );
  }

  // Native video
  return (
    <video
      src={url}
      controls
      className={cn(
        "w-full",
        notionTokens.borders.rounded,
        notionTokens.borders.default,
        notionTokens.colors.muted,
        className,
      )}
      preload="metadata"
    >
      <track kind="captions" />
      Your browser does not support the video tag.
    </video>
  );
}
