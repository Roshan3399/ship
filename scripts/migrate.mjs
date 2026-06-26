import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://grswuuwvvwjxryurilpq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc3d1dXd2dndqeHJ5dXJpbHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA3NDQ5OSwiZXhwIjoyMDk3NjUwNDk5fQ.0LlVg7ZAx1GiMFCVQZQzJGByB2TY3RFQ19E9oI2cO1I"
)

async function run() {
  // Check if exec_sql function exists
  const { data: funcs, error: funcsError } = await supabase.rpc("exec_sql", { query: "SELECT 1" })
  console.log("exec_sql check:", funcs, funcsError?.message)

  // Try creating profiles table with full migration
  const { error: profilesError } = await supabase.from("profiles").select("count", { count: "exact", head: true })
  console.log("profiles table exists:", profilesError?.message || "yes")

  const { error: briefsError } = await supabase.from("briefs").select("count", { count: "exact", head: true })
  console.log("briefs table exists:", briefsError?.message || "yes")

  // Create the trigger function directly using SQL via REST
  const mgmtRes = await fetch("https://api.supabase.com/v1/projects/grswuuwvvwjxryurilpq/sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc3d1dXd2dndqeHJ5dXJpbHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA3NDQ5OSwiZXhwIjoyMDk3NjUwNDk5fQ.0LlVg7ZAx1GiMFCVQZQzJGByB2TY3RFQ19E9oI2cO1I",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyc3d1dXd2dndqeHJ5dXJpbHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA3NDQ5OSwiZXhwIjoyMDk3NjUwNDk5fQ.0LlVg7ZAx1GiMFCVQZQzJGByB2TY3RFQ19E9oI2cO1I"
    },
    body: JSON.stringify({
      query: `
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `
    })
  })

  const mgmtText = await mgmtRes.text()
  console.log("Migration result:", mgmtRes.status, mgmtText)
}

run()
