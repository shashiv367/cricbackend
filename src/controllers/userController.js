const supabase = require('../lib/supabaseClient');

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

    // Enrich with calculated run rates
    const enrichedMatches = (matches || []).map((match) => {
      if (match.score && match.score.length > 0) {
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

    // Map aliases for dashboard if needed
    const mappedMatches = enrichedMatches.map(m => ({
      ...m,
      team_a_details: m.team_a,
      team_b_details: m.team_b,
      venue_details: m.venue
    }));

    return res.json({ matches: mappedMatches });
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

    // Get player stats grouped by team
    const { data: playerStats, error: statsError } = await supabase
      .from('match_player_stats')
      .select('*')
      .eq('match_id', matchId)
      .order('runs', { ascending: false });

    if (statsError) throw statsError;

    // Group player stats by team
    const teamAStats = (playerStats || []).filter((stat) => stat.team_id === match.team_a?.id);
    const teamBStats = (playerStats || []).filter((stat) => stat.team_id === match.team_b?.id);

    // Calculate strike rates and economy
    const enrichStats = (stats) => {
      return stats.map((stat) => {
        const strikeRate = stat.balls > 0 && stat.runs !== null ? ((stat.runs / stat.balls) * 100).toFixed(2) : null;
        const economy = stat.overs > 0 && stat.runs !== null ? (stat.runs / stat.overs).toFixed(2) : null;

        return {
          ...stat,
          strike_rate: strikeRate ? parseFloat(strikeRate) : null,
          economy: economy ? parseFloat(economy) : null,
        };
      });
    };

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
      },
    });
  } catch (err) {
    next(err);
  }
};







