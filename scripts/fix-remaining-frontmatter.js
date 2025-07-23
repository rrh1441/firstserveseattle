#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Manual mapping for the files with different naming patterns
const manualMappings = {
  'sam_smith_park.md': {
    name: 'Sam Smith (I90 Lid) Park Tennis',
    address: '1400 Martin Luther King Jr Way S, Seattle, WA 98144',
    slug: 'sam-smith-i90-lid-park-tennis',
    courtCount: 2,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=1400+Martin+Luther+King+Jr+Way+S%2C+Seattle%2C+WA+98144',
    neighborhood: 'International District'
  },
  'seward_park.md': {
    name: 'Seward Park Tennis',
    address: '5898 Lake Washington Blvd S, Seattle, WA 98118',
    slug: 'seward-park-tennis',
    courtCount: 2,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=5898+Lake+Washington+Blvd+S%2C+Seattle%2C+WA+98118',
    neighborhood: 'Seward Park'
  },
  'solstice_park.md': {
    name: 'Solstice Park Tennis',
    address: '7400 Fauntleroy Way SW, Seattle, WA 98136',
    slug: 'solstice-park-tennis',
    courtCount: 6,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=7400+Fauntleroy+Way+SW%2C+Seattle%2C+WA+98136',
    neighborhood: 'West Seattle'
  },
  'soundview_playfield.md': {
    name: 'Soundview Playfield Tennis',
    address: '1590 NW 90th St, Seattle, WA 98117',
    slug: 'soundview-playfield-tennis',
    courtCount: 2,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=1590+NW+90th+St%2C+Seattle%2C+WA+98117',
    neighborhood: 'Crown Hill / Ballard'
  },
  'volunteer_park.md': {
    name: 'Volunteer Park Court 01 -',
    address: '1247 15th Ave E, Seattle, WA 98112',
    slug: 'volunteer-park-court-01-',
    courtCount: 4,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=1247+15th+Ave+E%2C+Seattle%2C+WA+98112',
    neighborhood: 'Capitol Hill'
  },
  'wallingford_playfield.md': {
    name: 'Wallingford Playfield Tennis',
    address: '4219 Wallingford Ave N, Seattle, WA 98103',
    slug: 'wallingford-playfield-tennis',
    courtCount: 2,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=4219+Wallingford+Ave+N%2C+Seattle%2C+WA+98103',
    neighborhood: 'Wallingford'
  },
  'walt_hundley_playfield.md': {
    name: 'Walt Hundley Playfield Tennis',
    address: '6920 34th Ave SW, Seattle, WA 98126',
    slug: 'walt-hundley-playfield-tennis',
    courtCount: 2,
    googleMapUrl: 'https://www.google.com/maps/search/?api=1&query=6920+34th+Ave+SW%2C+Seattle%2C+WA+98126',
    neighborhood: 'Highland Park / West Seattle'
  }
};

function generateFrontmatter(data) {
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

// Process the manually mapped files
const facilityDir = path.join(__dirname, '../facility_pages');
let processedCount = 0;

Object.entries(manualMappings).forEach(([filename, data]) => {
  const filePath = path.join(facilityDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has frontmatter
  if (content.startsWith('---')) {
    console.log(`⏭️  Skipping ${filename} - already has frontmatter`);
    return;
  }
  
  const frontmatter = generateFrontmatter(data);
  const newContent = frontmatter + content;
  fs.writeFileSync(filePath, newContent);
  
  console.log(`✅ Added frontmatter to ${filename}`);
  processedCount++;
});

console.log(`\n📊 Summary: Processed ${processedCount} additional files`);