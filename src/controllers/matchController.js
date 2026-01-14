// Match controller for cricket matches using Supabase.
// This mirrors the logic in your Flutter MatchService, but runs on the server.

const supabase = require('../lib/supabaseClient');

async function createOrGetTeam(name) {
  const normalized = name.trim();
  if (!normalized) throw new Error('Team name required');

  const { data: existing, error: existingError } = await supabase
    .from('teams')
    .select('id')
    .eq('name', normalized)
    .limit(1);

  if (existingError) throw existingError;

  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('teams')
    .insert({ name: normalized })
    .select('id')
    .single();

  if (insertError) throw insertError;

  return inserted.id;
}

exports.listMatches = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({
      matches: data || [],
    });
  } catch (err) {
    next(err);
  }
};

exports.createMatch = async (req, res, next) => {
  try {
    const { teamAName, teamBName, venue, overs = 20 } = req.body;

    if (!teamAName || !teamBName) {
      return res.status(400).json({ message: 'teamAName and teamBName are required' });
    }

    const teamAId = await createOrGetTeam(teamAName);
    const teamBId = await createOrGetTeam(teamBName);

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        team_a: teamAId,
        team_b: teamBId,
        venue: venue || null,
        overs,
        status: 'live',
      })
      .select('id')
      .single();

    if (matchError) throw matchError;

    const matchId = match.id;

    const { error: scoreError } = await supabase
      .from('match_score')
      .insert({ match_id: matchId });

    if (scoreError) throw scoreError;

    return res.status(201).json({
      message: 'Match created successfully',
      matchId,
    });
  } catch (err) {
    next(err);
  }
};

