"use client";

import { AdministrationModule } from "@mairie360/lib-components";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f3f0] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <AdministrationModule />
      </div>
    </main>
  );
}
