#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Headers to fix based on the consistent pattern in the files
const headerPatterns = [
  { pattern: /^Facility Snapshot$/gm, replacement: '### Facility Snapshot' },
  { pattern: /^The Courts: An In-Depth Look$/gm, replacement: '### The Courts: An In-Depth Look' },
  { pattern: /^The Playing Experience: Atmosphere & Availability$/gm, replacement: '### The Playing Experience: Atmosphere & Availability' },
  { pattern: /^Strategic Corner: Gaining Your Edge/gm, replacement: '### Strategic Corner: Gaining Your Edge' },
  { pattern: /^Location, Access, and Amenities$/gm, replacement: '### Location, Access, and Amenities' },
  { pattern: /^The Neighborhood: Beyond the Baseline/gm, replacement: '### The Neighborhood: Beyond the Baseline' },
  { pattern: /^From the Community: Player Reviews Summarized$/gm, replacement: '### From the Community: Player Reviews Summarized' },
  
  // Special headers for specific facilities
  { pattern: /^The Capitol Hill Crown Jewel: Volunteer Park$/gm, replacement: '### The Capitol Hill Crown Jewel: Volunteer Park' },
  { pattern: /^The Civic Heart: Sam Smith Park$/gm, replacement: '### The Civic Heart: Sam Smith Park' },
  
  // Your First Serve of Information as a subtitle
  { pattern: /^Your First Serve of Information$/gm, replacement: '*Your First Serve of Information*' }
];

// Process facility files
const facilityDir = path.join(__dirname, '../facility_pages');
const files = fs.readdirSync(facilityDir);

let processedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.md')) return;
  
  const filePath = path.join(facilityDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Apply all header patterns
  headerPatterns.forEach(({ pattern, replacement }) => {
    const originalContent = content;
    content = content.replace(pattern, replacement);
    if (content !== originalContent) {
      hasChanges = true;
    }
  });
  
  // Fix the facility snapshot table to be proper markdown table
  const tablePattern = /Feature\s+Details\n([\s\S]*?)(?=\n### |$)/;
  if (tablePattern.test(content)) {
    content = content.replace(tablePattern, (match) => {
      // Convert the table format to proper markdown
      const lines = match.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        let table = '| Feature | Details |\n|---------|----------|\n';
        
        for (let i = 1; i < lines.length; i += 2) {
          const feature = lines[i]?.trim() || '';
          const details = lines[i + 1]?.trim() || '';
          if (feature && details) {
            table += `| ${feature} | ${details} |\n`;
          }
        }
        hasChanges = true;
        return table;
      }
      return match;
    });
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed headers in ${file}`);
    processedCount++;
  } else {
    console.log(`⏭️  No changes needed in ${file}`);
  }
});

console.log(`\n📊 Summary: Fixed headers in ${processedCount} files`);