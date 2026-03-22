/**
 * PostgREST / Supabase may return embedded FK rows as an object or a one-element array.
 */
function unwrapEmbed(embed) {
  if (embed == null) return null;
  if (Array.isArray(embed)) return embed.length ? embed[0] : null;
  return embed;
}

/**
 * Load profiles for all non-null player_ids in one query (avoids broken FK embed hints).
 */
async function fetchProfileMapForStats(supabase, playerStats) {
  const ids = [...new Set((playerStats || []).map((s) => s.player_id).filter(Boolean))];
  if (!ids.length) return {};
  const { data: profs, error } = await supabase.from('profiles').select('id, full_name, username, phone').in('id', ids);
  if (error) throw error;
  const map = {};
  for (const p of profs || []) {
    map[p.id] = p;
  }
  return map;
}

/**
 * Prefer batch profile map, then embedded `player`, then non-empty `player_name`.
 */
function resolveMatchPlayerDisplayName(stat, profileMap = {}) {
  const fromMap = stat.player_id ? profileMap[stat.player_id] : null;
  const fromEmbed = unwrapEmbed(stat.player);
  const prof = fromMap || fromEmbed;
  const fromProfile = prof && (prof.full_name || prof.username || prof.phone);
  const raw = stat.player_name != null ? String(stat.player_name).trim() : '';
  const fromStat = raw.length > 0 ? raw : null;
  return fromProfile || fromStat || 'Unknown';
}

module.exports = {
  resolveMatchPlayerDisplayName,
  unwrapEmbed,
  fetchProfileMapForStats,
};
