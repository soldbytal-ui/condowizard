import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const API_KEY = process.env.REPLIERS_API_KEY!;

  // Get a listing to find its boardId
  const r = await fetch('https://api.repliers.io/listings?city=Toronto&status=A&resultsPerPage=1', {
    headers: { 'REPLIERS-API-KEY': API_KEY },
  });
  const d = await r.json();
  const l = d.listings[0];
  console.log('boardId:', l.boardId);
  console.log('resource:', l.resource);
  console.log('mlsNumber:', l.mlsNumber);
  console.log('All top-level keys:', Object.keys(l).sort().join(', '));

  // Try single listing with discovered boardId
  const boardId = l.boardId;
  if (boardId) {
    const r2 = await fetch(`https://api.repliers.io/listings/${l.mlsNumber}?boardId=${boardId}`, {
      headers: { 'REPLIERS-API-KEY': API_KEY },
    });
    console.log(`\nSingle listing (boardId=${boardId}): ${r2.status}`);
    if (r2.ok) {
      const d2 = await r2.json();
      console.log('Keys:', Object.keys(d2).sort().join(', '));
      console.log('Comparables:', d2.comparables?.length || 'none');
      console.log('History:', d2.history?.length || 'none');
    } else {
      const err = await r2.text();
      console.log('Error:', err.slice(0, 300));
    }
  }
}

main().catch(console.error);
