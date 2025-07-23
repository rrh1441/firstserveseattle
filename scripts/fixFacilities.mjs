#!/usr/bin/env node
/**
 * Fix common Markdown‑table issues across all facility files.
 *
 * Usage:
 *   node scripts/fixFacilities.mjs [path/to/facilities]
 * ──
 * If no path is supplied, the script assumes `content/facilities`.
 *
 * What it does:
 *   1. Converts non‑breaking spaces to regular spaces.
 *   2. Splits snapshot rows accidentally merged into one line
 *      (e.g. “Court Surface … | Court Lights …”).
 *   3. Ensures every table row both starts **and** ends with a pipe (`|`).
 *   4. Writes changes in‑place and prints a summary.
 *
 * The script is fully idempotent and safe to run multiple times.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_DIR = 'content/facilities';
const facilityDir = path.resolve(process.argv[2] ?? DEFAULT_DIR);

/* ---------- helpers ---------- */

async function dirExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

function normaliseSpaces(text) {
  return text.replace(/[\u00A0]|&nbsp;/g, ' ');
}

function splitMergedSnapshotRows(text) {
  const rowPattern =
    /^\|?\s*(Court Surface|Court Lights)[^|]*\|\s*[^|]*\|\s*(Court Lights|Court Surface)[^|]*\|\s*[^|]*\s*$/gm;

  return text.replace(rowPattern, (match) => {
    const cells = match
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean); // => [Feature1, Detail1, Feature2, Detail2]

    // Guard: if not exactly four cells, leave untouched.
    if (cells.length !== 4) return match;

    return `| ${cells[0]} | ${cells[1]} |\n| ${cells[2]} | ${cells[3]} |`;
  });
}

function completeMissingPipes(text) {
  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('|') && !line.trimEnd().endsWith('|')) {
        return `${line.trimEnd()} |`;
      }
      return line;
    })
    .join('\n');
}

async function fixFile(filePath) {
  const original = await fs.readFile(filePath, 'utf8');
  let updated = original;

  updated = normaliseSpaces(updated);
  updated = splitMergedSnapshotRows(updated);
  updated = completeMissingPipes(updated);

  if (updated !== original) {
    await fs.writeFile(filePath, `${updated.trimEnd()}\n`, 'utf8');
    return true;
  }
  return false;
}

async function processDirectory(dirPath) {
  const entries = await fs.readdir(dirPath);
  let changed = 0;
  let total = 0;

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    total += 1;
    const filePath = path.join(dirPath, entry);
    // eslint-disable-next-line no-await-in-loop
    if (await fixFile(filePath)) changed += 1;
  }

  console.log(`✔ Fixed ${changed} of ${total} Markdown files in ${dirPath}`);
}

/* ---------- CLI ---------- */

(async () => {
  if (!(await dirExists(facilityDir))) {
    console.error(`✖ Directory not found: ${facilityDir}`);
    process.exitCode = 1;
    return;
  }

  await processDirectory(facilityDir);
})();
