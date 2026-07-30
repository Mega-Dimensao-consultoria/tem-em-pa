/**
 * Resolves the list of e-mail addresses that should receive administrative
 * notifications. Uses the registered (auth) e-mail of every user holding the
 * `admin` role, plus any extra addresses configured in
 * `app_settings.admin_notification_emails` (comma separated).
 */
const FALLBACK_ADMIN_EMAIL = 'thadeuhenriquedosanjos@gmail.com'

export async function getAdminRecipients(supabaseAdmin: any): Promise<string[]> {
  const emails = new Set<string>()

  try {
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    for (const row of roles ?? []) {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(row.user_id)
        const email = data?.user?.email
        if (email) emails.add(String(email).toLowerCase())
      } catch {
        // ignore individual lookup failures
      }
    }
  } catch {
    // ignore — fall through to extras/fallback
  }

  try {
    const { data: setting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_notification_emails')
      .maybeSingle()
    if (setting?.value) {
      String(setting.value)
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.includes('@'))
        .forEach((s) => emails.add(s))
    }
  } catch {
    // ignore
  }

  if (emails.size === 0) emails.add(FALLBACK_ADMIN_EMAIL)
  return Array.from(emails)
}

export { FALLBACK_ADMIN_EMAIL }
