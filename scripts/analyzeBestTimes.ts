#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HourlyStats {
  hour: number;
  day: string;
  avgAvailability: number;
  totalChecks: number;
}

async function analyzeBestTimes() {
  console.log('🎾 Analyzing First Serve Seattle Court Availability Data\n');
  console.log('=' .repeat(60));
  
  try {
    // Get all historical data
    const { data, error } = await supabase
      .from('tennis_courts_history')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No historical data found');
      return;
    }

    console.log(`📊 Analyzing ${data.length} historical records\n`);

    // Group by hour and day of week
    const hourlyStats: Map<string, { totalAvailable: number; totalCourts: number; count: number }> = new Map();
    const dayStats: Map<string, { totalAvailable: number; totalCourts: number; count: number }> = new Map();
    const hourDayStats: Map<string, { totalAvailable: number; totalCourts: number; count: number }> = new Map();

    data.forEach(record => {
      const timestamp = new Date(record.timestamp);
      const hour = timestamp.getHours();
      const day = timestamp.toLocaleDateString('en-US', { weekday: 'long' });
      const hourKey = `${hour}:00`;
      const dayHourKey = `${day}-${hour}`;
      
      // Calculate availability
      const available = record.courts_free || 0;
      const total = record.total_courts || 0;
      
      // Hourly stats (across all days)
      if (!hourlyStats.has(hourKey)) {
        hourlyStats.set(hourKey, { totalAvailable: 0, totalCourts: 0, count: 0 });
      }
      const hourStat = hourlyStats.get(hourKey)!;
      hourStat.totalAvailable += available;
      hourStat.totalCourts += total;
      hourStat.count++;
      
      // Daily stats
      if (!dayStats.has(day)) {
        dayStats.set(day, { totalAvailable: 0, totalCourts: 0, count: 0 });
      }
      const dayStat = dayStats.get(day)!;
      dayStat.totalAvailable += available;
      dayStat.totalCourts += total;
      dayStat.count++;
      
      // Hour+Day combination
      if (!hourDayStats.has(dayHourKey)) {
        hourDayStats.set(dayHourKey, { totalAvailable: 0, totalCourts: 0, count: 0 });
      }
      const hourDayStat = hourDayStats.get(dayHourKey)!;
      hourDayStat.totalAvailable += available;
      hourDayStat.totalCourts += total;
      hourDayStat.count++;
    });

    // Calculate and sort best hours
    console.log('⏰ BEST HOURS (averaged across all days):');
    console.log('-'.repeat(45));
    const hourlyArray = Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({
        hour,
        avgAvailability: (stats.totalAvailable / stats.count),
        avgPercentFree: stats.totalCourts > 0 ? (stats.totalAvailable / stats.totalCourts) * 100 : 0,
        samples: stats.count
      }))
      .sort((a, b) => b.avgAvailability - a.avgAvailability);

    hourlyArray.slice(0, 10).forEach((stat, index) => {
      console.log(`${index + 1}.  ${stat.hour.padEnd(6)} - ${stat.avgAvailability.toFixed(1)} courts free (${stat.avgPercentFree.toFixed(0)}% available)`);
    });

    // Calculate and sort best days
    console.log('\n📅 BEST DAYS OF WEEK:');
    console.log('-'.repeat(45));
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dailyArray = Array.from(dayStats.entries())
      .map(([day, stats]) => ({
        day,
        avgAvailability: (stats.totalAvailable / stats.count),
        avgPercentFree: stats.totalCourts > 0 ? (stats.totalAvailable / stats.totalCourts) * 100 : 0,
        samples: stats.count
      }))
      .sort((a, b) => b.avgAvailability - a.avgAvailability);

    dailyArray.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.day.padEnd(10)} - ${stat.avgAvailability.toFixed(1)} courts free (${stat.avgPercentFree.toFixed(0)}% available)`);
    });

    // Find best day+hour combinations
    console.log('\n🏆 TOP 10 BEST TIME SLOTS:');
    console.log('-'.repeat(45));
    const comboArray = Array.from(hourDayStats.entries())
      .map(([key, stats]) => {
        const [day, hour] = key.split('-');
        return {
          day,
          hour: `${hour}:00`,
          avgAvailability: (stats.totalAvailable / stats.count),
          avgPercentFree: stats.totalCourts > 0 ? (stats.totalAvailable / stats.totalCourts) * 100 : 0,
          samples: stats.count
        };
      })
      .filter(stat => stat.samples > 5) // Only include slots with enough data
      .sort((a, b) => b.avgAvailability - a.avgAvailability);

    comboArray.slice(0, 10).forEach((stat, index) => {
      console.log(`${index + 1}.  ${stat.day.padEnd(10)} ${stat.hour.padEnd(6)} - ${stat.avgAvailability.toFixed(1)} courts (${stat.avgPercentFree.toFixed(0)}%)`);
    });

    // Find worst times (most crowded)
    console.log('\n❌ WORST TIME SLOTS (most crowded):');
    console.log('-'.repeat(45));
    comboArray.slice(-10).reverse().forEach((stat, index) => {
      console.log(`${index + 1}.  ${stat.day.padEnd(10)} ${stat.hour.padEnd(6)} - ${stat.avgAvailability.toFixed(1)} courts (${stat.avgPercentFree.toFixed(0)}%)`);
    });

    // Summary insights
    console.log('\n💡 KEY INSIGHTS:');
    console.log('-'.repeat(45));
    
    const bestHour = hourlyArray[0];
    const worstHour = hourlyArray[hourlyArray.length - 1];
    const bestDay = dailyArray[0];
    const worstDay = dailyArray[dailyArray.length - 1];
    const bestSlot = comboArray[0];
    
    console.log(`• Best hour overall: ${bestHour.hour} (${bestHour.avgAvailability.toFixed(1)} courts free)`);
    console.log(`• Worst hour overall: ${worstHour.hour} (${worstHour.avgAvailability.toFixed(1)} courts free)`);
    console.log(`• Best day: ${bestDay.day} (${bestDay.avgAvailability.toFixed(1)} courts free on average)`);
    console.log(`• Worst day: ${worstDay.day} (${worstDay.avgAvailability.toFixed(1)} courts free on average)`);
    console.log(`• Absolute best time: ${bestSlot.day} at ${bestSlot.hour} (${bestSlot.avgAvailability.toFixed(1)} courts)`);
    
    // Generate email tip based on actual data
    console.log('\n📧 SUGGESTED EMAIL TIP:');
    console.log('-'.repeat(45));
    const top3Hours = hourlyArray.slice(0, 3).map(h => h.hour).join(', ');
    const top2Days = dailyArray.slice(0, 2).map(d => d.day).join(' and ');
    console.log(`"Based on our data, courts are most available around ${top3Hours}.`);
    console.log(`${top2Days}s tend to have the best availability."`);

  } catch (error) {
    console.error('Analysis error:', error);
  }
}

analyzeBestTimes();