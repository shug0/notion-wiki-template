import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

export default function Loading() {
  return (
    <main className="notion-page">
      {/* Cover */}
      <Bone className="w-full h-[30vh] max-h-[300px] rounded-none" />

      <Container className="pt-4 md:pt-6 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <Bone className="h-4 w-24" />
          <Bone className="h-3 w-3" />
          <Bone className="h-4 w-32" />
        </div>

        {/* Icône + titre */}
        <div className="flex items-center gap-3 mb-8">
          <Bone className="size-10 shrink-0" />
          <Bone className="h-9 w-64" />
        </div>

        {/* Contenu */}
        <div className="space-y-3">
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-4/6" />

          <Bone className="h-6 w-48 mt-6" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
          <Bone className="h-4 w-5/6" />

          <Bone className="h-6 w-36 mt-6" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>
      </Container>
    </main>
  );
}
