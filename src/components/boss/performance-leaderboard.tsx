import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp } from "lucide-react";

export async function PerformanceLeaderboard() {
  const supabase = await createClient();

  // Get user profiles with their performance stats
  const { data: profiles } = await supabase.from("profiles").select("*");

  if (!profiles) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Team Performance</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </Card>
    );
  }

  // Get deals won by each user (this month)
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const leaderboard = await Promise.all(
    profiles.map(async (profile) => {
      const { data: wonLeads } = await supabase
        .from("leads")
        .select("*")
        .eq("stage", "won")
        .gte("updated_at", `${thisMonth}-01`)
        .limit(100);

      // Count leads where user was involved (check activities)
      const { data: activities } = await supabase
        .from("activities")
        .select("lead_id")
        .gte("created_at", `${thisMonth}-01`)
        .limit(1000);

      const userLeadIds = activities?.map((a) => a.lead_id) || [];
      const userWonLeads =
        wonLeads?.filter((lead) => userLeadIds.includes(lead.id)) || [];

      return {
        ...profile,
        deals: userWonLeads.length,
        revenue: userWonLeads.length * 4500000, // Avg ₹45L per deal
      };
    })
  );

  // Sort by deals closed
  const sortedLeaderboard = leaderboard.sort((a, b) => b.deals - a.deals).slice(0, 5);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Top Performers (This Month)</h3>
      </div>

      <div className="space-y-4">
        {sortedLeaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deals closed this month</p>
        ) : (
          sortedLeaderboard.map((user, index) => {
            const initials = user.full_name
              ? user.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "??";

            return (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.full_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{(user.revenue / 10000000).toFixed(1)}Cr revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={index === 0 ? "default" : "secondary"}>
                    {user.deals} deals
                  </Badge>
                  {index < 3 && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      Top 3
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
