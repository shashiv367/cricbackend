const supabase = require('../lib/supabaseClient');
const { resolveMatchPlayerDisplayName, fetchProfileMapForStats } = require('../utils/playerStatName');

// Create match (umpire only)
exports.createMatch = async (req, res, next) => {
  try {
    const { teamAName, teamBName, locationId, locationName, overs = 20, date } = req.body;
    const umpireId = req.user.id;
    console.log(`\n🏟️ [UMPIRE] Creating match: ${teamAName} vs ${teamBName} by Umpire: ${umpireId}`);

    if (!teamAName || !teamBName) {
      return res.status(400).json({ message: 'teamAName and teamBName are required' });
    }

    // Handle location - create if new, use existing if provided
    let finalLocationId = locationId;

    if (!finalLocationId && locationName) {
      // Create or get location
      const normalizedName = locationName.trim();
      const { data: existingLoc, error: locCheckError } = await supabase
        .from('locations')
        .select('id')
        .ilike('name', normalizedName)
        .limit(1);

      if (locCheckError) throw locCheckError;

      if (existingLoc && existingLoc.length > 0) {
        finalLocationId = existingLoc[0].id;
      } else {
        const { data: newLoc, error: locInsertError } = await supabase
          .from('locations')
          .insert({ name: normalizedName })
          .select('id')
          .single();

        if (locInsertError) throw locInsertError;
        finalLocationId = newLoc.id;
      }
    }

    // Create or get teams
    const createOrGetTeam = async (name) => {
      const normalized = name.trim();
      const { data: existing, error: checkError } = await supabase
        .from('teams')
        .select('id')
        .eq('name', normalized)
        .limit(1);

      if (checkError) throw checkError;

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
    };

    const teamAId = await createOrGetTeam(teamAName);
    const teamBId = await createOrGetTeam(teamBName);

    // Create match
    const { status = 'live', isPublic = true } = req.body;
    
    // Generate a 6-character alphanumeric invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        team_a: teamAId,
        team_b: teamBId,
        venue: finalLocationId || null,
        overs,
        status, 
        is_public: isPublic,
        invite_code: inviteCode,
        created_by: umpireId,
        start_date: date || new Date().toISOString(),
      })
      .select('id')
      .single();

    if (matchError) throw matchError;

    // Create initial match score
    const { error: scoreError } = await supabase.from('match_score').insert({
      match_id: match.id,
      team_a_score: 0,
      team_a_wkts: 0,
      team_a_overs: 0,
      team_b_score: 0,
      team_b_wkts: 0,
      team_b_overs: 0,
    });

    if (scoreError) throw scoreError;

    return res.status(201).json({
      message: 'Match created successfully',
      matchId: match.id,
      inviteCode,
      teamAId,
      teamBId,
      locationId: finalLocationId || null,
    });
  } catch (err) {
    next(err);
  }
};

// Update toss result (umpire only)
exports.updateMatchToss = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { tossWinnerSide, tossDecision } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: 'matchId is required' });
    }

    if (!tossWinnerSide || !['A', 'B'].includes(tossWinnerSide)) {
      return res.status(400).json({ message: 'tossWinnerSide must be "A" or "B"' });
    }

    if (!tossDecision || !['Bat', 'Bowl'].includes(tossDecision)) {
      return res.status(400).json({ message: 'tossDecision must be "Bat" or "Bowl"' });
    }

    const { data: match, error } = await supabase
      .from('matches')
      .update({
        toss_winner_side: tossWinnerSide,
        toss_decision: tossDecision,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      message: 'Toss updated successfully',
      match,
    });
  } catch (err) {
    next(err);
  }
};

// Update match score (umpire only)
exports.updateMatchScore = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { teamAScore, teamAWkts, teamAOvers, teamBScore, teamBWkts, teamBOvers, target } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: 'matchId is required' });
    }

    const updates = {};
    if (teamAScore !== undefined) updates.team_a_score = teamAScore;
    if (teamAWkts !== undefined) updates.team_a_wkts = teamAWkts;
    if (teamAOvers !== undefined) updates.team_a_overs = teamAOvers;
    if (teamBScore !== undefined) updates.team_b_score = teamBScore;
    if (teamBWkts !== undefined) updates.team_b_wkts = teamBWkts;
    if (teamBOvers !== undefined) updates.team_b_overs = teamBOvers;
    if (target !== undefined) updates.target = target;

    const { data: score, error } = await supabase
      .from('match_score')
      .update(updates)
      .eq('match_id', matchId)
      .select()
      .single();

    if (error) throw error;

    // Calculate run rate
    const runRateA = score.team_a_overs > 0 ? (score.team_a_score / score.team_a_overs).toFixed(2) : 0;
    const runRateB = score.team_b_overs > 0 ? (score.team_b_score / score.team_b_overs).toFixed(2) : 0;

    return res.json({
      message: 'Score updated successfully',
      score: {
        ...score,
        team_a_run_rate: parseFloat(runRateA),
        team_b_run_rate: parseFloat(runRateB),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Add player to match (umpire only)
exports.addPlayerToMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { playerId, teamId, playerName } = req.body;

    if (!matchId || !teamId) {
      return res.status(400).json({ message: 'matchId and teamId are required' });
    }

    if (!playerId && !playerName) {
      return res.status(400).json({ message: 'Either playerId or playerName is required' });
    }

    let finalPlayerId = playerId;

    let resolvedName = playerName != null ? String(playerName).trim() : '';
    resolvedName = resolvedName.length > 0 ? resolvedName : null;

    if (!resolvedName && finalPlayerId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, username, phone')
        .eq('id', finalPlayerId)
        .maybeSingle();
      if (prof) {
        resolvedName = prof.full_name || prof.username || prof.phone || null;
      }
    }

    // Add player stat entry (initialized with zeros)
    const { data: playerStat, error } = await supabase.from('match_player_stats').insert({
      match_id: matchId,
      team_id: teamId,
      player_id: finalPlayerId || null,
      player_name: resolvedName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      overs: 0,
    }).select().single();

    if (error) throw error;

    return res.status(201).json({
      message: 'Player added to match successfully',
      playerStat,
    });
  } catch (err) {
    next(err);
  }
};

// Delete player from match (umpire only)
exports.deletePlayerFromMatch = async (req, res, next) => {
  try {
    const { matchId, playerStatId } = req.params;

    if (!matchId || !playerStatId) {
      return res.status(400).json({ message: 'matchId and playerStatId are required' });
    }

    // Delete player stat entry
    const { error } = await supabase
      .from('match_player_stats')
      .delete()
      .eq('id', playerStatId)
      .eq('match_id', matchId);

    if (error) throw error;

    return res.json({
      message: 'Player removed from match successfully',
    });
  } catch (err) {
    next(err);
  }
};

// Update player stats in match (umpire only)
exports.updatePlayerStats = async (req, res, next) => {
  try {
    const { matchId, playerStatId } = req.params;
    const { runs, balls, fours, sixes, wickets, overs } = req.body;

    const updates = {};
    if (runs !== undefined) updates.runs = runs;
    if (balls !== undefined) updates.balls = balls;
    if (fours !== undefined) updates.fours = fours;
    if (sixes !== undefined) updates.sixes = sixes;
    if (wickets !== undefined) updates.wickets = wickets;
    if (overs !== undefined) updates.overs = overs;

    const { data: playerStat, error } = await supabase
      .from('match_player_stats')
      .update(updates)
      .eq('id', playerStatId)
      .eq('match_id', matchId)
      .select()
      .single();

    if (error) throw error;

    // Calculate strike rate (for batting)
    let strikeRate = null;
    if (playerStat.balls > 0 && playerStat.runs !== null) {
      strikeRate = ((playerStat.runs / playerStat.balls) * 100).toFixed(2);
    }

    // Calculate economy (for bowling)
    let economy = null;
    if (playerStat.overs > 0 && playerStat.runs !== null) {
      economy = (playerStat.runs / playerStat.overs).toFixed(2);
    }

    return res.json({
      message: 'Player stats updated successfully',
      playerStat: {
        ...playerStat,
        strike_rate: strikeRate ? parseFloat(strikeRate) : null,
        economy: economy ? parseFloat(economy) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get match details with score and player stats
exports.getMatchDetails = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    console.log(`\n🔍 [UMPIRE] Fetching details for match: ${matchId}`);

    // Get match with teams
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_fkey(id, name),
        team_b:teams!matches_team_b_fkey(id, name),
        location:locations(id, name, address, city)
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
      .eq('match_id', matchId);

    if (statsError) throw statsError;

    const profileMap = await fetchProfileMapForStats(supabase, playerStats || []);

    const enrichedStats = (playerStats || []).map((stat) => ({
      ...stat,
      player_name: resolveMatchPlayerDisplayName(stat, profileMap),
    }));

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
        location: ensureSingle(match.location),
        score: score
          ? {
            ...score,
            team_a_run_rate: teamARunRate,
            team_b_run_rate: teamBRunRate,
          }
          : null,
        playerStats: enrichedStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// List umpire's matches
exports.listUmpireMatches = async (req, res, next) => {
  try {
    const umpireId = req.user.id;

    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_fkey(id, name),
        team_b:teams!matches_team_b_fkey(id, name),
        location:locations(id, name)
      `)
      .eq('created_by', umpireId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ matches: matches || [] });
  } catch (err) {
    next(err);
  }
};

// Update match status (match creator only)
exports.updateMatchStatus = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { status, completionReason } = req.body;
    const userId = req.user.id;

    if (!matchId) {
      return res.status(400).json({ message: 'matchId is required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    // Validate status
    const validStatuses = ['live', 'completed', 'cancelled', 'scheduled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('matches')
      .select('id, created_by')
      .eq('id', matchId)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (!existing.created_by || existing.created_by !== userId) {
      return res.status(403).json({ message: 'Only the match creator can change match status' });
    }

    const updates = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updates.end_date = new Date().toISOString();
      if (completionReason != null && String(completionReason).trim()) {
        updates.completion_reason = String(completionReason).trim();
      }
    }

    const { data: match, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      message: 'Match status updated successfully',
      match,
    });
  } catch (err) {
    next(err);
  }
};

// Update match configuration (overs, rules, bonus/penalty teams)
exports.updateMatchConfig = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ message: 'matchId is required' });
    }

    const {
      overs,
      wwDotBall,
      ww1s2s3s,
      wwForMatch,
      wwShotSelection,
      wideLegal,
      wideRuns,
      wideRotateStrike,
      noballLegal,
      noballRuns,
      noballRotateStrike,
      ignoreRules,
      ignoreOvers,
      bonusTeam,
      penaltyTeam,
    } = req.body;

    const updates = {};
    if (overs !== undefined) updates.overs = overs;
    if (wwDotBall !== undefined) updates.ww_dot_ball = wwDotBall;
    if (ww1s2s3s !== undefined) updates.ww_1s2s3s = ww1s2s3s;
    if (wwForMatch !== undefined) updates.ww_for_match = wwForMatch;
    if (wwShotSelection !== undefined) updates.ww_shot_selection = wwShotSelection;
    if (wideLegal !== undefined) updates.wide_legal = wideLegal;
    if (wideRuns !== undefined) updates.wide_runs = wideRuns;
    if (wideRotateStrike !== undefined) updates.wide_rotate_strike = wideRotateStrike;
    if (noballLegal !== undefined) updates.noball_legal = noballLegal;
    if (noballRuns !== undefined) updates.noball_runs = noballRuns;
    if (noballRotateStrike !== undefined) updates.noball_rotate_strike = noballRotateStrike;
    if (ignoreRules !== undefined) updates.ignore_rules = ignoreRules;
    if (ignoreOvers !== undefined) updates.ignore_overs = ignoreOvers;
    if (bonusTeam !== undefined) updates.bonus_team = bonusTeam;
    if (penaltyTeam !== undefined) updates.penalty_team = penaltyTeam;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No configuration fields supplied' });
    }

    const { data: match, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      message: 'Match configuration updated successfully',
      match,
    });
  } catch (err) {
    next(err);
  }
};

// Add match commentary (umpire only)
exports.addCommentary = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { over_number, ball_number, event_type, commentary_text, runs, is_wicket } = req.body;

    const { data, error } = await supabase
      .from('match_commentary')
      .insert([
        {
          match_id: matchId,
          over_number,
          ball_number,
          event_type, // 'W', '4', '6', '1', '2', '3', '0', 'NB', 'WD'
          commentary_text,
          runs: runs || 0,
          is_wicket: is_wicket || false,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ [UMPIRE] Error adding commentary:', error);
      throw error;
    }

    return res.json({
      message: 'Commentary added successfully',
      commentary: data,
    });
  } catch (err) {
    next(err);
  }
};

// List umpires (community) for assign/invite
exports.listUmpires = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'umpire')
      .order('full_name', { ascending: true });

    if (error) throw error;

    const umpires = (data || []).map((p) => ({
      id: p.id,
      name: p.full_name || 'Umpire',
      city: p.phone ? undefined : undefined,
      matches: 0,
    }));

    return res.json({ umpires });
  } catch (err) {
    next(err);
  }
};

