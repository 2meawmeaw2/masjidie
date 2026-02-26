/**
 * Admin User Setup Script
 *
 * Creates the admin test user in Supabase Auth with mosque_id pre-set in
 * user_metadata. If the user already exists, updates their metadata instead.
 *
 * Usage:
 *   npx tsx scripts/setup-admin-user.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zghkaofihchhiziqukvw.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnaGthb2ZpaGNoaGl6aXF1a3Z3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQzMjU1OSwiZXhwIjoyMDg3MDA4NTU5fQ.kEwYzHdwUb0_UwpQ5ChlUbaVKrLWhpDXXcw1COyH0yQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_EMAIL = "admin@masjidie.test";
const ADMIN_PASSWORD = "admin123";

async function main() {
  // Step 1: Fetch a mosque id from the database
  const { data: mosques, error: mosqueError } = await supabase
    .from("mosques")
    .select("id, name")
    .limit(1);

  if (mosqueError) {
    console.error("Failed to fetch mosque:", mosqueError.message);
    process.exit(1);
  }

  if (!mosques || mosques.length === 0) {
    console.error("No mosques found in database. Run migrate-from-wordpress.ts first.");
    process.exit(1);
  }

  const mosque = mosques[0];
  console.log(`Using mosque: ${mosque.name} (${mosque.id})`);

  // Step 2: Try to create the admin user
  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      user_metadata: { mosque_id: mosque.id },
      email_confirm: true,
    });

  if (!createError) {
    console.log(`✓ Admin user created`);
    console.log(`  Email:     ${ADMIN_EMAIL}`);
    console.log(`  User ID:   ${createData.user.id}`);
    console.log(`  mosque_id: ${mosque.id}`);
    return;
  }

  // Step 3: If already exists (422 or duplicate), find and update instead
  if (
    createError.message.toLowerCase().includes("already") ||
    createError.message.toLowerCase().includes("exists") ||
    createError.status === 422
  ) {
    console.log("User already exists — updating metadata...");

    const { data: listData, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("Failed to list users:", listError.message);
      process.exit(1);
    }

    const existing = listData.users.find((u) => u.email === ADMIN_EMAIL);

    if (!existing) {
      console.error("Could not find existing user to update.");
      process.exit(1);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      { user_metadata: { mosque_id: mosque.id } }
    );

    if (updateError) {
      console.error("Failed to update user:", updateError.message);
      process.exit(1);
    }

    console.log(`✓ Admin user updated`);
    console.log(`  Email:     ${ADMIN_EMAIL}`);
    console.log(`  User ID:   ${existing.id}`);
    console.log(`  mosque_id: ${mosque.id}`);
    return;
  }

  console.error("Failed to create user:", createError.message);
  process.exit(1);
}

main();
