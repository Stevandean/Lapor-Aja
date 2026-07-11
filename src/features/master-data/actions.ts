"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile } from "@/src/lib/auth/getProfile";
import { getDashboardRouteByRole, ROUTES } from "@/src/lib/constants/routes";
import { createClient } from "@/src/lib/supabase/server";
import type { ActionState } from "@/src/types/action";

async function requireAdmin() {
  const profile = await getProfile();

  if (!profile) {
    redirect(ROUTES.LOGIN);
  }

  if (profile.role !== "admin") {
    redirect(getDashboardRouteByRole(profile.role));
  }

  return profile;
}

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

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama kategori wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("categories").insert({
    name,
    description: description || null,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/categories");

  return {
    status: "success",
    message: "Kategori berhasil dibuat.",
  };
}

export async function updateCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const categoryId = String(formData.get("category_id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!categoryId) {
    return {
      status: "error",
      message: "ID kategori tidak ditemukan.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Nama kategori wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/categories");

  return {
    status: "success",
    message: "Kategori berhasil diperbarui.",
  };
}

export async function toggleCategoryStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const categoryId = String(formData.get("category_id") || "");
  const action = String(formData.get("action") || "");

  if (!categoryId) {
    return {
      status: "error",
      message: "ID kategori tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi kategori tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      is_active: action === "activate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/categories");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Kategori berhasil diaktifkan."
        : "Kategori berhasil dinonaktifkan.",
  };
}

export async function createDusun(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama dusun wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("dusuns").insert({
    name,
    description: description || null,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/dusuns");
  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message: "Dusun berhasil dibuat.",
  };
}

export async function updateDusun(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const dusunId = String(formData.get("dusun_id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!dusunId) {
    return {
      status: "error",
      message: "ID dusun tidak ditemukan.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Nama dusun wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("dusuns")
    .update({
      name,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dusunId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/dusuns");
  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message: "Dusun berhasil diperbarui.",
  };
}

export async function toggleDusunStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const dusunId = String(formData.get("dusun_id") || "");
  const action = String(formData.get("action") || "");

  if (!dusunId) {
    return {
      status: "error",
      message: "ID dusun tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi dusun tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("dusuns")
    .update({
      is_active: action === "activate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dusunId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/dusuns");
  revalidatePath("/dashboard/village/users");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Dusun berhasil diaktifkan."
        : "Dusun berhasil dinonaktifkan.",
  };
}

export async function createAgency(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactPerson = String(formData.get("contact_person") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama instansi wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("agencies").insert({
    name,
    description: description || null,
    contact_person: contactPerson || null,
    phone: phone || null,
    email: email || null,
    address: address || null,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/agencies");

  return {
    status: "success",
    message: "Instansi berhasil dibuat.",
  };
}

export async function updateAgency(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const agencyId = String(formData.get("agency_id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactPerson = String(formData.get("contact_person") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!agencyId) {
    return {
      status: "error",
      message: "ID instansi tidak ditemukan.",
    };
  }

  if (!name) {
    return {
      status: "error",
      message: "Nama instansi wajib diisi.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("agencies")
    .update({
      name,
      description: description || null,
      contact_person: contactPerson || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/agencies");

  return {
    status: "success",
    message: "Instansi berhasil diperbarui.",
  };
}

export async function toggleAgencyStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const agencyId = String(formData.get("agency_id") || "");
  const action = String(formData.get("action") || "");

  if (!agencyId) {
    return {
      status: "error",
      message: "ID instansi tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi instansi tidak valid.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("agencies")
    .update({
      is_active: action === "activate",
      updated_at: new Date().toISOString(),
    })
    .eq("id", agencyId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/agencies");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Instansi berhasil diaktifkan."
        : "Instansi berhasil dinonaktifkan.",
  };
}

export async function updateSlaRule(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const ruleId = String(formData.get("rule_id") || "");
  const verificationHours = Number(formData.get("verification_hours"));
  const resolutionHours = Number(formData.get("resolution_hours"));
  const description = String(formData.get("description") || "").trim();

  if (!ruleId) {
    return {
      status: "error",
      message: "ID aturan SLA tidak ditemukan.",
    };
  }

  if (
    Number.isNaN(verificationHours) ||
    Number.isNaN(resolutionHours) ||
    verificationHours <= 0 ||
    resolutionHours <= 0
  ) {
    return {
      status: "error",
      message: "Jam verifikasi dan penyelesaian harus lebih dari 0.",
    };
  }

  if (verificationHours > resolutionHours) {
    return {
      status: "error",
      message:
        "Jam verifikasi tidak boleh lebih besar dari jam penyelesaian.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("sla_rules")
    .update({
      verification_hours: verificationHours,
      resolution_hours: resolutionHours,
      description: description || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/sla-rules");
  revalidatePath("/dashboard/village/sla");

  return {
    status: "success",
    message: "Aturan SLA berhasil diperbarui.",
  };
}

export async function toggleSlaRuleStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireMasterDataManager();

  const ruleId = String(formData.get("rule_id") || "");
  const action = String(formData.get("action") || "");

  if (!ruleId) {
    return {
      status: "error",
      message: "ID aturan SLA tidak ditemukan.",
    };
  }

  if (action !== "activate" && action !== "deactivate") {
    return {
      status: "error",
      message: "Aksi aturan SLA tidak valid.",
    };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  if (action === "activate") {
    const { data: rule, error: ruleError } = await supabase
      .from("sla_rules")
      .select("id, priority")
      .eq("id", ruleId)
      .maybeSingle();

    if (ruleError || !rule) {
      return {
        status: "error",
        message: ruleError?.message || "Aturan SLA tidak ditemukan.",
      };
    }

    const { error: deactivateSiblingsError } = await supabase
      .from("sla_rules")
      .update({
        is_active: false,
        updated_at: now,
      })
      .eq("priority", rule.priority)
      .neq("id", ruleId);

    if (deactivateSiblingsError) {
      return {
        status: "error",
        message: deactivateSiblingsError.message,
      };
    }
  }

  if (action === "deactivate") {
    const { data: rule, error: ruleError } = await supabase
      .from("sla_rules")
      .select("id, priority")
      .eq("id", ruleId)
      .maybeSingle();

    if (ruleError || !rule) {
      return {
        status: "error",
        message: ruleError?.message || "Aturan SLA tidak ditemukan.",
      };
    }

    const { count, error: activeCountError } = await supabase
      .from("sla_rules")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("priority", rule.priority)
      .eq("is_active", true)
      .neq("id", ruleId);

    if (activeCountError) {
      return {
        status: "error",
        message: activeCountError.message,
      };
    }

    if ((count ?? 0) === 0) {
      return {
        status: "error",
        message:
          "Setiap prioritas harus memiliki minimal satu aturan SLA aktif untuk persetujuan laporan.",
      };
    }
  }

  const { error } = await supabase
    .from("sla_rules")
    .update({
      is_active: action === "activate",
      updated_at: now,
    })
    .eq("id", ruleId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data");
  revalidatePath("/dashboard/admin/master-data/sla-rules");
  revalidatePath("/dashboard/village/sla");

  return {
    status: "success",
    message:
      action === "activate"
        ? "Aturan SLA berhasil diaktifkan."
        : "Aturan SLA berhasil dinonaktifkan.",
  };
}

export async function createVillageSection(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      status: "error",
      message: "Nama seksi wajib diisi.",
    };
  }

  const normalizedCode = code
    ? code.toUpperCase().replace(/\s+/g, "_")
    : null;

  const supabase = await createClient();

  const { data: lastSection } = await supabase
    .from("village_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = Number(lastSection?.sort_order || 0) + 1;

  const { error } = await supabase.from("village_sections").insert({
    name,
    code: normalizedCode,
    description: description || null,
    sort_order: nextSortOrder,
    is_active: true,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/village-sections");

  return {
    status: "success",
    message: "Seksi desa berhasil dibuat.",
  };
}
export async function toggleVillageSectionStatus(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();

  const sectionId = String(formData.get("section_id") || "");
  const isActive = String(formData.get("is_active") || "") === "true";

  if (!sectionId) {
    return {
      status: "error",
      message: "ID seksi tidak ditemukan.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("village_sections")
    .update({
      is_active: !isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sectionId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/dashboard/admin/master-data/village-sections");

  return {
    status: "success",
    message: isActive
      ? "Seksi desa berhasil dinonaktifkan."
      : "Seksi desa berhasil diaktifkan.",
  };
}
