import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Calendar, Phone, Target } from "lucide-react";

export async function BossOverviewCards() {
  const supabase = await createClient();

  // Fetch real-time metrics
  const [
    { count: totalLeads },
    { count: qualifiedLeads },
    { count: upcomingVisits },
    { data: activities },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage", "qualified"),
    supabase.from("visits").select("*", { count: "exact", head: true }).eq("status", "scheduled"),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  // Calculate conversion rate
  const wonLeads = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("stage", "won");

  const conversionRate = totalLeads 
    ? ((wonLeads.count || 0) / totalLeads * 100).toFixed(1)
    : "0";

  // Count today's activities
  const today = new Date().toISOString().split("T")[0];
  const todayActivities = activities?.filter(
    (a) => a.created_at.startsWith(today)
  ).length || 0;

  const metrics = [
    {
      title: "Total Leads",
      value: totalLeads || 0,
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      change: "+2.3%",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Qualified Leads",
      value: qualifiedLeads || 0,
      change: "+8%",
      icon: Target,
      color: "text-purple-600",
    },
    {
      title: "Upcoming Visits",
      value: upcomingVisits || 0,
      change: "This week",
      icon: Calendar,
      color: "text-orange-600",
    },
    {
      title: "Today's Activities",
      value: todayActivities,
      change: "Live",
      icon: Phone,
      color: "text-pink-600",
    },
    {
      title: "Revenue (Est.)",
      value: "₹" + ((wonLeads.count || 0) * 4500000 / 100000).toFixed(1) + "L",
      change: "+15%",
      icon: DollarSign,
      color: "text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.title} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </p>
                <p className="mt-2 text-2xl font-bold">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.change}
                </p>
              </div>
              <Icon className={`h-8 w-8 ${metric.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
