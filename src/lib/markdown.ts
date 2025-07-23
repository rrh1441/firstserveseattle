import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkGfm from 'remark-gfm';

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
  content: string;
  htmlContent: string;
}

const facilityPagesDir = path.join(process.cwd(), 'facility_pages');

export async function getFacilityBySlug(slug: string): Promise<FacilityPage | null> {
  try {
    // Look for markdown file by slug
    const files = fs.readdirSync(facilityPagesDir);
    let targetFile = null;
    
    // First try direct filename match
    const directMatch = files.find(file => {
      const fileSlug = file.replace('.md', '').replace(/_/g, '-');
      return fileSlug === slug;
    });
    
    if (directMatch) {
      targetFile = directMatch;
    } else {
      // Try to find by slug in frontmatter
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const filePath = path.join(facilityPagesDir, file);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(fileContents);
        
        if (data.slug === slug) {
          targetFile = file;
          break;
        }
      }
    }
    
    if (!targetFile) {
      return null;
    }
    
    const filePath = path.join(facilityPagesDir, targetFile);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Process markdown to HTML
    const processedContent = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(content);
    
    return {
      data: data as FacilityData,
      content,
      htmlContent: processedContent.toString(),
    };
  } catch (error) {
    console.error(`Error loading facility ${slug}:`, error);
    return null;
  }
}

export function getAllFacilitySlugs(): string[] {
  try {
    const files = fs.readdirSync(facilityPagesDir);
    const slugs: string[] = [];
    
    files.forEach(file => {
      if (!file.endsWith('.md')) return;
      
      const filePath = path.join(facilityPagesDir, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      
      if (data.slug) {
        slugs.push(data.slug);
      }
    });
    
    return slugs;
  } catch (error) {
    console.error('Error getting facility slugs:', error);
    return [];
  }
}

export function getAllFacilities(): { slug: string; data: FacilityData }[] {
  try {
    const files = fs.readdirSync(facilityPagesDir);
    const facilities: { slug: string; data: FacilityData }[] = [];
    
    files.forEach(file => {
      if (!file.endsWith('.md')) return;
      
      const filePath = path.join(facilityPagesDir, file);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      
      if (data.slug) {
        facilities.push({
          slug: data.slug,
          data: data as FacilityData,
        });
      }
    });
    
    return facilities.sort((a, b) => a.data.facility_name.localeCompare(b.data.facility_name));
  } catch (error) {
    console.error('Error getting all facilities:', error);
    return [];
  }
}