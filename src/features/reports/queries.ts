import { createClient } from "@/src/lib/supabase/server";

export async function getReportFormOptions() {
  const supabase = await createClient();

  const [{ data: categories }, { data: hamlets }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("dusuns").select("id, name").order("name"),
  ]);

  return {
    categories: categories ?? [],
    hamlets: hamlets ?? [],
  };
}
