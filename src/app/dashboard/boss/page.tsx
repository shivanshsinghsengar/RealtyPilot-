import { Suspense } from "react";
import { BossOverviewCards } from "@/components/boss/boss-overview-cards";
import { TeamActivityFeed } from "@/components/boss/team-activity-feed";
import { SalesFunnelChart } from "@/components/boss/sales-funnel-chart";
import { PerformanceLeaderboard } from "@/components/boss/performance-leaderboard";
import { RealtimeIndicator } from "@/components/boss/realtime-indicator";

export const metadata = {
  title: "Boss Dashboard - RealtyPilot",
  description: "Real-time monitoring dashboard for management",
};

export default function BossDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of sales operations
          </p>
        </div>
        <RealtimeIndicator />
      </div>

      {/* Key Metrics Cards */}
      <Suspense fallback={<div>Loading metrics...</div>}>
        <BossOverviewCards />
      </Suspense>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Funnel */}
        <Suspense fallback={<div>Loading funnel...</div>}>
          <SalesFunnelChart />
        </Suspense>

        {/* Performance Leaderboard */}
        <Suspense fallback={<div>Loading leaderboard...</div>}>
          <PerformanceLeaderboard />
        </Suspense>
      </div>

      {/* Team Activity Feed (Real-time) */}
      <Suspense fallback={<div>Loading activity...</div>}>
        <TeamActivityFeed />
      </Suspense>
    </div>
  );
}
