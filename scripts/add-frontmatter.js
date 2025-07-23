#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read CSV data
const csvPath = path.join(__dirname, '../tennis_facilities_rows-3.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV and create facility data map
function parseCsvToFacilityData(csvContent) {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const facilities = {};
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Parse CSV line (handle quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length < headers.length) continue;
    
    const facilityName = values[1];
    const googleMapUrl = values[3];
    const slug = values[10];
    const courtCount = parseInt(values[16]) || 0;
    
    // Extract clean address from Google Maps URL
    let cleanAddress = values[2]; // fallback to raw address
    if (googleMapUrl && googleMapUrl.includes('query=')) {
      const queryMatch = googleMapUrl.match(/query=([^&]+)/);
      if (queryMatch) {
        cleanAddress = decodeURIComponent(queryMatch[1]).replace(/\+/g, ' ');
      }
    }
    
    // Convert slug to file key
    const fileKey = slug.replace(/-/g, '_') + '.md';
    
    // Determine neighborhood from name/address
    let neighborhood = 'Seattle';
    const nameLower = facilityName.toLowerCase();
    const addressLower = cleanAddress.toLowerCase();
    
    if (nameLower.includes('alki')) neighborhood = 'Alki / West Seattle';
    else if (nameLower.includes('beacon hill')) neighborhood = 'Beacon Hill';
    else if (nameLower.includes('bitter lake')) neighborhood = 'Bitter Lake';
    else if (nameLower.includes('brighton')) neighborhood = 'Highland Park / West Seattle';
    else if (nameLower.includes('bryant')) neighborhood = 'Bryant / Ravenna';
    else if (nameLower.includes('david rodgers')) neighborhood = 'Queen Anne';
    else if (nameLower.includes('dearborn')) neighborhood = 'Dearborn Park / West Seattle';
    else if (nameLower.includes('delridge')) neighborhood = 'Delridge / West Seattle';
    else if (nameLower.includes('discovery')) neighborhood = 'Discovery Park / Magnolia';
    else if (nameLower.includes('froula')) neighborhood = 'Froula / Northeast Seattle';
    else if (nameLower.includes('garfield')) neighborhood = 'Central District';
    else if (nameLower.includes('gilman')) neighborhood = 'Ballard';
    else if (nameLower.includes('green lake')) neighborhood = 'Green Lake';
    else if (nameLower.includes('hiawatha')) neighborhood = 'Highland Park / West Seattle';
    else if (nameLower.includes('jefferson')) neighborhood = 'Beacon Hill / International District';
    else if (nameLower.includes('laurelhurst')) neighborhood = 'Laurelhurst';
    else if (nameLower.includes('woodland')) neighborhood = 'Woodland / Green Lake';
    else if (nameLower.includes('madison park')) neighborhood = 'Madison Park';
    else if (nameLower.includes('madrona')) neighborhood = 'Madrona';
    else if (nameLower.includes('magnolia')) neighborhood = 'Magnolia';
    else if (nameLower.includes('meadowbrook')) neighborhood = 'Meadowbrook / Northeast Seattle';
    else if (nameLower.includes('miller')) neighborhood = 'Capitol Hill';
    else if (nameLower.includes('montlake')) neighborhood = 'Montlake';
    else if (nameLower.includes('mount baker')) neighborhood = 'Mount Baker';
    else if (nameLower.includes('observatory')) neighborhood = 'Queen Anne';
    else if (nameLower.includes('rainier beach')) neighborhood = 'Rainier Beach';
    else if (nameLower.includes('rainier')) neighborhood = 'Rainier Valley';
    else if (nameLower.includes('riverview')) neighborhood = 'Riverview / West Seattle';
    else if (nameLower.includes('rogers') || nameLower.includes('eastlake')) neighborhood = 'Eastlake';
    else if (nameLower.includes('sam smith')) neighborhood = 'International District';
    else if (nameLower.includes('seward')) neighborhood = 'Seward Park';
    else if (nameLower.includes('solstice')) neighborhood = 'West Seattle';
    else if (nameLower.includes('soundview')) neighborhood = 'Crown Hill / Ballard';
    else if (nameLower.includes('volunteer')) neighborhood = 'Capitol Hill';
    else if (nameLower.includes('wallingford')) neighborhood = 'Wallingford';
    else if (nameLower.includes('walt hundley')) neighborhood = 'Highland Park / West Seattle';
    else if (nameLower.includes('amy yee') || nameLower.includes('aytc')) neighborhood = 'Beacon Hill / Central District';
    
    facilities[fileKey] = {
      name: facilityName,
      address: cleanAddress,
      slug: slug,
      courtCount: courtCount,
      googleMapUrl: googleMapUrl,
      neighborhood: neighborhood
    };
  }
  
  return facilities;
}

function generateFrontmatter(filename, facilityData) {
  const data = facilityData[filename];
  
  if (!data) {
    console.log(`Warning: No data found for ${filename}`);
    return null;
  }

  const { name, address, slug, courtCount, googleMapUrl, neighborhood } = data;
  
  // Extract zip code for local SEO
  const zipMatch = address.match(/WA\s+(\d{5})/);
  const zipCode = zipMatch ? zipMatch[1] : '98000';
  
  // Create SEO-friendly keywords
  const baseKeywords = [
    name.toLowerCase(),
    'seattle tennis courts',
    `${neighborhood.toLowerCase()} tennis`,
    'tennis courts near me',
    'seattle tennis',
    `${zipCode} tennis courts`,
    'public tennis courts seattle',
    'outdoor tennis courts'
  ];
  
  return `---
title: "${name} | Seattle Tennis Courts | First Serve Seattle"
meta_title: "${name} Courts - Seattle Tennis Information & Reviews"
description: "Complete guide to ${name} in ${neighborhood}, Seattle. Court details, amenities, local tips, and reviews for tennis players in Seattle, WA."
keywords: "${baseKeywords.join(', ')}"
author: "First Serve Seattle"
date: "${new Date().toISOString().split('T')[0]}"
facility_name: "${name}"
address: "${address}"
neighborhood: "${neighborhood}"
court_count: ${courtCount}
google_map_url: "${googleMapUrl}"
slug: "${slug}"
canonical_url: "https://firstserveseattle.com/courts/${slug}"
og_title: "${name} | Seattle Tennis Court Guide"
og_description: "Your complete guide to ${name} in ${neighborhood}. Court conditions, amenities, and local tennis insights."
og_image: "/images/facilities/${slug}-social.jpg"
twitter_card: "summary_large_image"
twitter_title: "${name} Tennis Courts"
twitter_description: "Tennis court guide for ${name} in ${neighborhood}, Seattle"
local_business: true
schema_type: "SportsActivityLocation"
---

`;
}

// Main execution
const facilityData = parseCsvToFacilityData(csvContent);
console.log(`Found ${Object.keys(facilityData).length} facilities in CSV`);

// Process facility files
const facilityDir = path.join(__dirname, '../facility_pages');
const files = fs.readdirSync(facilityDir);

let processedCount = 0;
let skippedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  
  const filePath = path.join(facilityDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has frontmatter
  if (content.startsWith('---')) {
    console.log(`⏭️  Skipping ${file} - already has frontmatter`);
    skippedCount++;
    return;
  }
  
  const frontmatter = generateFrontmatter(file, facilityData);
  if (!frontmatter) {
    console.log(`❌ Skipping ${file} - no facility data`);
    skippedCount++;
    return;
  }
  
  const newContent = frontmatter + content;
  fs.writeFileSync(filePath, newContent);
  
  console.log(`✅ Added frontmatter to ${file}`);
  processedCount++;
});

console.log(`\n📊 Summary:`);
console.log(`✅ Processed: ${processedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files`);
console.log(`📁 Total .md files: ${files.filter(f => f.endsWith('.md')).length}`);

// Show sample facility data for verification
console.log(`\n🔍 Sample facility data:`);
const sampleFiles = Object.keys(facilityData).slice(0, 3);
sampleFiles.forEach(file => {
  const data = facilityData[file];
  console.log(`${file}: ${data.name} (${data.courtCount} courts) - ${data.neighborhood}`);
});