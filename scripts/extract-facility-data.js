#!/usr/bin/env node

// Script to extract facility data from SQL and generate JavaScript object

const sqlData = `
INSERT INTO "public"."tennis_facilities" ("id", "facility_name", "address", "google_map_url", "lat", "lon", "average_rating", "total_ratings", "created_at", "updated_at", "slug", "qr_color_hex", "qr_target_url", "canonical_addr", "qr_bg_hex", "qr_fg_hex", "court_count", "printed") VALUES ('204', 'Alki Playfield Tennis', 'Alki Playfield 5817 Sw Lander St Seattle, Wa', 'https://www.google.com/maps/search/?api=1&query=5817+SW+Lander+St%2C+Seattle%2C+WA+98136', null, null, null, null, '2025-05-02 18:42:24.297345+00', '2025-05-29 21:30:09.339781+00', 'alki-playfield-tennis', '#004F2D', 'https://firstserveseattle.com', 'alkiplayfield5817swlanderstseattlewa', '#1f3d1d', '#FFFFFF', '2', 'Yes'), ('205', 'Aytc Outdoor Tennis', 'Amy Yee Tennis Center (Aytc) 2000 Martin Luther King Jr. Way S Seattle, Wa', 'https://www.google.com/maps/search/?api=1&query=2000+Martin+Luther+King+Jr+Way+S%2C+Seattle%2C+WA+98144', null, null, null, null, '2025-05-02 18:42:24.297345+00', '2025-05-21 22:25:56.106037+00', 'aytc-outdoor-tennis', '#004F2D', 'https://firstserveseattle.com', 'amyyeetenniscenteraytc2000martinlutherkingjrwaysseattlewa', '#1f3d1d', '#FFFFFF', '6', null), ('206', 'Beacon Hill Playfield Tennis', 'Beacon Hill Playfield 1902 13th Ave S Seattle, Wa', 'https://www.google.com/maps/search/?api=1&query=1902+13th+Ave+S%2C+Seattle%2C+WA+98144', null, null, null, null, '2025-05-02 18:42:24.297345+00', '2025-05-29 21:57:28.693722+00', 'beacon-hill-playfield-tennis', '#004F2D', 'https://firstserveseattle.com', 'beaconhillplayfield190213thavesseattlewa', '#a95027', '#FFFFFF', '2', 'Yes'), ('207', 'Bitter Lake Playfield Tennis', 'Bitter Lake Playfield 13035 Linden Ave N Seattle, Wa', 'https://www.google.com/maps/search/?api=1&query=13035+Linden+Ave+N%2C+Seattle%2C+WA+98133', null, null, null, null, '2025-05-02 18:42:24.297345+00', '2025-05-21 22:25:56.106037+00', 'bitter-lake-playfield-tennis', '#004F2D', 'https://firstserveseattle.com', 'bitterlakeplayfield13035lindenavenseattlewa', '#26408b', '#FFFFFF', '4', null), ('208', 'Brighton Playfield Tennis', 'Brighton Playfield 6000 39th Ave S Seattle, Wa', 'https://www.google.com/maps/search/?api=1&query=6000+39th+Ave+S%2C+Seattle%2C+WA+98136', null, null, null, null, '2025-05-02 18:42:24.297345+00', '2025-05-21 22:25:56.106037+00', 'brighton-playfield-tennis', '#004F2D', 'https://firstserveseattle.com', 'brightonplayfield600039thavesseattlewa', '#26408b', '#FFFFFF', '2', null);
`.trim();

// Parse SQL data into JavaScript objects
function parseSQL(sql) {
  const facilities = {};
  
  // Extract VALUES entries
  const valuesMatch = sql.match(/VALUES\s+(.*)/s);
  if (!valuesMatch) return facilities;
  
  const valuesStr = valuesMatch[1];
  
  // Split by '), (' to get individual records
  const records = valuesStr.split(/\),\s*\(/);
  
  records.forEach(record => {
    // Clean up the record
    let cleanRecord = record.replace(/^\(/, '').replace(/\)$/, '').replace(/;$/, '');
    
    // Split by ', ' but handle quoted strings
    const values = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < cleanRecord.length; i++) {
      const char = cleanRecord[i];
      
      if (!inQuotes && (char === "'" || char === '"')) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        current += char;
      } else if (!inQuotes && char === ',' && cleanRecord[i + 1] === ' ') {
        values.push(current.trim());
        current = '';
        i++; // skip the space
      } else {
        current += char;
      }
    }
    if (current.trim()) values.push(current.trim());
    
    if (values.length >= 18) {
      const id = values[0].replace(/'/g, '');
      const name = values[1].replace(/'/g, '');
      const address = values[2].replace(/'/g, '');
      const googleMapUrl = values[3].replace(/'/g, '');
      const slug = values[10].replace(/'/g, '');
      const courtCount = parseInt(values[16].replace(/'/g, ''));
      
      // Convert address to clean format
      let cleanAddress = address;
      if (googleMapUrl.includes('query=')) {
        const queryMatch = googleMapUrl.match(/query=([^&]+)/);
        if (queryMatch) {
          cleanAddress = decodeURIComponent(queryMatch[1]).replace(/\+/g, ' ');
        }
      }
      
      // Generate file key from slug
      const fileKey = slug.replace(/-/g, '_');
      
      // Extract neighborhood from address/name context
      let neighborhood = 'Seattle';
      if (name.toLowerCase().includes('alki')) neighborhood = 'Alki / West Seattle';
      else if (name.toLowerCase().includes('beacon hill')) neighborhood = 'Beacon Hill';
      else if (name.toLowerCase().includes('bitter lake')) neighborhood = 'Bitter Lake';
      else if (name.toLowerCase().includes('brighton')) neighborhood = 'Highland Park / West Seattle';
      else if (name.toLowerCase().includes('bryant')) neighborhood = 'Bryant / Ravenna';
      else if (name.toLowerCase().includes('discovery')) neighborhood = 'Discovery Park / Magnolia';
      // Add more mappings as needed
      
      facilities[fileKey] = {
        name,
        address: cleanAddress,
        slug,
        courtCount,
        googleMapUrl,
        neighborhood
      };
    }
  });
  
  return facilities;
}

const facilities = parseSQL(sqlData);
console.log('const facilityData = ' + JSON.stringify(facilities, null, 2) + ';');
console.log('\n// Total facilities extracted:', Object.keys(facilities).length);