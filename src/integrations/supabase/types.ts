export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          created_at: string
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          word?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          hero_headline: string | null
          hero_subheadline: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          og_image_url: string | null
          search_placeholder: string | null
          slug: string
          state: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          og_image_url?: string | null
          search_placeholder?: string | null
          slug: string
          state: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          og_image_url?: string | null
          search_placeholder?: string | null
          slug?: string
          state?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      city_events: {
        Row: {
          city_id: string
          company_id: string
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          city_id: string
          company_id: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "city_events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "city_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          category_id: string | null
          cep: string | null
          city_id: string
          complement: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          gallery_urls: string[] | null
          hours: Json | null
          id: string
          instagram_url: string | null
          is_featured: boolean
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          neighborhood_id: string | null
          number: string | null
          owner_id: string | null
          phone: string | null
          search_tsv: unknown
          slug: string | null
          status: Database["public"]["Enums"]["company_status"]
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          cep?: string | null
          city_id: string
          complement?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          gallery_urls?: string[] | null
          hours?: Json | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          neighborhood_id?: string | null
          number?: string | null
          owner_id?: string | null
          phone?: string | null
          search_tsv?: unknown
          slug?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          cep?: string | null
          city_id?: string
          complement?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          gallery_urls?: string[] | null
          hours?: Json | null
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          neighborhood_id?: string | null
          number?: string | null
          owner_id?: string | null
          phone?: string | null
          search_tsv?: unknown
          slug?: string | null
          status?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      company_claims: {
        Row: {
          company_id: string
          created_at: string
          document_urls: Json
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          document_urls?: Json
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          document_urls?: Json
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_claims_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_events: {
        Row: {
          company_id: string
          created_at: string
          event_type: string
          id: string
          source: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          event_type: string
          id?: string
          source?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          event_type?: string
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_removal_requests: {
        Row: {
          company_id: string
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["removal_reason"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["removal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["removal_reason"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["removal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["removal_reason"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["removal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_removal_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_reply: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          email_sent_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_alert_prefs: {
        Row: {
          company_id: string
          created_at: string
          id: string
          min_review_rating: number
          notify_new_claim: boolean
          notify_new_review: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          min_review_rating?: number
          notify_new_claim?: boolean
          notify_new_review?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          min_review_rating?: number
          notify_new_claim?: boolean
          notify_new_review?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_alert_prefs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          image_url_1: string | null
          image_url_2: string | null
          is_active: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url_1?: string | null
          image_url_2?: string | null
          is_active?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url_1?: string | null
          image_url_2?: string | null
          is_active?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          handle: string | null
          home_city_id: string | null
          id: string
          is_banned: boolean
          is_public: boolean
          onboarding_completed_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          handle?: string | null
          home_city_id?: string | null
          id: string
          is_banned?: boolean
          is_public?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          handle?: string | null
          home_city_id?: string | null
          id?: string
          is_banned?: boolean
          is_public?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          is_anonymous: boolean
          owner_reply: string | null
          owner_reply_at: string | null
          photos: string[]
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          owner_reply?: string | null
          owner_reply_at?: string | null
          photos?: string[]
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          owner_reply?: string | null
          owner_reply_at?: string | null
          photos?: string[]
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          city_id: string | null
          content_md: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          city_id?: string | null
          content_md: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city_id?: string | null
          content_md?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_pages_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages_versions: {
        Row: {
          content_md: string
          created_at: string
          id: string
          preview_token: string | null
          saved_by: string | null
          slug: string
          title: string
        }
        Insert: {
          content_md: string
          created_at?: string
          id?: string
          preview_token?: string | null
          saved_by?: string | null
          slug: string
          title: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          preview_token?: string | null
          saved_by?: string | null
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_pages_versions_slug_fkey"
            columns: ["slug"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["slug"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      two_fa_email_otp: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      two_fa_reset_requests: {
        Row: {
          contact_email: string
          created_at: string
          full_name: string
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string
          full_name: string
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          full_name?: string
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      reviews_public: {
        Row: {
          comment: string | null
          company_id: string | null
          created_at: string | null
          id: string | null
          is_anonymous: boolean | null
          owner_reply: string | null
          owner_reply_at: string | null
          rating: number | null
          status: Database["public"]["Enums"]["review_status"] | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["review_status"] | null
          user_id?: never
        }
        Update: {
          comment?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["review_status"] | null
          user_id?: never
        }
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_merge_companies: {
        Args: { _source_id: string; _target_id: string }
        Returns: undefined
      }
      admin_resolve_review_report: {
        Args: { _action: string; _report_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          _link?: string
          _message: string
          _metadata?: Json
          _title: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_company_reviews_for_owner: {
        Args: { _company_id: string }
        Returns: {
          comment: string
          company_id: string
          created_at: string
          id: string
          is_anonymous: boolean
          owner_reply: string
          owner_reply_at: string
          rating: number
          status: string
          user_id: string
        }[]
      }
      get_my_reviews: {
        Args: never
        Returns: {
          comment: string | null
          company_id: string
          created_at: string
          id: string
          is_anonymous: boolean
          owner_reply: string | null
          owner_reply_at: string | null
          photos: string[]
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_or_create_neighborhood: {
        Args: { _city_id: string; _name: string }
        Returns: string
      }
      get_public_profile: {
        Args: { _handle: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          handle: string
          id: string
          review_count: number
        }[]
      }
      get_public_profile_reviews: {
        Args: { _handle: string; lim?: number }
        Returns: {
          comment: string
          company_id: string
          company_name: string
          company_slug: string
          created_at: string
          id: string
          photos: string[]
          rating: number
        }[]
      }
      get_site_page_version_by_token: {
        Args: { _token: string }
        Returns: {
          content_md: string
          created_at: string
          slug: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reply_to_review: {
        Args: { p_reply: string; p_review_id: string }
        Returns: undefined
      }
      search_companies_autocomplete: {
        Args: { _city_id: string; lim?: number; q: string }
        Returns: {
          city_slug: string
          id: string
          logo_url: string
          name: string
          neighborhood: string
          slug: string
        }[]
      }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "owner" | "user"
      claim_status: "pending" | "approved" | "rejected"
      company_status: "pending" | "approved" | "rejected" | "claimed_pending"
      removal_reason:
        | "closed"
        | "incorrect"
        | "duplicate"
        | "owner_request"
        | "other"
      removal_status: "pending" | "approved" | "rejected"
      review_status: "pending_moderation" | "approved" | "flagged" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner", "user"],
      claim_status: ["pending", "approved", "rejected"],
      company_status: ["pending", "approved", "rejected", "claimed_pending"],
      removal_reason: [
        "closed",
        "incorrect",
        "duplicate",
        "owner_request",
        "other",
      ],
      removal_status: ["pending", "approved", "rejected"],
      review_status: ["pending_moderation", "approved", "flagged", "rejected"],
    },
  },
} as const
