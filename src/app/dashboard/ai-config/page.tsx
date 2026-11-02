import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AIConfigDashboard } from "@/components/ai-config/ai-config-dashboard";

export default function AIConfigPage() {
  return (
    <DashboardShell>
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Configuration Dashboard</h1>
          <p className="text-muted-foreground">
            Customize your AI assistant behavior, teach it what to say, and manage its knowledge
          </p>
        </div>
        
        <AIConfigDashboard />
      </div>
    </DashboardShell>
  );
}
