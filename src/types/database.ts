export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: "USER" | "ADMIN";
          is_wlu_verified: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "USER" | "ADMIN";
          is_wlu_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: "USER" | "ADMIN";
          is_wlu_verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          entry_fee_cents: number;
          prize_1st_cents: number;
          prize_2nd_cents: number;
          prize_3rd_cents: number;
          prize_bonus_cents: number;
          min_participation_pct: number;
          status: "DRAFT" | "LIVE" | "ENDED" | "PAYOUTS_SENT";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          entry_fee_cents?: number;
          prize_1st_cents?: number;
          prize_2nd_cents?: number;
          prize_3rd_cents?: number;
          prize_bonus_cents?: number;
          min_participation_pct?: number;
          status?: "DRAFT" | "LIVE" | "ENDED" | "PAYOUTS_SENT";
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          entry_fee_cents?: number;
          prize_1st_cents?: number;
          prize_2nd_cents?: number;
          prize_3rd_cents?: number;
          prize_bonus_cents?: number;
          min_participation_pct?: number;
          status?: "DRAFT" | "LIVE" | "ENDED" | "PAYOUTS_SENT";
          created_at?: string;
        };
        Relationships: [];
      };
      season_entries: {
        Row: {
          id: string;
          user_id: string;
          season_id: string;
          status: "PENDING" | "PAID" | "JOINED";
          stripe_session_id: string | null;
          stripe_customer_id: string | null;
          stripe_payment_intent: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          season_id: string;
          status?: "PENDING" | "PAID" | "JOINED";
          stripe_session_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_payment_intent?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          season_id?: string;
          status?: "PENDING" | "PAID" | "JOINED";
          stripe_session_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_payment_intent?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "season_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "season_entries_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          season_id: string;
          title: string;
          description: string;
          category: "SPORTS" | "CAMPUS" | "ACADEMICS" | "GREEK" | "OTHER";
          close_time: string;
          resolve_time: string;
          status: "OPEN" | "CLOSED" | "RESOLVED";
          resolved_outcome: boolean | null;
          resolved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          title: string;
          description: string;
          category?: "SPORTS" | "CAMPUS" | "ACADEMICS" | "GREEK" | "OTHER";
          close_time: string;
          resolve_time: string;
          status?: "OPEN" | "CLOSED" | "RESOLVED";
          resolved_outcome?: boolean | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          title?: string;
          description?: string;
          category?: "SPORTS" | "CAMPUS" | "ACADEMICS" | "GREEK" | "OTHER";
          close_time?: string;
          resolve_time?: string;
          status?: "OPEN" | "CLOSED" | "RESOLVED";
          resolved_outcome?: boolean | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      forecasts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          probability: number;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          probability: number;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          probability?: number;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forecasts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forecasts_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      question_requests: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          status: "PENDING" | "APPROVED" | "DENIED";
          admin_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          status?: "PENDING" | "APPROVED" | "DENIED";
          admin_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          status?: "PENDING" | "APPROVED" | "DENIED";
          admin_note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      prize_claims: {
        Row: {
          id: string;
          season_id: string;
          user_id: string;
          prize_type: "1ST" | "2ND" | "3RD" | "BONUS";
          amount_cents: number;
          verified: boolean;
          claimed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          user_id: string;
          prize_type: "1ST" | "2ND" | "3RD" | "BONUS";
          amount_cents: number;
          verified?: boolean;
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          user_id?: string;
          prize_type?: "1ST" | "2ND" | "3RD" | "BONUS";
          amount_cents?: number;
          verified?: boolean;
          claimed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prize_claims_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prize_claims_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
