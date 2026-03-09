import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 text-center animate-in fade-in duration-500"
    >
      <p className="text-8xl font-black tracking-tighter text-muted-foreground/40 select-none mb-6">
        404
      </p>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Page introuvable
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Cette page n&apos;existe pas ou n&apos;est pas accessible.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center h-10 gap-1.5 px-5 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
