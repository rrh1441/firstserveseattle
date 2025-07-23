/* src/lib/markdown.ts */
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

export interface FacilityData {
  title: string;
  meta_title: string;
  description: string;
  keywords: string;
  author: string;
  date: string;
  facility_name: string;
  address: string;
  neighborhood: string;
  court_count: number;
  google_map_url: string;
  slug: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: string;
  twitter_title: string;
  twitter_description: string;
  local_business: boolean;
  schema_type: string;
}

export interface FacilityPage {
  data: FacilityData;
  htmlContent: string;
}

/** Directory holding the 39 facility Markdown files */
const FACILITY_DIR = path.join(process.cwd(), 'facility_pages');

/** Load one facility by slug (e.g. "beacon_hill_playfield_tennis") */
export async function loadFacility(slug: string): Promise<FacilityPage> {
  const filePath = path.join(FACILITY_DIR, `${slug}.md`);
  const rawSrc = await fs.readFile(filePath, 'utf8');

  const { content, data } = matter(rawSrc);

  const file = await remark()
    .use(remarkHtml)
    .process(content);

  return { data: data as FacilityData, htmlContent: String(file) };
}

/** Return all facility slugs (for getStaticPaths or build‑time loops) */
export async function listFacilitySlugs(): Promise<string[]> {
  const entries = await fs.readdir(FACILITY_DIR);
  return entries
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}