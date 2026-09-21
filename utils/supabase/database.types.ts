/**
 * Handwritten Supabase database types for the initial TourMate data schema.
 * These are not generated types. Regenerate or update them after schema changes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tourism_content: {
        Row: { id: string; item_type: "hotel" | "attraction"; name: string; location: string; category: string; country_code: string; source_label: string; source_url: string; verified_at: string; approved: boolean; created_at: string };
        Insert: { id: string; item_type: "hotel" | "attraction"; name: string; location: string; category: string; source_label: string; source_url: string; verified_at: string; approved?: boolean };
        Update: { approved?: boolean; verified_at?: string };
        Relationships: [];
      };
      assistant_usage: {
        Row: AssistantUsage;
        Insert: Pick<AssistantUsage, "request_id" | "user_id" | "network_hash"> & Partial<AssistantUsage>;
        Update: Partial<Omit<AssistantUsage, "request_id" | "user_id" | "network_hash" | "created_at">>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          travel_profile: Json;
          plan: "free" | "plus" | "premium";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          plan?: "free" | "plus" | "premium";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
        };
        Relationships: [];
      };
      saved_trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          travellers: number;
          budget: string | null;
          interests: string[];
          pace: string | null;
          itinerary: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          travellers?: number;
          budget?: string | null;
          interests?: string[];
          pace?: string | null;
          itinerary?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          travellers?: number;
          budget?: string | null;
          interests?: string[];
          pace?: string | null;
          itinerary?: Json;
        };
        Relationships: [];
      };
      favourites: {
        Row: {
          id: string;
          user_id: string;
          item_type: "hotel" | "attraction";
          item_id: string;
          item_snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          item_type: "hotel" | "attraction";
          item_id: string;
          item_snapshot?: Json;
          created_at?: string;
        };
        Update: {
          item_type?: "hotel" | "attraction";
          item_id?: string;
          item_snapshot?: Json;
        };
        Relationships: [];
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          business_name: string;
          business_type: "accommodation" | "car_rental" | "tour_operator" | "restaurant" | "attraction" | "other";
          description: string;
          country: string;
          city: string;
          contact_name: string;
          contact_email: string;
          phone: string;
          website_url: string | null;
          status: "pending" | "approved" | "rejected";
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          business_name: string;
          business_type: "accommodation" | "car_rental" | "tour_operator" | "restaurant" | "attraction" | "other";
          description: string;
          country: string;
          city: string;
          contact_name: string;
          contact_email: string;
          phone: string;
          website_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          business_name?: string;
          business_type?: "accommodation" | "car_rental" | "tour_operator" | "restaurant" | "attraction" | "other";
          description?: string;
          country?: string;
          city?: string;
          contact_name?: string;
          contact_email?: string;
          phone?: string;
          website_url?: string | null;
          status?: "pending" | "approved" | "rejected";
          rejection_reason?: string | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          role: "admin";
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: "admin";
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          role?: "admin";
          created_by?: string | null;
        };
        Relationships: [];
      };
      business_application_reviews: {
        Row: {
          application_id: string;
          decision: "approved" | "rejected";
          internal_admin_note: string | null;
          reviewed_by: string;
          reviewed_at: string;
        };
        Insert: {
          application_id: string;
          decision: "approved" | "rejected";
          internal_admin_note?: string | null;
          reviewed_by: string;
          reviewed_at?: string;
        };
        Update: {
          internal_admin_note?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admit_assistant_request: {
        Args: { p_request: string; p_user: string; p_network: string; p_minute: number; p_day: number; p_ip_minute: number };
        Returns: string;
      };
      assistant_usage_summary: {
        Args: Record<string, never>;
        Returns: { state: string; provider: string; requests: number; estimated_cost_usd: number | null; unknown_cost_requests: number; average_latency_ms: number }[];
      };
      update_travel_profile: {
        Args: { p_action: string; p_payload: Json };
        Returns: Json;
      };
      review_business_application: {
        Args: {
          p_application_id: string;
          p_decision: string;
          p_rejection_reason?: string | null;
          p_internal_admin_note?: string | null;
        };
        Returns: { application_id: string; application_status: string }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type AssistantUsage = {
  request_id: string; user_id: string; network_hash: string; created_at: string; completed_at: string | null;
  provider: "demo" | "openai" | "gemini"; model: string; request_type: "chat" | "itinerary" | "recommendation" | "save" | "remove";
  state: "reserved" | "success" | "fallback" | "validation_failure" | "timeout" | "cancelled" | "quota_rejection" | "provider_failure" | "unavailable";
  input_tokens: number | null; output_tokens: number | null; estimated_cost_usd: number | null; pricing_version: string | null;
  latency_ms: number; retrieval_count: number; tool_count: number; environment: "development" | "test" | "preview" | "production"; app_version: string;
};
