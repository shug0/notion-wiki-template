"use client";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorProps) {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 text-center animate-in fade-in duration-500"
    >
      <p className="text-8xl font-black tracking-tighter text-muted-foreground/40 select-none mb-6">
        500
      </p>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Quelque chose s&apos;est mal passé
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Une erreur inattendue s&apos;est produite lors du chargement de cette
        page.
      </p>
      <Button onClick={reset} variant="outline">
        Réessayer
      </Button>
    </main>
  );
}
