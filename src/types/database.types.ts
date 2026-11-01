export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "visit_scheduled"
  | "visit_completed"
  | "negotiation"
  | "won"
  | "lost";

export type LeadSource =
  | "website_form"
  | "meta_ad"
  | "rera_public"
  | "google_places"
  | "referral"
  | "direct_call"
  | "walk_in";

export type ConsentStatus = "pending" | "granted" | "revoked";

export type MessageDirection = "inbound" | "outbound";

export type MessageSenderType = "lead" | "agent" | "ai_system";

export type PlotStatus = "available" | "booked" | "sold" | "blocked";

export type VisitStatus = "scheduled" | "confirmed" | "completed" | "rescheduled" | "cancelled" | "no_show";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "admin" | "sales_rep" | "manager";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: "admin" | "sales_rep" | "manager";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "admin" | "sales_rep" | "manager";
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          location_area: string;
          city: string;
          rera_number: string;
          possession_date: string | null;
          min_budget: number | null;
          max_budget: number | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location_area: string;
          city?: string;
          rera_number: string;
          possession_date?: string | null;
          min_budget?: number | null;
          max_budget?: number | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          location_area?: string;
          city?: string;
          rera_number?: string;
          possession_date?: string | null;
          min_budget?: number | null;
          max_budget?: number | null;
          description?: string | null;
          updated_at?: string;
        };
      };
      plots: {
        Row: {
          id: string;
          project_id: string;
          plot_number: string;
          size_sqft: number;
          dimension: string | null;
          facing: string | null;
          price_total: number;
          status: PlotStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          plot_number: string;
          size_sqft: number;
          dimension?: string | null;
          facing?: string | null;
          price_total: number;
          status?: PlotStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          plot_number?: string;
          size_sqft?: number;
          dimension?: string | null;
          facing?: string | null;
          price_total?: number;
          status?: PlotStatus;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          city: string | null;
          budget_min: number | null;
          budget_max: number | null;
          preferred_size_sqft: number | null;
          timeline_months: number | null;
          loan_needed: boolean | null;
          purpose: "end_use" | "investment" | null;
          stage: LeadStage;
          score: number;
          source: LeadSource;
          opted_out: boolean;
          needs_human_followup: boolean;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          city?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_size_sqft?: number | null;
          timeline_months?: number | null;
          loan_needed?: boolean | null;
          purpose?: "end_use" | "investment" | null;
          stage?: LeadStage;
          score?: number;
          source?: LeadSource;
          opted_out?: boolean;
          needs_human_followup?: boolean;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string;
          email?: string | null;
          city?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_size_sqft?: number | null;
          timeline_months?: number | null;
          loan_needed?: boolean | null;
          purpose?: "end_use" | "investment" | null;
          stage?: LeadStage;
          score?: number;
          source?: LeadSource;
          opted_out?: boolean;
          needs_human_followup?: boolean;
          assigned_to?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          lead_id: string;
          direction: MessageDirection;
          sender_type: MessageSenderType;
          whatsapp_message_id: string | null;
          body: string;
          status: "sent" | "delivered" | "read" | "failed";
          payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          direction: MessageDirection;
          sender_type: MessageSenderType;
          whatsapp_message_id?: string | null;
          body: string;
          status?: "sent" | "delivered" | "read" | "failed";
          payload?: Json | null;
          created_at?: string;
        };
        Update: {
          body?: string;
          status?: "sent" | "delivered" | "read" | "failed";
          payload?: Json | null;
        };
      };
      visits: {
        Row: {
          id: string;
          lead_id: string;
          project_id: string;
          scheduled_at_utc: string;
          status: VisitStatus;
          assigned_rep_id: string | null;
          notes: string | null;
          reminder_sent_24h: boolean;
          reminder_sent_2h: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          project_id: string;
          scheduled_at_utc: string;
          status?: VisitStatus;
          assigned_rep_id?: string | null;
          notes?: string | null;
          reminder_sent_24h?: boolean;
          reminder_sent_2h?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          scheduled_at_utc?: string;
          status?: VisitStatus;
          assigned_rep_id?: string | null;
          notes?: string | null;
          reminder_sent_24h?: boolean;
          reminder_sent_2h?: boolean;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          lead_id: string;
          performed_by: string | null;
          activity_type: string;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          performed_by?: string | null;
          activity_type: string;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          description?: string;
          metadata?: Json | null;
        };
      };
      consents: {
        Row: {
          id: string;
          lead_id: string;
          status: ConsentStatus;
          channel: "whatsapp" | "sms" | "call" | "email";
          consent_text: string;
          recorded_ip: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          status: ConsentStatus;
          channel?: "whatsapp" | "sms" | "call" | "email";
          consent_text: string;
          recorded_ip?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ConsentStatus;
          updated_at?: string;
        };
      };
    };
  };
}
