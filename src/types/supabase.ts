export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boost_slots: {
        Row: {
          id: string;
          slot_number: number;
          project_name: string;
          project_logo: string;
          project_link: string;
          telegram_link: string | null;
          chart_link: string | null;
          start_time: string;
          end_time: string;
          initial_contribution: number;  // Changed from total_contributions
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string
          slot_number: number
          project_name: string
          project_logo: string
          project_link: string
          telegram_link?: string | null
          chart_link?: string | null
          start_time: string
          end_time: string
          total_contributions: number
          contributor_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slot_number?: number
          project_name?: string
          project_logo?: string
          project_link?: string
          telegram_link?: string | null
          chart_link?: string | null
          start_time?: string
          end_time?: string
          total_contributions?: number
          contributor_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      boost_waitlist: {
        Row: {
          id: string
          project_name: string
          project_logo: string
          project_link: string
          telegram_link: string | null
          chart_link: string | null
          contribution_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_name: string
          project_logo: string
          project_link: string
          telegram_link?: string | null
          chart_link?: string | null
          contribution_amount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_name?: string
          project_logo?: string
          project_link?: string
          telegram_link?: string | null
          chart_link?: string | null
          contribution_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}