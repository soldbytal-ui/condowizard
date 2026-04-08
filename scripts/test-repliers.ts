// Test script for Repliers API connectivity
// Run with: npx tsx scripts/test-repliers.ts

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.REPLIERS_API_KEY;

if (!API_KEY) {
  console.error('ERROR: REPLIERS_API_KEY not found in environment');
  process.exit(1);
}

console.log(`API Key: ${API_KEY.slice(0, 8)}... (${API_KEY.length} chars total)`);

async function testListingsGET() {
  console.log('\n--- Test 1: GET /listings (query params) ---');
  const params = new URLSearchParams({
    city: 'Toronto',
    status: 'A',
    resultsPerPage: '3',
    type: 'sale',
    sortBy: 'updatedOnDesc',
    statistics: 'avg-listPrice,med-listPrice,cnt-available',
  });
  const url = `https://api.repliers.io/listings?${params}`;
  console.log(`GET ${url}`);

  const res = await fetch(url, {
    headers: { 'REPLIERS-API-KEY': API_KEY! },
  });

  console.log(`Status: ${res.status} ${res.statusText}`);
  const text = await res.text();

  if (!res.ok) {
    console.error('ERROR:', text.slice(0, 500));
    return;
  }

  const data = JSON.parse(text);
  console.log(`count: ${data.count}, numPages: ${data.numPages}, listings: [${data.listings?.length}]`);
  console.log('statistics:', JSON.stringify(data.statistics || 'none'));

  if (data.listings?.[0]) {
    const l = data.listings[0];
    console.log(`\nFirst listing:`);
    console.log(`  MLS#: ${l.mlsNumber}`);
    console.log(`  Price: $${l.listPrice?.toLocaleString()}`);
    console.log(`  Address: ${l.address?.streetNumber} ${l.address?.streetName} ${l.address?.streetSuffix} #${l.address?.unitNumber || ''}`);
    console.log(`  City: ${l.address?.city}`);
    console.log(`  Neighborhood: ${l.address?.neighborhood}`);
    console.log(`  Beds: ${l.details?.numBedrooms}, Baths: ${l.details?.numBathrooms}`);
    console.log(`  Sqft: ${l.details?.sqft}`);
    console.log(`  Type: ${l.details?.propertyType}`);
    console.log(`  Style: ${l.details?.style}`);
    console.log(`  Stories: ${l.details?.stories}`);
    console.log(`  Images: ${l.images?.length || 0}`);
    console.log(`  DOM: ${l.daysOnMarket}`);
    console.log(`  Maintenance: ${l.details?.maintenanceFee}`);
    console.log(`  Community: ${l.address?.communityCode || l.address?.community}`);
  }
}

async function testAutocompleteCorrected() {
  console.log('\n--- Test 2: GET /locations/autocomplete (search param) ---');
  const url = `https://api.repliers.io/locations/autocomplete?search=Yorkville&city=Toronto`;
  const res = await fetch(url, {
    headers: { 'REPLIERS-API-KEY': API_KEY! },
  });
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log('Response:', text.slice(0, 500));
}

async function testSingleListing() {
  console.log('\n--- Test 3: GET /listings/<mlsNumber> ---');
  // First get a valid MLS number
  const searchRes = await fetch('https://api.repliers.io/listings?city=Toronto&status=A&resultsPerPage=1', {
    headers: { 'REPLIERS-API-KEY': API_KEY! },
  });
  const searchData = await searchRes.json();
  const mls = searchData.listings?.[0]?.mlsNumber;
  if (!mls) { console.log('No listing found to test'); return; }

  console.log(`GET /listings/${mls}`);
  // Try different boardIds to find the right one
  for (const boardId of [1, 6, 15, 17]) {
    const tryRes = await fetch(`https://api.repliers.io/listings/${mls}?boardId=${boardId}`, {
      headers: { 'REPLIERS-API-KEY': API_KEY! },
    });
    console.log(`  boardId=${boardId}: ${tryRes.status}`);
    if (tryRes.ok) {
      const data = await tryRes.json();
      console.log(`  SUCCESS! Keys: ${Object.keys(data).join(', ').slice(0, 200)}`);
      break;
    }
  }
  // Also try without boardId but with other params
  const res = await fetch(`https://api.repliers.io/listings/${mls}`, {
    headers: { 'REPLIERS-API-KEY': API_KEY! },
  });
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  if (res.ok) {
    const data = JSON.parse(text);
    console.log(`Keys: ${Object.keys(data).join(', ')}`);
    console.log(`Comparables: ${data.comparables?.length || 'none'}`);
    console.log(`History: ${data.history?.length || 'none'}`);
  } else {
    console.error('ERROR:', text.slice(0, 500));
  }
}

(async () => {
  try {
    await testListingsGET();
    await testAutocompleteCorrected();
    await testSingleListing();
  } catch (error) {
    console.error('Fatal error:', error);
  }
})();
