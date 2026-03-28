/**
 * WarWatch — Supabase client
 * Single import point for all Supabase access across the site.
 * Import this in backlog.html, chat panel, subscription widget etc.
 *
 * Usage:
 *   import { supabase } from './js/supabase-client.js'
 *   const { data, error } = await supabase.from('backlog_items').select('*')
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = 'https://ofpxbntgznmrmpamkzbd.supabase.co'
const SUPABASE_ANON = 'sb_publishable_K_8Frasp7G8XA1BX7QER2w_oUfyU3BO'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

/**
 * Get or create an anonymous user session.
 * Call on page load — returns the user object.
 */
export async function getOrCreateUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) return session.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) { console.error('[supabase] anon sign-in failed:', error); return null }
  return data.user
}

/**
 * Subscribe to realtime changes on a table.
 * Returns the channel — call channel.unsubscribe() to clean up.
 *
 * @param {string} table     - e.g. 'messages'
 * @param {function} callback - called with { eventType, new: row, old: row }
 * @param {object} filter    - optional, e.g. { column: 'room', value: 'community' }
 */
export function subscribeToTable(table, callback, filter = null) {
  let channel = supabase.channel(`realtime:${table}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table, ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}) },
      callback
    )
    .subscribe()
  return channel
}
