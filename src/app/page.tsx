import { createClient } from "../lib/supabase/client";

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, default_priority")
    .order("name");

  if (error) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-bold">Supabase Error</h1>
        <pre className="mt-4 whitespace-pre-wrap">{error.message}</pre>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Test Supabase Categories</h1>

      <ul className="mt-4 space-y-2">
        {categories?.map((category) => (
          <li key={category.id} className="rounded border p-3">
            {category.name} — {category.default_priority}
          </li>
        ))}
      </ul>
    </main>
  );
}