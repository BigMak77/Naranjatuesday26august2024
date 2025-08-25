import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().split("T")[0];
  const day = new Date().getDay();
  const isWeekday = day >= 1 && day <= 5;
  const shifts = ["teal", "Green"];
  if (isWeekday) shifts.push("Mon–Fri");

  const { data: templates, error: templateErr } = await supabase
    .from("citracheck_templates")
    .select("id, name, frequency, shifts");

  if (templateErr) {
    return new Response(`Template fetch error: ${templateErr.message}`, {
      status: 500,
    });
  }

  const createdLogs: string[] = [];

  for (const template of templates || []) {
    if (template.frequency !== "daily") continue;

    const activeShifts = (template.shifts || []).filter((s: string) =>
      shifts.includes(s),
    );
    if (activeShifts.length === 0) continue;

    const { data: items, error: itemErr } = await supabase
      .from("citracheck_template_items")
      .select("id")
      .eq("template_id", template.id);

    if (itemErr || !items || items.length === 0) {
      createdLogs.push(`⚠️ No items found for template ${template.name}`);
      continue;
    }

    const { data: templateRecord, error: templateRecordErr } = await supabase
      .from("citracheck_templates")
      .select("department_id")
      .eq("id", template.id)
      .single();

    if (templateRecordErr || !templateRecord?.department_id) {
      createdLogs.push(`⚠️ No department found for template ${template.name}`);
      continue;
    }

    for (const shift of activeShifts) {
      const { data: existing } = await supabase
        .from("citracheck_checks")
        .select("id")
        .match({
          template_id: template.id,
          department_id: templateRecord.department_id,
          shift,
          scheduled_date: today,
        });

      if (!existing || existing.length === 0) {
        const { data: newCheckData, error: insertErr } = await supabase
          .from("citracheck_checks")
          .insert({
            template_id: template.id,
            department_id: templateRecord.department_id,
            shift,
            scheduled_date: today,
            status: "not_started",
          })
          .select()
          .single();

        if (insertErr || !newCheckData) {
          createdLogs.push(
            `❌ Failed to insert check for ${template.name} – ${shift}`,
          );
          continue;
        }

        const checkItems = (items as { id: string }[]).map((i) => ({
          check_id: newCheckData.id,
          template_item_id: i.id,
        }));

        const { error: itemInsertErr } = await supabase
          .from("citracheck_check_items")
          .insert(checkItems);

        if (itemInsertErr) {
          createdLogs.push(
            `⚠️ Check created but items failed: ${template.name} – ${shift}`,
          );
        } else {
          createdLogs.push(`✅ Created: ${template.name} – ${shift}`);
        }
      }
    }
  }

  return new Response(createdLogs.join("\n") || "No checks created today.", {
    status: 200,
  });
});
