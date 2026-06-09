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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      broadcast_campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string
          created_at: string
          delivered_at: string | null
          failure_reason: string | null
          id: string
          meta_message_id: string | null
          send_status: string
          sent_at: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          created_at?: string
          delivered_at?: string | null
          failure_reason?: string | null
          id?: string
          meta_message_id?: string | null
          send_status?: string
          sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          created_at?: string
          delivered_at?: string | null
          failure_reason?: string | null
          id?: string
          meta_message_id?: string | null
          send_status?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_campaigns: {
        Row: {
          content_type: string | null
          content_type_draft: string | null
          created_at: string
          id: string
          published_at: string | null
          queue_id: string | null
          queue_id_draft: string | null
          status: string
          survey_flow_id: string | null
          survey_flow_id_draft: string | null
          template_name: string | null
          template_name_draft: string | null
          template_params: Json | null
          template_params_draft: Json | null
          total_delivered: number
          total_sent: number
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          content_type_draft?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          queue_id?: string | null
          queue_id_draft?: string | null
          status?: string
          survey_flow_id?: string | null
          survey_flow_id_draft?: string | null
          template_name?: string | null
          template_name_draft?: string | null
          template_params?: Json | null
          template_params_draft?: Json | null
          total_delivered?: number
          total_sent?: number
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          content_type_draft?: string | null
          created_at?: string
          id?: string
          published_at?: string | null
          queue_id?: string | null
          queue_id_draft?: string | null
          status?: string
          survey_flow_id?: string | null
          survey_flow_id_draft?: string | null
          template_name?: string | null
          template_name_draft?: string | null
          template_params?: Json | null
          template_params_draft?: Json | null
          total_delivered?: number
          total_sent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_campaigns_queue_id_draft_fkey"
            columns: ["queue_id_draft"]
            isOneToOne: false
            referencedRelation: "whatsapp_queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_survey_flow_id_draft_fkey"
            columns: ["survey_flow_id_draft"]
            isOneToOne: false
            referencedRelation: "survey_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_survey_flow_id_fkey"
            columns: ["survey_flow_id"]
            isOneToOne: false
            referencedRelation: "survey_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_responses: {
        Row: {
          campaign_id: string
          contact_id: string
          id: string
          meta_message_id: string | null
          received_at: string
          response_type: string
          response_value: string
        }
        Insert: {
          campaign_id: string
          contact_id: string
          id?: string
          meta_message_id?: string | null
          received_at?: string
          response_type?: string
          response_value: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          id?: string
          meta_message_id?: string | null
          received_at?: string
          response_type?: string
          response_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          footer_note_extra: string | null
          footer_note_flour: string | null
          footer_note_slices: string | null
          has_pizza_size_pricing: boolean
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          footer_note_extra?: string | null
          footer_note_flour?: string | null
          footer_note_slices?: string | null
          has_pizza_size_pricing?: boolean
          id?: never
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          footer_note_extra?: string | null
          footer_note_flour?: string | null
          footer_note_slices?: string | null
          has_pizza_size_pricing?: boolean
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_sections: {
        Row: {
          columns_per_row: number
          created_at: string
          has_paper_texture: boolean
          id: number
          is_active: boolean
          page_key: string
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          columns_per_row?: number
          created_at?: string
          has_paper_texture?: boolean
          id?: never
          is_active?: boolean
          page_key?: string
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          columns_per_row?: number
          created_at?: string
          has_paper_texture?: boolean
          id?: never
          is_active?: boolean
          page_key?: string
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: number
          image_url: string
          is_active: boolean
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: never
          image_url: string
          is_active?: boolean
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: never
          image_url?: string
          is_active?: boolean
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      nav_links: {
        Row: {
          column_key: string
          created_at: string
          id: number
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          column_key?: string
          created_at?: string
          id?: never
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          column_key?: string
          created_at?: string
          id?: never
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      page_contents: {
        Row: {
          content: string | null
          content_draft: string | null
          content_published_at: string | null
          created_at: string
          id: number
          image_url: string | null
          image_url_draft: string | null
          is_active: boolean
          page_key: string
          section_key: string
          subtitle: string | null
          title: string | null
          title_draft: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_draft?: string | null
          content_published_at?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          image_url_draft?: string | null
          is_active?: boolean
          page_key: string
          section_key: string
          subtitle?: string | null
          title?: string | null
          title_draft?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_draft?: string | null
          content_published_at?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          image_url_draft?: string | null
          is_active?: boolean
          page_key?: string
          section_key?: string
          subtitle?: string | null
          title?: string | null
          title_draft?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: number
          country_origin: string | null
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          is_house_wine: boolean
          name: string
          origin_country: string | null
          pizza_broto_fixed_price: number | null
          pizza_broto_percentage: number | null
          pizza_broto_pricing_mode: string
          pizza_has_broto: boolean
          pizza_has_mini: boolean
          pizza_mini_fixed_price: number | null
          pizza_mini_percentage: number | null
          pizza_mini_pricing_mode: string
          price: number
          price_carafe: number | null
          price_glass: number | null
          price_half_carafe: number | null
          price_half_pitcher: number | null
          price_pitcher: number | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: number
          country_origin?: string | null
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_house_wine?: boolean
          name: string
          origin_country?: string | null
          pizza_broto_fixed_price?: number | null
          pizza_broto_percentage?: number | null
          pizza_broto_pricing_mode?: string
          pizza_has_broto?: boolean
          pizza_has_mini?: boolean
          pizza_mini_fixed_price?: number | null
          pizza_mini_percentage?: number | null
          pizza_mini_pricing_mode?: string
          price: number
          price_carafe?: number | null
          price_glass?: number | null
          price_half_carafe?: number | null
          price_half_pitcher?: number | null
          price_pitcher?: number | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: number
          country_origin?: string | null
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_house_wine?: boolean
          name?: string
          origin_country?: string | null
          pizza_broto_fixed_price?: number | null
          pizza_broto_percentage?: number | null
          pizza_broto_pricing_mode?: string
          pizza_has_broto?: boolean
          pizza_has_mini?: boolean
          pizza_mini_fixed_price?: number | null
          pizza_mini_percentage?: number | null
          pizza_mini_pricing_mode?: string
          price?: number
          price_carafe?: number | null
          price_glass?: number | null
          price_half_carafe?: number | null
          price_half_pitcher?: number | null
          price_pitcher?: number | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      section_elements: {
        Row: {
          content: string | null
          created_at: string
          element_type: string
          id: number
          image_url: string | null
          is_active: boolean
          section_id: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          element_type?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          section_id: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          element_type?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          section_id?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_elements_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "custom_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          icon_name: string
          id: number
          is_active: boolean
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: never
          is_active?: boolean
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: never
          is_active?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      survey_flows: {
        Row: {
          created_at: string
          description: string | null
          id: string
          intro_message: string
          is_active: boolean
          name: string
          slug: string
          steps: Json
          suggested_queue_slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          intro_message: string
          is_active?: boolean
          name: string
          slug: string
          steps?: Json
          suggested_queue_slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          intro_message?: string
          is_active?: boolean
          name?: string
          slug?: string
          steps?: Json
          suggested_queue_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      survey_session_answers: {
        Row: {
          id: string
          meta_message_id: string | null
          received_at: string
          response_label: string | null
          response_type: string
          response_value: string
          session_id: string
          step_id: string
          step_index: number
        }
        Insert: {
          id?: string
          meta_message_id?: string | null
          received_at?: string
          response_label?: string | null
          response_type?: string
          response_value: string
          session_id: string
          step_id: string
          step_index: number
        }
        Update: {
          id?: string
          meta_message_id?: string | null
          received_at?: string
          response_label?: string | null
          response_type?: string
          response_value?: string
          session_id?: string
          step_id?: string
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "survey_session_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "survey_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_sessions: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          contact_id: string
          current_step_index: number
          flow_id: string
          id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          contact_id: string
          current_step_index?: number
          flow_id: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          contact_id?: string
          current_step_index?: number
          flow_id?: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "survey_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          is_super_admin: boolean
          last_login_at: string | null
          must_change_password: boolean
          permissions: Json
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          is_super_admin?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          is_super_admin?: boolean
          last_login_at?: string | null
          must_change_password?: boolean
          permissions?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_admin_notifications: {
        Row: {
          body: string | null
          campaign_id: string | null
          conversation_id: string | null
          created_at: string
          event_type: string
          href: string | null
          id: string
          payload: Json
          template_id: string | null
          title: string
        }
        Insert: {
          body?: string | null
          campaign_id?: string | null
          conversation_id?: string | null
          created_at?: string
          event_type: string
          href?: string | null
          id?: string
          payload?: Json
          template_id?: string | null
          title: string
        }
        Update: {
          body?: string | null
          campaign_id?: string | null
          conversation_id?: string | null
          created_at?: string
          event_type?: string
          href?: string | null
          id?: string
          payload?: Json
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_admin_notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_admin_notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_admin_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_business_hours: {
        Row: {
          close_time: string | null
          created_at: string
          day_of_week: number
          id: number
          is_open: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: never
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: never
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          created_at: string
          display_name: string | null
          id: number
          phone_number_id: string
          status: string
          updated_at: string
          webhook_verified_at: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: never
          phone_number_id: string
          status?: string
          updated_at?: string
          webhook_verified_at?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: never
          phone_number_id?: string
          status?: string
          updated_at?: string
          webhook_verified_at?: string | null
        }
        Relationships: []
      }
      whatsapp_contact_deletion_audit: {
        Row: {
          contact_snapshot: Json
          deleted_at: string
          deleted_by: string | null
          id: string
          name: string | null
          phone_number: string
          reason: string | null
        }
        Insert: {
          contact_snapshot?: Json
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          name?: string | null
          phone_number: string
          reason?: string | null
        }
        Update: {
          contact_snapshot?: Json
          deleted_at?: string
          deleted_by?: string | null
          id?: string
          name?: string | null
          phone_number?: string
          reason?: string | null
        }
        Relationships: []
      }
      whatsapp_contact_tags: {
        Row: {
          assigned_at: string
          assigned_by: string
          contact_id: string
          tag_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string
          contact_id: string
          tag_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          created_at: string
          email: string | null
          engagement_level: string
          id: string
          import_batch_id: string | null
          import_profile: Json | null
          inbound_count: number
          last_inbound_at: string | null
          last_outbound_at: string | null
          name: string
          opted_out_at: string | null
          phone_number: string
          status: string
          terms_accepted_at: string | null
          terms_accepted_source: string | null
          terms_prompt_sent_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          engagement_level?: string
          id?: string
          import_batch_id?: string | null
          import_profile?: Json | null
          inbound_count?: number
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          name: string
          opted_out_at?: string | null
          phone_number: string
          status?: string
          terms_accepted_at?: string | null
          terms_accepted_source?: string | null
          terms_prompt_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          engagement_level?: string
          id?: string
          import_batch_id?: string | null
          import_profile?: Json | null
          inbound_count?: number
          last_inbound_at?: string | null
          last_outbound_at?: string | null
          name?: string
          opted_out_at?: string | null
          phone_number?: string
          status?: string
          terms_accepted_at?: string | null
          terms_accepted_source?: string | null
          terms_prompt_sent_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contacts_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          contact_removed_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          last_inbound_at: string | null
          last_message_at: string | null
          last_message_direction: string | null
          last_outbound_at: string | null
          status: string
          updated_at: string
          wa_id: string
          whatsapp_contact_id: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_removed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_message_direction?: string | null
          last_outbound_at?: string | null
          status?: string
          updated_at?: string
          wa_id: string
          whatsapp_contact_id?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_removed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_message_direction?: string | null
          last_outbound_at?: string | null
          status?: string
          updated_at?: string
          wa_id?: string
          whatsapp_contact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_whatsapp_contact_id_fkey"
            columns: ["whatsapp_contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_import_batches: {
        Row: {
          created_at: string
          duplicates: number
          error_details: Json
          errors: number
          filename: string | null
          id: string
          imported: number
          status: string
          total_rows: number
        }
        Insert: {
          created_at?: string
          duplicates?: number
          error_details?: Json
          errors?: number
          filename?: string | null
          id?: string
          imported?: number
          status?: string
          total_rows?: number
        }
        Update: {
          created_at?: string
          duplicates?: number
          error_details?: Json
          errors?: number
          filename?: string | null
          id?: string
          imported?: number
          status?: string
          total_rows?: number
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body_text: string | null
          content: Json
          conversation_id: string
          created_at: string
          deleted_at: string | null
          direction: string
          id: string
          is_automated: boolean
          message_type: string
          meta_message_id: string | null
          status: string
        }
        Insert: {
          body_text?: string | null
          content?: Json
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          direction: string
          id?: string
          is_automated?: boolean
          message_type?: string
          meta_message_id?: string | null
          status?: string
        }
        Update: {
          body_text?: string | null
          content?: Json
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          direction?: string
          id?: string
          is_automated?: boolean
          message_type?: string
          meta_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_notification_dismissals: {
        Row: {
          dismissed_at: string
          notification_id: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          notification_id: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notification_dismissals_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_queue_tags: {
        Row: {
          queue_id: string
          rule_type: string
          tag_id: string
        }
        Insert: {
          queue_id: string
          rule_type: string
          tag_id: string
        }
        Update: {
          queue_id?: string
          rule_type?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_queue_tags_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_queue_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_queues: {
        Row: {
          created_at: string
          description: string | null
          exclude_match: string
          id: string
          include_match: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exclude_match?: string
          id?: string
          include_match?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exclude_match?: string
          id?: string
          include_match?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          approved_at: string | null
          archived_at: string | null
          body: string
          category: string
          created_at: string
          display_name: string
          id: string
          is_meta_imported: boolean
          language: string
          meta_template_id: string | null
          name: string
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          approved_at?: string | null
          archived_at?: string | null
          body: string
          category?: string
          created_at?: string
          display_name: string
          id?: string
          is_meta_imported?: boolean
          language?: string
          meta_template_id?: string | null
          name: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          approved_at?: string | null
          archived_at?: string | null
          body?: string
          category?: string
          created_at?: string
          display_name?: string
          id?: string
          is_meta_imported?: boolean
          language?: string
          meta_template_id?: string | null
          name?: string
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      whatsapp_webhook_events: {
        Row: {
          created_at: string
          dedupe_key: string | null
          event_type: string
          id: string
          phone_number_id: string | null
          processed: boolean
          processing_error: string | null
          raw_payload: Json
        }
        Insert: {
          created_at?: string
          dedupe_key?: string | null
          event_type: string
          id?: string
          phone_number_id?: string | null
          processed?: boolean
          processing_error?: string | null
          raw_payload: Json
        }
        Update: {
          created_at?: string
          dedupe_key?: string | null
          event_type?: string
          id?: string
          phone_number_id?: string | null
          processed?: boolean
          processing_error?: string | null
          raw_payload?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      am_i_admin: { Args: never; Returns: boolean }
      archive_whatsapp_template: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      can_i_manage_users: { Args: never; Returns: boolean }
      clear_must_change_password: { Args: never; Returns: undefined }
      delete_whatsapp_contact_with_audit: {
        Args: { p_contact_id: string; p_reason?: string }
        Returns: string
      }
      delete_whatsapp_template_draft: {
        Args: { p_template_id: string }
        Returns: undefined
      }
      dismiss_whatsapp_notifications: {
        Args: { p_notification_ids?: string[] }
        Returns: number
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_my_admin_profile: { Args: never; Returns: Json }
      increment_broadcast_campaign_delivered: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      is_whatsapp_service_window_open: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      mark_whatsapp_notifications_read: {
        Args: { p_notification_ids?: string[] }
        Returns: number
      }
      normalize_brazil_phone_e164: {
        Args: { p_input: string }
        Returns: string
      }
      publish_broadcast_campaign: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      publish_page_contents_drafts: { Args: never; Returns: undefined }
      refresh_contact_engagement: {
        Args: { p_contact_id: string }
        Returns: undefined
      }
      register_whatsapp_site_consent: {
        Args: {
          p_email?: string
          p_name: string
          p_phone: string
          p_source?: string
        }
        Returns: Json
      }
      resolve_queue_contact_ids: {
        Args: { p_queue_id: string }
        Returns: string[]
      }
      update_my_admin_profile: {
        Args: { p_full_name: string }
        Returns: undefined
      }
      upsert_whatsapp_config_active: {
        Args: { p_display_name?: string; p_phone_number_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
