import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import Link from "next/link";
import { TypoDebug } from "@/components/dev/typo-debug";
import { NavMenu } from "@/components/shared/nav-menu";
import {
  SearchButton,
  SearchCommand,
} from "@/components/shared/search-command";
import { ThemeProvider } from "@/components/shared/theme/theme-provider";
import { ThemeToggle } from "@/components/shared/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import { isPrivateAccessEnabled, PRIVATE_TOGGLE } from "@/lib/auth/constants";
import { getSession } from "@/lib/auth/session";
import { getSessionStore } from "@/lib/auth/session-cache";
import { AuthButton } from "@/components/shared/auth-button";
import type { NavTree } from "@/notion/lib/nav-tree";
import { getNotionPageNav } from "@/lib/notion";
import {
  getPageCover,
  getPageDescription,
  getPageIdFromRecordMap,
  getPageTitle,
} from "@/notion/lib/data";
import { buildNavTree } from "@/notion/lib/nav-tree";
import { getBlockData } from "@/notion/lib/notion-compat";

function resolvePageFavicon(icon: unknown): Metadata["icons"] {
  if (!icon) return undefined;

  // URL string (legacy)
  if (typeof icon === "string" && icon.startsWith("http")) {
    return [{ url: icon }];
  }

  // Emoji string
  if (typeof icon === "string") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`;
    return [{ url: `data:image/svg+xml,${encodeURIComponent(svg)}` }];
  }

  if (typeof icon !== "object" || icon === null) return undefined;
  const iconObj = icon as {
    type?: string;
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  };

  if (iconObj.type === "emoji" && iconObj.emoji) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${iconObj.emoji}</text></svg>`;
    return [{ url: `data:image/svg+xml,${encodeURIComponent(svg)}` }];
  }

  if (iconObj.type === "external" && iconObj.external?.url) {
    return [{ url: iconObj.external.url }];
  }

  if (iconObj.type === "file" && iconObj.file?.url) {
    return [{ url: iconObj.file.url }];
  }

  return undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const pageId = process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;
  if (!pageId) return { title: "Wiki" };

  const recordMap = await getNotionPageNav(pageId);
  const rootId = getPageIdFromRecordMap(recordMap);
  const rootBlock = getBlockData(recordMap, rootId);
  const title = rootBlock ? getPageTitle(rootBlock) : "Wiki";
  const description = rootBlock
    ? getPageDescription(recordMap, rootBlock)
    : undefined;
  const coverUrl = rootBlock ? getPageCover(rootBlock, recordMap) : undefined;
  const icons = resolvePageFavicon(rootBlock?.format?.page_icon);

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title,
    description: description ?? title,
    openGraph: {
      title,
      description: description ?? title,
      type: "website",
      ...(coverUrl && { images: [{ url: coverUrl }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description ?? title,
      ...(coverUrl && { images: [coverUrl] }),
    },
    icons: icons ?? [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>",
      },
    ],
  };
}

function filterPrivateNavItems(navTree: NavTree): NavTree {
  const filterItems = (items: NavTree["sidebar"][number]["items"]) =>
    items.filter((item) => item.icon !== PRIVATE_TOGGLE);

  return {
    groups: navTree.groups.map((g) => ({
      ...g,
      sections: g.sections.map((s) => ({ ...s, items: filterItems(s.items) })),
    })),
    sidebar: navTree.sidebar.map((s) => ({ ...s, items: filterItems(s.items) })),
  };
}

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pageId = process.env.NEXT_PUBLIC_ROOT_NOTION_PAGE_ID;
  const recordMap = pageId ? await getNotionPageNav(pageId) : undefined;
  const rawNavTree = recordMap
    ? buildNavTree(recordMap)
    : { groups: [], sidebar: [] };

  // Seed session store — garantit que les blocs rendus dans le layout voient la session
  const session = isPrivateAccessEnabled() ? await getSession() : null;
  if (isPrivateAccessEnabled()) getSessionStore().user = session;

  const navTree = session ? rawNavTree : filterPrivateNavItems(rawNavTree);

  let siteTitle = "Wiki";
  if (recordMap) {
    const rootId = getPageIdFromRecordMap(recordMap);
    const rootBlock = getBlockData(recordMap, rootId);
    if (rootBlock) siteTitle = getPageTitle(rootBlock);
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex flex-col min-h-svh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow"
        >
          Aller au contenu
        </a>
        <header
          role="banner"
          className="border-border/40 border-b bg-background"
        >
          <Container
            size="wide"
            className="flex h-12 items-center justify-between"
          >
            <Link
              href="/"
              className="text-xs sm:text-sm font-bold tracking-wider uppercase truncate"
            >
              {siteTitle}
            </Link>
            <div className="flex items-center gap-3">
              <NavMenu navTree={navTree} />
              <SearchButton />
              {isPrivateAccessEnabled() && <AuthButton />}
              <ThemeToggle />
            </div>
          </Container>
        </header>
        <SearchCommand />
        {children}
        {process.env.NODE_ENV === "development" && <TypoDebug />}
        <Analytics />
      </div>
    </ThemeProvider>
  );
}
