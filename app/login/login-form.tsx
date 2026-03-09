"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  coverUrl?: string;
}

export function LoginForm({ coverUrl }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("redirect") ?? "/";
  const redirectTo = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Erreur de connexion");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="relative flex flex-1 flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      <Link href="/" className={cn(buttonVariants({ variant: "secondary" }), "hidden md:inline-flex absolute top-4 left-4 z-10")}>
        <IconArrowLeft className="size-4" />
        Retour au site
      </Link>
      {/* Gauche — cover */}
      {coverUrl && (
        <div className="md:hidden w-full shrink-0 overflow-hidden max-h-[40vh]">
          <Image
            src={coverUrl}
            alt="Couverture"
            width={1920}
            height={1080}
            className="w-full h-auto object-cover"
            priority
          />
        </div>
      )}
      {coverUrl && (
        <div className="hidden md:block md:w-1/2 relative">
          <Image src={coverUrl} alt="Couverture" fill className="object-cover" priority />
        </div>
      )}

      {/* Droite — formulaire */}
      <div className={cn(
        "flex flex-1 flex-col items-center justify-start md:justify-center px-6 py-6 md:px-8 text-center overflow-y-auto",
        coverUrl && "md:w-1/2 md:flex-none",
      )}>
        <div className="w-full max-w-sm space-y-4">
          <div>
            <p className="text-lg font-bold tracking-widest uppercase text-muted-foreground mb-1">
              Espace Membres
            </p>
            <div className="w-8 h-px bg-border mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Connectez-vous avec votre email et votre clé d&apos;accès personnelle.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="token">Clé d&apos;accès</Label>
              <Input
                id="token"
                type="password"
                autoComplete="current-password"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          {process.env.NEXT_PUBLIC_ACCESS_REQUEST_PAGE_ID && (
            <p className="text-sm text-muted-foreground">
              Pas encore accès ?{" "}
              <Link
                href={`/${process.env.NEXT_PUBLIC_ACCESS_REQUEST_PAGE_ID}`}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Demander un accès
              </Link>
            </p>
          )}

          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-full md:hidden")}>
            <IconArrowLeft className="size-4" />
            Retour au site
          </Link>
        </div>
      </div>
    </main>
  );
}
