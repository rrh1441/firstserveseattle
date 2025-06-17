'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { BarChart3, Users, DollarSign, TrendingUp, Eye, MousePointer, Filter } from 'lucide-react';

interface AnalyticsData {
  dailyVisits: { date: string; visits: number; uniqueUsers: number }[];
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    paywallHits: number;
    conversions: number;
    conversionRate: number;
  };
  gateExperiments: {
    gate3: { users: number; conversions: number; rate: number };
    gate5: { users: number; conversions: number; rate: number };
    gate7: { users: number; conversions: number; rate: number };
  };
  topEvents: { event: string; count: number; rate: number }[];
  courtMetrics: { courtId: string; name: string; views: number; interactions: number }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Mock data for development
      setData({
        dailyVisits: [
          { date: '2024-01-01', visits: 45, uniqueUsers: 32 },
          { date: '2024-01-02', visits: 52, uniqueUsers: 38 },
          { date: '2024-01-03', visits: 68, uniqueUsers: 45 },
          { date: '2024-01-04', visits: 71, uniqueUsers: 51 },
          { date: '2024-01-05', visits: 89, uniqueUsers: 62 },
          { date: '2024-01-06', visits: 94, uniqueUsers: 68 },
          { date: '2024-01-07', visits: 103, uniqueUsers: 74 },
        ],
        userMetrics: {
          totalUsers: 1247,
          activeUsers: 342,
          paywallHits: 89,
          conversions: 23,
          conversionRate: 25.8,
        },
        gateExperiments: {
          gate3: { users: 412, conversions: 89, rate: 21.6 },
          gate5: { users: 389, conversions: 97, rate: 24.9 },
          gate7: { users: 446, conversions: 134, rate: 30.0 },
        },
        topEvents: [
          { event: 'court_view', count: 2841, rate: 85.2 },
          { event: 'filter_applied', count: 1247, rate: 37.4 },
          { event: 'paywall_reached', count: 89, rate: 2.7 },
          { event: 'maps_opened', count: 567, rate: 17.0 },
          { event: 'signup_clicked', count: 23, rate: 0.7 },
        ],
        courtMetrics: [
          { courtId: '1', name: 'Green Lake Park', views: 234, interactions: 45 },
          { courtId: '2', name: 'Lincoln Park', views: 189, interactions: 38 },
          { courtId: '3', name: 'Volunteer Park', views: 167, interactions: 42 },
          { courtId: '4', name: 'Magnolia Playfield', views: 145, interactions: 28 },
          { courtId: '5', name: 'Cal Anderson Park', views: 134, interactions: 31 },
        ],
      });
    }
    setLoading(false);
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.userMetrics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.userMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {data?.userMetrics.activeUsers && data?.userMetrics.totalUsers 
                ? ((data.userMetrics.activeUsers / data.userMetrics.totalUsers) * 100).toFixed(1) 
                : '0'}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.userMetrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data?.userMetrics.conversions} / {data?.userMetrics.paywallHits} paywall hits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paywall Hits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.userMetrics.paywallHits}</div>
            <p className="text-xs text-muted-foreground">
              {data?.userMetrics.paywallHits && data?.userMetrics.activeUsers 
                ? ((data.userMetrics.paywallHits / data.userMetrics.activeUsers) * 100).toFixed(1) 
                : '0'}% of active users
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiments">Gate Experiments</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="courts">Court Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <div className="grid grid-cols-7 gap-2 h-full">
                  {data?.dailyVisits.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="flex-1 w-full bg-gray-200 rounded-t relative">
                        <div
                          className="bg-blue-500 rounded-t w-full absolute bottom-0"
                          style={{
                            height: `${(day.visits / Math.max(...data.dailyVisits.map(d => d.visits))) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-sm font-medium">{day.visits}</div>
                      <div className="text-xs text-muted-foreground">{day.uniqueUsers} unique</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(data?.gateExperiments || {}).map(([gate, metrics]) => (
              <Card key={gate}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {gate.replace('gate', '')} Day Gate
                    <Badge variant={metrics.rate > 25 ? 'default' : 'secondary'}>
                      {metrics.rate.toFixed(1)}%
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Users:</span>
                      <span className="font-medium">{metrics.users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Conversions:</span>
                      <span className="font-medium">{metrics.conversions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${metrics.rate}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.topEvents.map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        {event.event.includes('filter') && <Filter className="h-4 w-4 text-blue-600" />}
                        {event.event.includes('view') && <Eye className="h-4 w-4 text-blue-600" />}
                        {event.event.includes('click') && <MousePointer className="h-4 w-4 text-blue-600" />}
                        {event.event.includes('paywall') && <DollarSign className="h-4 w-4 text-blue-600" />}
                        {event.event.includes('maps') && <BarChart3 className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div>
                        <div className="font-medium">{event.event.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">{event.rate}% of sessions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{event.count.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">events</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Court Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.courtMetrics.map((court, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{court.name}</div>
                      <div className="text-sm text-muted-foreground">Court ID: {court.courtId}</div>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <div className="font-bold">{court.views}</div>
                        <div className="text-sm text-muted-foreground">views</div>
                      </div>
                      <div>
                        <div className="font-bold">{court.interactions}</div>
                        <div className="text-sm text-muted-foreground">interactions</div>
                      </div>
                      <div>
                        <div className="font-bold">{court.views > 0 ? ((court.interactions / court.views) * 100).toFixed(1) : '0'}%</div>
                        <div className="text-sm text-muted-foreground">engagement</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 