const supabase = require('../lib/supabaseClient');
const { resolveMatchPlayerDisplayName, fetchProfileMapForStats } = require('../utils/playerStatName');

function mapMatchesForClient(matches) {
  const enrichedMatches = (matches || []).map((match) => {
    if (match.score && Array.isArray(match.score) && match.score.length > 0) {
      const score = match.score[0];
      const teamARunRate = score.team_a_overs > 0 ? parseFloat((score.team_a_score / score.team_a_overs).toFixed(2)) : 0;
      const teamBRunRate = score.team_b_overs > 0 ? parseFloat((score.team_b_score / score.team_b_overs).toFixed(2)) : 0;
      return {
        ...match,
        score: {
          ...score,
          team_a_run_rate: teamARunRate,
          team_b_run_rate: teamBRunRate,
        },
      };
    }
    return match;
  });
  return enrichedMatches.map((m) => ({
    ...m,
    team_a_details: m.team_a,
    team_b_details: m.team_b,
    venue_details: m.venue,
  }));
}

// List all matches for user dashboard (like Cricbuzz)
exports.listMatches = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    console.log(`\n🔍 [USER] Fetching matches (Status: ${status || 'all'}, Limit: ${limit})`);

    let query = supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_fkey(id, name),
        team_b:teams!matches_team_b_fkey(id, name),
        venue:locations(id, name, city),
        score:match_score(*)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: matches, error } = await query;

    if (error) {
      console.error('❌ [USER] Supabase error fetching matches:', error);
      throw error;
    }

    console.log(`✅ [USER] Found ${matches?.length || 0} matches`);

    return res.json({ matches: mapMatchesForClient(matches || []) });
  } catch (err) {
    next(err);
  }
};

// Get match scoreboard (detailed view)
exports.getMatchScoreboard = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    console.log(`\n🔍 [USER] Fetching scoreboard for match: ${matchId}`);

    // Get match with teams and location
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_fkey(id, name),
        team_b:teams!matches_team_b_fkey(id, name),
        venue:locations(id, name, address, city, state)
      `)
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;

    // Get match score
    const { data: score, error: scoreError } = await supabase
      .from('match_score')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (scoreError && scoreError.code !== 'PGRST116') throw scoreError;

    const { data: playerStats, error: statsError } = await supabase
      .from('match_player_stats')
      .select('*')
      .eq('match_id', matchId)
      .order('runs', { ascending: false });

    if (statsError) throw statsError;

    const profileMap = await fetchProfileMapForStats(supabase, playerStats || []);

    const teamAId = match.team_a && (Array.isArray(match.team_a) ? match.team_a[0]?.id : match.team_a.id);
    const teamBId = match.team_b && (Array.isArray(match.team_b) ? match.team_b[0]?.id : match.team_b.id);

    const teamAStats = (playerStats || []).filter((stat) => stat.team_id === teamAId);
    const teamBStats = (playerStats || []).filter((stat) => stat.team_id === teamBId);

    const enrichStats = (stats) => {
      return stats.map((stat) => {
        const strikeRate = stat.balls > 0 && stat.runs !== null ? ((stat.runs / stat.balls) * 100).toFixed(2) : null;
        const economy = stat.overs > 0 && stat.runs !== null ? (stat.runs / stat.overs).toFixed(2) : null;

        return {
          ...stat,
          player_name: resolveMatchPlayerDisplayName(stat, profileMap),
          strike_rate: strikeRate ? parseFloat(strikeRate) : null,
          economy: economy ? parseFloat(economy) : null,
        };
      });
    };

    // Get commentary
    const { data: commentary, error: commError } = await supabase
      .from('match_commentary')
      .select('*')
      .eq('match_id', matchId)
      .order('over_number', { ascending: false })
      .order('ball_number', { ascending: false });

    if (commError && commError.code !== 'PGRST116') {
      console.warn('⚠️ [USER] Commentary table might not exist yet:', commError.message);
    }

    // Calculate run rates
    let teamARunRate = 0;
    let teamBRunRate = 0;
    if (score) {
      teamARunRate = score.team_a_overs > 0 ? parseFloat((score.team_a_score / score.team_a_overs).toFixed(2)) : 0;
      teamBRunRate = score.team_b_overs > 0 ? parseFloat((score.team_b_score / score.team_b_overs).toFixed(2)) : 0;
    }

    const ensureSingle = (item) => (Array.isArray(item) && item.length > 0 ? item[0] : item);

    return res.json({
      match: {
        ...match,
        team_a: ensureSingle(match.team_a),
        team_b: ensureSingle(match.team_b),
        venue: ensureSingle(match.venue),
        team_a_details: ensureSingle(match.team_a),
        team_b_details: ensureSingle(match.team_b),
        venue_details: ensureSingle(match.venue),
        score: score
          ? {
            ...score,
            team_a_run_rate: teamARunRate,
            team_b_run_rate: teamBRunRate,
          }
          : null,
        playerStats: enrichStats(playerStats || []),
        team_a_stats: enrichStats(teamAStats),
        team_b_stats: enrichStats(teamBStats),
        commentary: commentary || [],
      },
    });
  } catch (err) {
    next(err);
  }
};

// Personalized matches for My Cricket (auth required)
exports.listMyMatches = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { scope = 'your', limit = 100 } = req.query;

    const baseSelect = `
        *,
        team_a:teams!matches_team_a_fkey(id, name),
        team_b:teams!matches_team_b_fkey(id, name),
        venue:locations(id, name, city),
        score:match_score(*)
      `;

    let query = supabase
      .from('matches')
      .select(baseSelect)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit, 10));

    if (scope === 'your') {
      query = query.eq('created_by', userId);
    } else if (scope === 'played') {
      const { data: statRows, error: statErr } = await supabase
        .from('match_player_stats')
        .select('match_id')
        .eq('player_id', userId);
      if (statErr) throw statErr;
      const ids = [...new Set((statRows || []).map((r) => r.match_id).filter(Boolean))];
      if (ids.length === 0) {
        return res.json({ matches: [] });
      }
      query = query.in('id', ids);
    } else if (scope === 'network') {
      query = query.eq('is_public', true).neq('created_by', userId);
    } else {
      query = query.or(`created_by.eq.${userId},is_public.eq.true`);
    }

    const { data: matches, error } = await query;
    if (error) throw error;
    return res.json({ matches: mapMatchesForClient(matches || []) });
  } catch (err) {
    next(err);
  }
};

// Aggregate batting/bowling for current user (any profile role)
exports.getMyCricketStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single();

    const { data: stats, error } = await supabase
      .from('match_player_stats')
      .select('*')
      .eq('player_id', userId);

    if (error) throw error;

    const battingStats = {
      totalRuns: 0,
      totalBalls: 0,
      totalFours: 0,
      totalSixes: 0,
      innings: 0,
      strikeRate: '0',
    };
    const bowlingStats = {
      totalWickets: 0,
      totalOvers: 0,
      totalRunsConceded: 0,
      bowlingInnings: 0,
      economy: '0',
      average: '0',
    };

    (stats || []).forEach((stat) => {
      if (stat.runs !== null && stat.runs !== undefined) {
        battingStats.totalRuns += stat.runs || 0;
        battingStats.totalBalls += stat.balls || 0;
        battingStats.totalFours += stat.fours || 0;
        battingStats.totalSixes += stat.sixes || 0;
        battingStats.innings += 1;
      }

      if (stat.wickets !== null && stat.wickets !== undefined) {
        bowlingStats.totalWickets += stat.wickets || 0;
        bowlingStats.totalOvers += parseFloat(stat.overs) || 0;
        bowlingStats.totalRunsConceded += stat.runs || 0;
        bowlingStats.bowlingInnings += 1;
      }
    });

    if (battingStats.totalBalls > 0) {
      battingStats.strikeRate = ((battingStats.totalRuns / battingStats.totalBalls) * 100).toFixed(2);
    }
    if (bowlingStats.totalOvers > 0) {
      bowlingStats.economy = (bowlingStats.totalRunsConceded / bowlingStats.totalOvers).toFixed(2);
    }
    if (bowlingStats.totalWickets > 0) {
      bowlingStats.average = (bowlingStats.totalRunsConceded / bowlingStats.totalWickets).toFixed(2);
    }

    return res.json({
      player: {
        id: userId,
        name: profile?.full_name || profile?.username || 'You',
      },
      batting: battingStats,
      bowling: bowlingStats,
      matchStats: stats || [],
    });
  } catch (err) {
    next(err);
  }
};

// Teams linked to matches you created or played in
exports.listMyRelatedTeams = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: createdMatches } = await supabase
      .from('matches')
      .select('team_a, team_b')
      .eq('created_by', userId);

    const createdTeamIds = new Set();
    (createdMatches || []).forEach((m) => {
      if (m.team_a) createdTeamIds.add(m.team_a);
      if (m.team_b) createdTeamIds.add(m.team_b);
    });

    const { data: statRows } = await supabase
      .from('match_player_stats')
      .select('match_id, team_id')
      .eq('player_id', userId);

    const playedMatchIds = [...new Set((statRows || []).map((s) => s.match_id).filter(Boolean))];
    let playedDetail = [];
    if (playedMatchIds.length > 0) {
      const { data: pm } = await supabase
        .from('matches')
        .select('id, team_a, team_b')
        .in('id', playedMatchIds);
      playedDetail = pm || [];
    }

    const opponentTeamIds = new Set();
    (statRows || []).forEach((s) => {
      if (!s.match_id || !s.team_id) return;
      const m = playedDetail.find((x) => x.id === s.match_id);
      if (!m) return;
      const other = m.team_a === s.team_id ? m.team_b : m.team_b === s.team_id ? m.team_a : null;
      if (other) opponentTeamIds.add(other);
    });

    const allIds = [...new Set([...createdTeamIds, ...opponentTeamIds, ...(statRows || []).map((s) => s.team_id).filter(Boolean)])];
    if (allIds.length === 0) {
      return res.json({ teams: [] });
    }

    const { data: teams, error } = await supabase.from('teams').select('id, name').in('id', allIds);
    if (error) throw error;

    const teamMeta = new Map();
    (teams || []).forEach((t) => teamMeta.set(t.id, { id: t.id, name: t.name, kinds: [] }));

    createdTeamIds.forEach((tid) => {
      const row = teamMeta.get(tid);
      if (row && !row.kinds.includes('creator')) row.kinds.push('creator');
    });
    opponentTeamIds.forEach((tid) => {
      const row = teamMeta.get(tid);
      if (row && !row.kinds.includes('opponent')) row.kinds.push('opponent');
    });
    (statRows || []).forEach((s) => {
      if (!s.team_id) return;
      const row = teamMeta.get(s.team_id);
      if (row && !row.kinds.includes('played_for')) row.kinds.push('played_for');
    });

    return res.json({ teams: [...teamMeta.values()] });
  } catch (err) {
    next(err);
  }
};

exports.listTournaments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { scope = 'all' } = req.query;

    let q = supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(200);

    if (scope === 'your') {
      q = q.eq('created_by', userId);
    }

    const { data, error } = await q;
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ tournaments: [] });
      }
      throw error;
    }
    return res.json({ tournaments: data || [] });
  } catch (err) {
    next(err);
  }
};

exports.createTournament = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      tagline,
      city,
      groundName,
      startDate,
      endDate,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Tournament name is required' });
    }

    const row = {
      name: String(name).trim(),
      created_by: userId,
    };
    if (tagline != null) row.tagline = String(tagline).trim() || null;
    if (city != null) row.city = String(city).trim() || null;
    if (groundName != null) row.ground_name = String(groundName).trim() || null;
    if (startDate) row.start_date = startDate;
    if (endDate) row.end_date = endDate;

    const { data, error } = await supabase.from('tournaments').insert(row).select().single();
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.status(503).json({ message: 'Tournaments are not enabled on this database yet. Run the tournaments migration SQL.' });
      }
      throw error;
    }
    return res.status(201).json({ tournament: data });
  } catch (err) {
    next(err);
  }
};







