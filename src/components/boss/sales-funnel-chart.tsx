import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function SalesFunnelChart() {
  const supabase = await createClient();

  // Get lead counts by stage
  const stages = ["new", "qualified", "negotiation", "won", "lost"];
  const stageCounts = await Promise.all(
    stages.map(async (stage) => {
      const { count } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("stage", stage);
      return { stage, count: count || 0 };
    })
  );

  const totalLeads = stageCounts.reduce((sum, s) => sum + s.count, 0);

  const stageConfig = {
    new: { label: "New Leads", color: "bg-blue-500" },
    qualified: { label: "Qualified", color: "bg-purple-500" },
    negotiation: { label: "Negotiation", color: "bg-orange-500" },
    won: { label: "Won", color: "bg-green-500" },
    lost: { label: "Lost", color: "bg-gray-400" },
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sales Funnel</h3>
        <Badge variant="outline">{totalLeads} Total</Badge>
      </div>

      <div className="space-y-3">
        {stageCounts.map((item) => {
          const config = stageConfig[item.stage as keyof typeof stageConfig];
          const percentage = totalLeads > 0 ? (item.count / totalLeads) * 100 : 0;

          return (
            <div key={item.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{config.label}</span>
                <span className="text-muted-foreground">
                  {item.count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full ${config.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <p className="text-sm text-muted-foreground">New → Qualified</p>
          <p className="text-xl font-bold">
            {totalLeads > 0
              ? (
                  ((stageCounts.find((s) => s.stage === "qualified")?.count || 0) /
                    (stageCounts.find((s) => s.stage === "new")?.count || 1)) *
                  100
                ).toFixed(0)
              : 0}
            %
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Qualified → Won</p>
          <p className="text-xl font-bold">
            {totalLeads > 0
              ? (
                  ((stageCounts.find((s) => s.stage === "won")?.count || 0) /
                    (stageCounts.find((s) => s.stage === "qualified")?.count || 1)) *
                  100
                ).toFixed(0)
              : 0}
            %
          </p>
        </div>
      </div>
    </Card>
  );
}
