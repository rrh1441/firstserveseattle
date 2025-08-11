#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStructure() {
  // Try to get one row to see structure
  const { data, error } = await supabase
    .from('tennis_courts_history')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample row:', data);
    if (data && data.length > 0) {
      console.log('\nColumns:', Object.keys(data[0]));
    }
  }
}

checkStructure();