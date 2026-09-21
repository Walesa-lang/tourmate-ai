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
