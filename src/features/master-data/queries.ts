import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";

async function requireMasterDataManager() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "admin") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

export async function getCategoryMasterData() {
  await requireMasterDataManager();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
      `
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getDusunMasterData() {
  await requireMasterDataManager();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dusuns")
    .select(
      `
      id,
      name,
      description,
      is_active,
      created_at,
      updated_at
      `
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch dusuns:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAgencyMasterData() {
  await requireMasterDataManager();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agencies")
    .select(
      `
      id,
      name,
      description,
      contact_person,
      phone,
      email,
      address,
      is_active,
      created_at,
      updated_at
      `
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch agencies:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getSlaRuleMasterData() {
  await requireMasterDataManager();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sla_rules")
    .select(
      `
      id,
      priority,
      verification_hours,
      resolution_hours,
      description,
      is_active,
      created_at,
      updated_at
      `
    )
    .order("resolution_hours", { ascending: true });

  if (error) {
    console.error("Failed to fetch SLA rules:", error.message);
    return [];
  }

  return data ?? [];
}

export type VillageSection = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export async function getVillageSections() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("village_sections")
    .select(
      `
      id,
      name,
      code,
      description,
      is_active,
      sort_order,
      created_at,
      updated_at
      `
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch village sections:", error.message);
    return [];
  }

  return data ?? [];
}