export default function Loading() {
  return <section aria-busy="true" className="space-y-6 p-6">
    <h1 className="text-2xl font-semibold">Administration</h1>
    <p role="status" className="text-sm text-muted-foreground">Chargement du profil et de la console…</p>
    <div aria-hidden="true" className="space-y-4 motion-reduce:animate-none animate-pulse">
      <div className="h-20 rounded-lg bg-muted" />
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-64 rounded-lg bg-muted" />
    </div>
  </section>;
}
