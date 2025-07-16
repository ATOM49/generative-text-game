import React from "react";

export default function LocationsPage({ params }: { params: { id: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Locations in World: {params.id}
      </h1>
      <p>List and manage locations for this world here.</p>
    </main>
  );
}
