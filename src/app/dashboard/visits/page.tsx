import { createClient } from "@/lib/supabase/server";
import { VisitList } from "@/components/visits/visit-list";
import { VisitBookingModal } from "@/components/visits/visit-booking-modal";
import { VisitItem } from "@/components/visits/visit-card";
import { isTodayInIST } from "@/lib/utils/date";
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VisitsPage() {
  const isPlaceholder =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  let visits: VisitItem[] = [];
  let leadsForModal: Array<{ id: string; full_name: string; phone: string; opted_out: boolean }> = [];
  let projectsForModal: Array<{ id: string; name: string; location: string }> = [];

  if (!isPlaceholder) {
    try {
      const supabase = await createClient();

      const [visitsRes, leadsRes, projectsRes] = await Promise.all([
        supabase
          .from("visits")
          .select(
            `id, lead_id, project_id, scheduled_at_utc, status, notes, reminder_sent_24h, reminder_sent_2h,
             lead:leads(id, full_name, phone, opted_out, stage),
             project:projects(id, name, location)`
          )
          .order("scheduled_at_utc", { ascending: true }),
        supabase
          .from("leads")
          .select("id, full_name, phone, opted_out")
          .order("full_name", { ascending: true }),
        supabase
          .from("projects")
          .select("id, name, location")
          .order("name", { ascending: true }),
      ]);

      if (!visitsRes.error && visitsRes.data) {
        visits = visitsRes.data as unknown as VisitItem[];
      }
      if (!leadsRes.error && leadsRes.data) {
        leadsForModal = leadsRes.data;
      }
      if (!projectsRes.error && projectsRes.data) {
        projectsForModal = projectsRes.data;
      }
    } catch {
      // Fallback handled below
    }
  }

  // Fallback demo data in placeholder mode
  if (isPlaceholder && visits.length === 0) {
    projectsForModal = [
      {
        id: "a1000000-0000-0000-0000-000000000001",
        name: "Narmada Greens",
        location: "Kolar Road, Bhopal",
      },
      {
        id: "a2000000-0000-0000-0000-000000000002",
        name: "Bhojpal Enclave",
        location: "Hoshangabad Road, Bhopal",
      },
    ];

    leadsForModal = [
      {
        id: "c1000000-0000-0000-0000-000000000001",
        full_name: "Rohit Sharma",
        phone: "+919826011111",
        opted_out: false,
      },
      {
        id: "c1000000-0000-0000-0000-000000000002",
        full_name: "Priya Verma",
        phone: "+919826022222",
        opted_out: false,
      },
      {
        id: "c1000000-0000-0000-0000-000000000004",
        full_name: "Neha Saxena",
        phone: "+919826044444",
        opted_out: false,
      },
      {
        id: "c1000000-0000-0000-0000-000000000005",
        full_name: "Vikram Singh Patel",
        phone: "+919826055555",
        opted_out: false,
      },
      {
        id: "c1000000-0000-0000-0000-000000000009",
        full_name: "Kavita Jain (Opted Out)",
        phone: "+919826099999",
        opted_out: true,
      },
    ];

    const now = Date.now();
    visits = [
      {
        id: "v1000000-0000-0000-0000-000000000001",
        lead_id: "c1000000-0000-0000-0000-000000000002",
        project_id: "a1000000-0000-0000-0000-000000000001",
        scheduled_at_utc: new Date(now + 3600000 * 2).toISOString(), // 2 hours from now
        status: "confirmed",
        notes: "Buyer coming by car with family; requested demo of corner plot NG-102.",
        reminder_sent_24h: true,
        reminder_sent_2h: false,
        lead: {
          id: "c1000000-0000-0000-0000-000000000002",
          full_name: "Priya Verma",
          phone: "+919826022222",
          opted_out: false,
          stage: "visit_scheduled",
        },
        project: {
          id: "a1000000-0000-0000-0000-000000000001",
          name: "Narmada Greens",
          location: "Kolar Road, Bhopal",
        },
      },
      {
        id: "v1000000-0000-0000-0000-000000000002",
        lead_id: "c1000000-0000-0000-0000-000000000001",
        project_id: "a2000000-0000-0000-0000-000000000002",
        scheduled_at_utc: new Date(now + 86400000).toISOString(), // tomorrow
        status: "scheduled",
        notes: "Interested in 1200 sqft residential plot near club house.",
        reminder_sent_24h: false,
        reminder_sent_2h: false,
        lead: {
          id: "c1000000-0000-0000-0000-000000000001",
          full_name: "Rohit Sharma",
          phone: "+919826011111",
          opted_out: false,
          stage: "visit_scheduled",
        },
        project: {
          id: "a2000000-0000-0000-0000-000000000002",
          name: "Bhojpal Enclave",
          location: "Hoshangabad Road, Bhopal",
        },
      },
      {
        id: "v1000000-0000-0000-0000-000000000003",
        lead_id: "c1000000-0000-0000-0000-000000000004",
        project_id: "a1000000-0000-0000-0000-000000000001",
        scheduled_at_utc: new Date(now - 86400000 * 2).toISOString(), // 2 days ago
        status: "completed",
        notes: "Liked plot NG-105; requested bank loan estimate from SBI.",
        reminder_sent_24h: true,
        reminder_sent_2h: true,
        lead: {
          id: "c1000000-0000-0000-0000-000000000004",
          full_name: "Neha Saxena",
          phone: "+919826044444",
          opted_out: false,
          stage: "visit_completed",
        },
        project: {
          id: "a1000000-0000-0000-0000-000000000001",
          name: "Narmada Greens",
          location: "Kolar Road, Bhopal",
        },
      },
    ];
  }

  // Calculate Metrics
  const totalVisits = visits.length;
  const todayVisits = visits.filter((v) => isTodayInIST(v.scheduled_at_utc)).length;
  const upcomingVisits = visits.filter(
    (v) =>
      (v.status === "scheduled" || v.status === "confirmed" || v.status === "rescheduled") &&
      new Date(v.scheduled_at_utc).getTime() >= Date.now() - 3600000
  ).length;
  const completedVisits = visits.filter((v) => v.status === "completed").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-brand-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Site Visits & Tour Booking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Coordinate on-site customer visits to Narmada Greens & Bhojpal Enclave projects in Bhopal.
          </p>
        </div>

        <VisitBookingModal leads={leadsForModal} projects={projectsForModal} />
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Booked */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Booked</span>
            <CalendarCheck className="h-4 w-4 text-brand-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalVisits}</div>
          <p className="text-[11px] text-slate-400">All-time appointments</p>
        </div>

        {/* Today's Visits (IST) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today&apos;s Schedule</span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{todayVisits}</div>
          <p className="text-[11px] text-slate-400">Appointments in IST today</p>
        </div>

        {/* Upcoming Visits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Upcoming Queue</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600">{upcomingVisits}</div>
          <p className="text-[11px] text-slate-400">Confirmed & scheduled tours</p>
        </div>

        {/* Completed Tours */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Completed Tours</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{completedVisits}</div>
          <p className="text-[11px] text-slate-400">Conducted site visits</p>
        </div>
      </div>

      {/* Main List */}
      <VisitList
        initialVisits={visits}
        leads={leadsForModal}
        projects={projectsForModal}
      />
    </div>
  );
}
