import { Metadata } from 'next';
import CondosClient from './CondosClient';

export const metadata: Metadata = {
  title: 'Condo Buildings in Toronto & GTA | CondoWizard',
  description: 'Browse every condo building across Toronto and the GTA. View active listings, rentals, sold history, amenities and maintenance fees for every building.',
};

const NEIGHBOURHOODS = [
  'Downtown Core', 'King West', 'Liberty Village', 'Queen West', 'Yorkville',
  'The Annex', 'Midtown', 'Yonge-Eglinton', 'North York', 'Scarborough',
  'Etobicoke', 'Leaside', 'Leslieville', 'Riverside', 'Danforth',
  'High Park', 'Junction', 'Waterfront', 'CityPlace', 'Fort York',
  'Bay Street Corridor', 'Entertainment District', 'St. Lawrence',
  'Garden District', 'Harbourfront', 'Bathurst Quay', 'Old Town',
  'Mississauga City Centre', 'Square One', 'Vaughan', 'Richmond Hill', 'Markham',
].sort();

export default function CondosPage() {
  return (
    <div className="pt-14 bg-bg min-h-screen">
      <div className="container-main py-10">
        <header className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-text-primary">Condo Buildings in Toronto</h1>
          <p className="text-text-muted mt-2">
            Search thousands of condo buildings across the GTA — view active listings, maintenance fees, amenities and sold history.
          </p>
        </header>
        <CondosClient neighbourhoods={NEIGHBOURHOODS} />
      </div>
    </div>
  );
}
