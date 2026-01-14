const supabase = require('../lib/supabaseClient');

// List all registered players
exports.listPlayers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, phone, role')
      .eq('role', 'player')
      .order('full_name', { ascending: true });

    if (error) throw error;

    return res.json({ players: data || [] });
  } catch (err) {
    next(err);
  }
};

// Get player by ID
exports.getPlayer = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    const { data: player, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, phone, role')
      .eq('id', playerId)
      .eq('role', 'player')
      .single();

    if (error) throw error;
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    return res.json({ player });
  } catch (err) {
    next(err);
  }
};

// Get player stats (aggregated from match_player_stats)
exports.getPlayerStats = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    // Verify player exists
    const { data: player, error: playerError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', playerId)
      .eq('role', 'player')
      .single();

    if (playerError || !player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get all player stats from matches
    const { data: stats, error: statsError } = await supabase
      .from('match_player_stats')
      .select('*')
      .eq('player_id', playerId);

    if (statsError) throw statsError;

    // Calculate aggregates
    const battingStats = {
      totalRuns: 0,
      totalBalls: 0,
      totalFours: 0,
      totalSixes: 0,
      matches: 0,
      strikeRate: 0,
    };

    const bowlingStats = {
      totalWickets: 0,
      totalOvers: 0,
      totalRunsConceded: 0,
      matches: 0,
      economy: 0,
      average: 0,
    };

    stats.forEach((stat) => {
      if (stat.runs !== null && stat.runs !== undefined) {
        battingStats.totalRuns += stat.runs || 0;
        battingStats.totalBalls += stat.balls || 0;
        battingStats.totalFours += stat.fours || 0;
        battingStats.totalSixes += stat.sixes || 0;
        battingStats.matches += 1;
      }

      if (stat.wickets !== null && stat.wickets !== undefined) {
        bowlingStats.totalWickets += stat.wickets || 0;
        bowlingStats.totalOvers += stat.overs || 0;
        bowlingStats.totalRunsConceded += stat.runs || 0;
        bowlingStats.matches += 1;
      }
    });

    // Calculate strike rate
    if (battingStats.totalBalls > 0) {
      battingStats.strikeRate = ((battingStats.totalRuns / battingStats.totalBalls) * 100).toFixed(2);
    }

    // Calculate economy and average
    if (bowlingStats.totalOvers > 0) {
      bowlingStats.economy = (bowlingStats.totalRunsConceded / bowlingStats.totalOvers).toFixed(2);
    }
    if (bowlingStats.totalWickets > 0) {
      bowlingStats.average = (bowlingStats.totalRunsConceded / bowlingStats.totalWickets).toFixed(2);
    }

    return res.json({
      player: {
        id: player.id,
        name: player.full_name,
      },
      batting: battingStats,
      bowling: bowlingStats,
      matchStats: stats || [],
    });
  } catch (err) {
    next(err);
  }
};

// Update player profile (for player dashboard)
exports.updatePlayerProfile = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { fullName, phone, email } = req.body;

    // Verify player exists and user has permission
    const { data: player, error: playerError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const updates = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) {
      updates.username = email;
      // Update auth email
      await supabase.auth.admin.updateUserById(playerId, { email });
    }

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      message: 'Player profile updated successfully',
      player: updated,
    });
  } catch (err) {
    next(err);
  }
};







