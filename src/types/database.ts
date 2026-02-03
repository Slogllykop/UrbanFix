// Database types - these should be generated from Supabase CLI
// Run: npx supabase gen types typescript --local > src/types/database.ts
// For now, we define the types manually based on our schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "ngo" | "admin";
export type AuthType = "oauth" | "email";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type IssueStatus = "pending" | "verified" | "addressed";
export type VoteType = "upvote" | "downvote";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          auth_type: AuthType;
          last_issue_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          auth_type: AuthType;
          last_issue_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          auth_type?: AuthType;
          last_issue_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ngos: {
        Row: {
          id: string;
          user_id: string | null;
          organization_name: string;
          contact_email: string;
          phone: string;
          address: string;
          description: string | null;
          status: ApplicationStatus;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_name: string;
          contact_email: string;
          phone: string;
          address: string;
          description?: string | null;
          status?: ApplicationStatus;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_name?: string;
          contact_email?: string;
          phone?: string;
          address?: string;
          description?: string | null;
          status?: ApplicationStatus;
          approved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ngo_applications: {
        Row: {
          id: string;
          organization_name: string;
          contact_email: string;
          phone: string;
          address: string;
          description: string;
          status: ApplicationStatus;
          rejection_reason: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_name: string;
          contact_email: string;
          phone: string;
          address: string;
          description: string;
          status?: ApplicationStatus;
          rejection_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_name?: string;
          contact_email?: string;
          phone?: string;
          address?: string;
          description?: string;
          status?: ApplicationStatus;
          rejection_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          image_url: string;
          latitude: number;
          longitude: number;
          address: string | null;
          status: IssueStatus;
          ai_verified: boolean;
          priority_score: number;
          users_reported: number;
          created_at: string;
          updated_at: string;
          addressed_at: string | null;
        };
        Insert: {
          id?: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          image_url: string;
          latitude: number;
          longitude: number;
          address?: string | null;
          status?: IssueStatus;
          ai_verified?: boolean;
          priority_score?: number;
          users_reported?: number;
          created_at?: string;
          updated_at?: string;
          addressed_at?: string | null;
        };
        Update: {
          id?: string;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          address?: string | null;
          status?: IssueStatus;
          ai_verified?: boolean;
          priority_score?: number;
          users_reported?: number;
          created_at?: string;
          updated_at?: string;
          addressed_at?: string | null;
        };
        Relationships: [];
      };
      issue_votes: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          vote_type: VoteType;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          vote_type: VoteType;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          vote_type?: VoteType;
          created_at?: string;
        };
        Relationships: [];
      };
      issue_reports: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      find_nearby_issues: {
        Args: {
          lat: number;
          lng: number;
          radius_meters?: number;
          days_back?: number;
        };
        Returns: {
          issue_id: string;
          distance_meters: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      auth_type: AuthType;
      application_status: ApplicationStatus;
      issue_status: IssueStatus;
      vote_type: VoteType;
    };
  };
}

// Convenience type aliases
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type NGO = Database["public"]["Tables"]["ngos"]["Row"];
export type NGOInsert = Database["public"]["Tables"]["ngos"]["Insert"];

export type NGOApplication =
  Database["public"]["Tables"]["ngo_applications"]["Row"];
export type NGOApplicationInsert =
  Database["public"]["Tables"]["ngo_applications"]["Insert"];

export type Issue = Database["public"]["Tables"]["issues"]["Row"];
export type IssueInsert = Database["public"]["Tables"]["issues"]["Insert"];
export type IssueUpdate = Database["public"]["Tables"]["issues"]["Update"];

export type IssueVote = Database["public"]["Tables"]["issue_votes"]["Row"];
export type IssueVoteInsert =
  Database["public"]["Tables"]["issue_votes"]["Insert"];

export type IssueReport = Database["public"]["Tables"]["issue_reports"]["Row"];
export type IssueReportInsert =
  Database["public"]["Tables"]["issue_reports"]["Insert"];
