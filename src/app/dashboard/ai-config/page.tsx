"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { AIConfigDashboard } from "@/components/ai-config/ai-config-dashboard";

export default function AIConfigPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Mock user data for now - in production this would come from auth
  const user = {
    fullName: "Admin User",
    email: "admin@realtypilot.com",
    role: "admin"
  };

  return (
    <div className="min-h-screen bg-surface-100 flex">
      {/* Sidebar */}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <DashboardHeader
          user={user}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          <div className="container mx-auto py-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">AI Configuration Dashboard</h1>
              <p className="text-surface-600">
                Customize your AI assistant behavior, teach it what to say, and manage its knowledge
              </p>
            </div>
            
            <AIConfigDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}
