import { Metadata } from 'next';
import CondosClient from './CondosClient';
import { AIRBNB_BUILDINGS, TOTAL_BUILDINGS } from '@/data/airbnb-buildings';

export const metadata: Metadata = {
  title: 'Condo Buildings in Toronto | CondoWizard',
  description: `Browse ${TOTAL_BUILDINGS}+ condo buildings across Toronto and the GTA. View active listings, rentals, sold history, amenities and maintenance fees for every building.`,
};

export default function CondosPage() {
  const buildings = AIRBNB_BUILDINGS.map((b) => ({
    slug: b.slug,
    address: b.address,
    buildingName: b.buildingName,
    neighbourhood: b.neighbourhood,
    lat: b.lat,
    lng: b.lng,
  }));

  const neighbourhoods = Array.from(new Set(buildings.map((b) => b.neighbourhood))).sort();

  return (
    <div className="pt-14 bg-bg min-h-screen">
      <div className="container-main py-10">
        <header className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-text-primary">Condo Buildings in Toronto</h1>
          <p className="text-text-muted mt-2">
            {buildings.length} condo buildings across Toronto and the GTA — view active listings, maintenance fees, amenities and sold history.
          </p>
        </header>
        <CondosClient buildings={buildings} neighbourhoods={neighbourhoods} />
      </div>
    </div>
  );
}
