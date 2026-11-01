import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatInIST } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

interface ProfileData {
  full_name: string;
  role: string;
  email: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let userProfile = {
    fullName: "Rahul Sen",
    email: "agent@realtypilot.in",
    role: "sales_rep",
  };

  if (!isPlaceholder) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, email")
      .eq("id", user.id)
      .maybeSingle();

    const profile = data as ProfileData | null;

    userProfile = {
      fullName: profile?.full_name || user.user_metadata?.full_name || "Staff Member",
      email: profile?.email || user.email || "",
      role: profile?.role || user.user_metadata?.role || "sales_rep",
    };
  }

  const initialTimeStr = formatInIST(new Date(), "dd MMM, hh:mm:ss a 'IST'");

  return (
    <DashboardShell user={userProfile} initialTimeStr={initialTimeStr}>
      {children}
    </DashboardShell>
  );
}
