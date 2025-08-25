require("dotenv").config();
require("dotenv").config({ path: ".env.local" });

console.log("✅ DEBUG: ENV LOADED");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "Loaded ✅" : "❌ Missing",
);

const { createClient } = require("@supabase/supabase-js");
const { parse } = require("path");

// 🔐 Use environment variables from .env.local
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const BUCKET_NAME = "documents";
const STORAGE_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`;
const CREATED_BY = "c423758d-cf76-4119-b4be-8514cdd40135"; // your user ID

async function syncDocuments() {
  const { data: files, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list("", { limit: 1000 });

  if (error) {
    console.error("❌ Error listing files:", error.message);
    return;
  }

  for (const file of files) {
    const filename = file.name;
    const url = `${STORAGE_URL}${filename}`;

    const baseName = parse(filename).name; // remove file extension
    const parts = baseName.split("_");

    let reference_code = null;
    let title = baseName;

    if (/^\d+(\.\d+)*$/.test(parts[0])) {
      reference_code = parts[0];
      title = parts.slice(1).join(" ").replace(/_/g, " ");
    } else {
      title = parts.join(" ").replace(/_/g, " ");
    }

    const insertData = {
      reference_code,
      title,
      document_type: "policy",
      file_url: url,
      created_by: CREATED_BY,
      last_reviewed_at: new Date().toISOString().slice(0, 10),
      review_period_months: 12,
      version: 1,
      current_version: 1,
    };

    const { error: insertError } = await supabase
      .from("documents")
      .insert([insertData]);

    if (insertError) {
      console.error(
        `❌ Failed to insert for ${filename}:`,
        insertError.message,
      );
    } else {
      console.log(`✅ Inserted: ${title}`);
    }
  }
}

syncDocuments();
