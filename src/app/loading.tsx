import { Skeleton } from "@mairie360/lib-components/primitives";

export default function Loading() {
  return <section aria-busy="true" className="space-y-6 p-6">
    <h1 className="text-2xl font-semibold">Administration</h1>
    <p role="status" className="text-sm text-muted-foreground">Chargement du profil et de la console…</p>
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="!h-20" />
      <Skeleton className="!h-12" />
      <Skeleton className="!h-64" />
    </div>
  </section>;
}
