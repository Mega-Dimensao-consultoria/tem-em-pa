import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type CompanyRow = Tables["companies"]["Row"];
export type ProductRow = Tables["products"]["Row"];
export type ReviewRow = Tables["reviews"]["Row"];
export type CategoryRow = Tables["categories"]["Row"];
export type ProfileRow = Tables["profiles"]["Row"];
export type ClaimRow = Tables["company_claims"]["Row"];
export type NotificationRow = Tables["notifications"]["Row"];
export type ReviewReportRow = Tables["review_reports"]["Row"];
export type CompanyEventRow = Tables["company_events"]["Row"];

/** Minimal joined category info used in list cards. */
export type CategoryStub = Pick<CategoryRow, "name" | "slug" | "icon">;
