#!/bin/bash
# Run firecrawl searches in parallel batches
# Usage: bash scripts/run-searches.sh

BATCH_SIZE=5
DELAY=2
COUNT=0
TOTAL=$(wc -l < scripts/search-commands.txt)

echo "Running $TOTAL firecrawl searches in batches of $BATCH_SIZE..."

while IFS= read -r cmd; do
    COUNT=$((COUNT + 1))
    SLUG=$(echo "$cmd" | grep -oP '(?<=search-)[^.]+')

    # Skip if already scraped
    OUTFILE=$(echo "$cmd" | grep -oP '(?<=-o )\S+')
    if [ -f "$OUTFILE" ] && [ -s "$OUTFILE" ]; then
        echo "[$COUNT/$TOTAL] SKIP (already exists): $SLUG"
        continue
    fi

    echo "[$COUNT/$TOTAL] Searching: $SLUG"
    eval "$cmd" &

    # Every BATCH_SIZE commands, wait for batch to finish
    if [ $((COUNT % BATCH_SIZE)) -eq 0 ]; then
        wait
        echo "  Batch done. Sleeping ${DELAY}s..."
        sleep $DELAY
    fi
done < scripts/search-commands.txt

# Wait for any remaining
wait
echo ""
echo "All searches complete!"
echo "Files created: $(ls .firecrawl/search-*.json 2>/dev/null | wc -l)"
