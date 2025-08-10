import { config } from 'dotenv'
config({ path: '.env.scheduler' }) // ✅ Use dedicated env file

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function runAutoScheduler() {
  const today = new Date().toISOString().split('T')[0]
  const day = new Date().getDay()
  const isWeekday = day >= 1 && day <= 5
  const shifts = ['teal', 'Green']
  if (isWeekday) shifts.push('Mon–Fri')

  const { data: templates, error: templateErr } = await supabase
    .from('citracheck_templates')
    .select('id, name, frequency, shifts')

  if (templateErr) {
    console.error('Error fetching templates:', templateErr)
    return
  }

  for (const template of templates || []) {
    if (template.frequency !== 'daily') continue

    const activeShifts = (template.shifts || []).filter((s: string) => shifts.includes(s))
    if (activeShifts.length === 0) continue

    // Get department assigned to template
    const { data: templateRow, error: templateFetchErr } = await supabase
      .from('citracheck_templates')
      .select('department_id')
      .eq('id', template.id)
      .single()

    if (templateFetchErr || !templateRow?.department_id) {
      console.error(`Error getting department for template ${template.name}`, templateFetchErr)
      continue
    }

    const department_id = templateRow.department_id

    // Get users in that department
    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('auth_id')
      .eq('department_id', department_id)

    if (userErr || !users || users.length === 0) {
      console.error(`No users found for department ${department_id}`, userErr)
      continue
    }

    for (const shift of activeShifts) {
      for (const user of users) {
        // Check if a check already exists for this combo
        const { data: existing } = await supabase
          .from('citracheck_checks')
          .select('id')
          .match({
            template_id: template.id,
            department_id,
            auth_id: user.auth_id,
            shift,
            scheduled_date: today,
          })

        if (!existing || existing.length === 0) {
          // Insert new check
          const { data: inserted, error: insertErr } = await supabase
            .from('citracheck_checks')
            .insert({
              template_id: template.id,
              department_id,
              auth_id: user.auth_id,
              shift,
              scheduled_date: today,
              status: 'not_started'
            })
            .select()
            .single()

          if (insertErr) {
            console.error(`Insert failed for ${template.name} – ${shift}`, insertErr)
            continue
          }

          console.log(`✅ Check created: ${template.name} – ${shift} – User ${user.auth_id}`)

          // Now insert check items
          const { data: templateItems, error: itemErr } = await supabase
            .from('citracheck_template_items')
            .select('id')
            .eq('template_id', template.id)
            .order('position', { ascending: true }) // ✅ Corrected here

          if (itemErr) {
            console.error(`Failed to fetch template items for ${inserted.id}`, itemErr)
            continue
          }

          if (templateItems && templateItems.length > 0) {
            type TemplateItem = { id: number }
            const checkItems = templateItems.map((item: TemplateItem) => ({
              check_id: inserted.id,
              template_item_id: item.id,
              status: null,
              notes: null,
            }))

            const { error: itemInsertErr } = await supabase
              .from('citracheck_check_items')
              .insert(checkItems)

            if (itemInsertErr) {
              console.error(`Failed to insert check items for ${inserted.id}`, itemInsertErr)
            } else {
              console.log(`➕ Check items inserted for check ${inserted.id}`)
            }
          }
        }
      }
    }
  }

  console.log('🎯 Scheduler run complete.')
}

runAutoScheduler()
