#!/bin/bash
# Scrape images for all projects and update Supabase
# Usage: bash scripts/scrape-images.sh

SUPABASE_URL="https://fnyrtptmcazhmoztmuay.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"
OUTDIR=".firecrawl"
RESULTS_DIR="scripts/image-results"

mkdir -p "$OUTDIR" "$RESULTS_DIR"

# Get all projects
echo "Fetching all projects..."
curl -s "${SUPABASE_URL}/rest/v1/projects?select=id,name,slug&order=name.asc&apikey=${SUPABASE_KEY}" > "${RESULTS_DIR}/all-projects.json"

echo "Total projects: $(python3 -c "import json; print(len(json.load(open('${RESULTS_DIR}/all-projects.json'))))")"
