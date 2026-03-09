"use client";

import { IconCornerDownRight, IconSearch, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchResult {
  id: string;
  title: string;
  path: string;
  snippet?: string;
  icon?: string;
}

function PageIcon({ icon }: { icon: string }) {
  // URL icon (image)
  if (icon.startsWith("http")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={icon}
        alt=""
        className="size-4 shrink-0 rounded-sm object-contain"
      />
    );
  }
  // Custom Notion emoji — not resolvable, skip
  if (icon.startsWith("notion://")) return null;
  // Emoji string
  return <span className="shrink-0 leading-none">{icon}</span>;
}

const HIGHLIGHT_RE = /(<gzkNfoUU>.*?<\/gzkNfoUU>)/g;

function HighlightSnippet({ text }: { text: string }) {
  const parts = text.split(HIGHLIGHT_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("<gzkNfoUU>")) {
          const content = part.slice(10, -11); // strip open/close tags
          return (
            <mark
              key={i}
              className="bg-transparent text-primary font-medium not-italic"
            >
              {content}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // CMD+K + custom event "search:open"
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    function handleSearchOpen() {
      setOpen(true);
    }

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("search:open", handleSearchOpen);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("search:open", handleSearchOpen);
    };
  }, []);

  // Debounce 300ms → fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(id: string) {
    router.push(`/${id}`);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setQuery("");
      setResults([]);
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Recherche"
      description="Rechercher une page dans le wiki"
      className="max-sm:inset-0 max-sm:max-w-none max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 sm:max-w-2xl sm:top-1/2 sm:-translate-y-1/2"
    >
      <Command shouldFilter={false} className="max-sm:rounded-none!">
        <div className="flex items-center">
          <div className="relative flex-1 min-w-0">
            <CommandInput
              placeholder="Rechercher une page…"
              value={query}
              onValueChange={setQuery}
            />
            {results.length > 0 && (
              <span className="pointer-events-none absolute right-3 top-1 bottom-0 flex items-center text-[0.55rem] sm:text-[0.6rem] text-muted-foreground/50 tabular-nums">
                {results.length} résultat{results.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="shrink-0 pr-3 pl-1 self-stretch flex items-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            aria-label="Fermer la recherche"
          >
            <IconX size={22} />
          </button>
        </div>
        <CommandList className="sm:max-h-[28rem] px-1 pt-1 max-sm:flex-1 max-sm:max-h-none">
          <CommandEmpty className="py-10 text-sm">
            {loading ? "Recherche en cours…" : "Aucun résultat."}
          </CommandEmpty>
          {results.map((result) => (
            <CommandItem
              key={result.id}
              value={result.id}
              onSelect={() => handleSelect(result.id)}
              className="min-h-14 px-4 py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex items-baseline gap-2 min-w-0">
                  {result.icon && <PageIcon icon={result.icon} />}
                  <span className="font-medium shrink-0 sm:text-sm">
                    {result.title}
                  </span>
                  {result.snippet && (
                    <span className="text-muted-foreground/60 text-[0.6rem] sm:text-xs italic truncate min-w-0">
                      …<HighlightSnippet text={result.snippet} />
                    </span>
                  )}
                </div>
                {result.path && (
                  <div className="flex items-center gap-1 text-muted-foreground/50 min-w-0">
                    <IconCornerDownRight className="size-3 shrink-0" />
                    <span className="text-[0.6rem] sm:text-xs truncate">
                      {result.path}
                    </span>
                  </div>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export function SearchButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("search:open"))}
      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Rechercher (⌘K)"
    >
      <IconSearch className="size-3.5" />
      <span className="hidden sm:inline">Rechercher</span>
      <kbd className="hidden rounded border border-border/60 bg-background px-1 py-0.5 font-mono text-[0.6rem] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
