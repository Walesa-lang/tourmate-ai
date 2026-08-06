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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
