const supabase = require('../lib/supabaseClient');

exports.signup = async (req, res, next) => {
  const startTime = Date.now();
  console.log('\n🔵 [BACKEND] ========== SIGNUP REQUEST ==========');
  console.log('🔵 [BACKEND] Time:', new Date().toISOString());
  console.log('🔵 [BACKEND] Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { email, password, fullName, role, phone } = req.body;

    console.log('🔵 [BACKEND] Validating input...');
    if (!email || !password) {
      console.log('❌ [BACKEND] Validation failed: Email or password missing');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!role || !['user', 'player', 'umpire'].includes(role)) {
      console.log('❌ [BACKEND] Validation failed: Invalid role:', role);
      return res.status(400).json({ message: 'Valid role (user, player, umpire) is required' });
    }

    console.log('✅ [BACKEND] Validation passed');
    console.log('🔵 [BACKEND] Creating user in Supabase Auth...');
    console.log('🔵 [BACKEND] Email:', email);
    console.log('🔵 [BACKEND] Role:', role);
    console.log('🔵 [BACKEND] FullName:', fullName || 'null');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || null,
        role,
      },
    });

    if (authError) {
      console.log('❌ [BACKEND] Supabase Auth Error:', JSON.stringify(authError, null, 2));
      if (authError.message && (authError.message.includes('already registered') || authError.message.includes('already exists'))) {
        console.log('⚠️ [BACKEND] User already exists');
        return res.status(409).json({ message: 'User already exists' });
      }
      throw authError;
    }

    if (!authData || !authData.user) {
      console.log('❌ [BACKEND] No user data returned from Supabase');
      return res.status(500).json({ message: 'Failed to create user' });
    }

    console.log('✅ [BACKEND] User created in Supabase Auth');
    console.log('🔵 [BACKEND] User ID:', authData.user.id);
    console.log('🔵 [BACKEND] User Email:', authData.user.email);

    console.log('🔵 [BACKEND] Creating profile in database...');
    // Create profile in profiles table
    const profileData = {
      id: authData.user.id,
      full_name: fullName || null,
      username: email,
      role,
      phone: phone || null,
    };
    console.log('🔵 [BACKEND] Profile data:', JSON.stringify(profileData, null, 2));

    // Use upsert to handle existing profiles (insert or update)
    console.log('🔵 [BACKEND] Upserting profile (insert or update if exists)...');
    const { error: profileError, data: profileDataResult } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id',
      })
      .select();

    if (profileError) {
      console.log('❌ [BACKEND] Profile upsert error:', JSON.stringify(profileError, null, 2));
      console.log('🔵 [BACKEND] Attempting to delete auth user...');
      // If profile creation fails, try to delete the auth user
      const deleteResult = await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('🔵 [BACKEND] Delete user result:', deleteResult);
      throw profileError;
    }

    console.log('✅ [BACKEND] Profile created successfully');
    console.log('🔵 [BACKEND] Profile data:', JSON.stringify(profileDataResult, null, 2));

    const response = {
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        fullName: fullName || null,
      },
    };

    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND] Signup completed successfully in', duration, 'ms');
    console.log('🔵 [BACKEND] Response:', JSON.stringify(response, null, 2));
    console.log('🔵 [BACKEND] ========================================\n');

    return res.status(201).json(response);
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log('❌ [BACKEND] Signup failed after', duration, 'ms');
    console.log('❌ [BACKEND] Error:', err.message);
    console.log('❌ [BACKEND] Error details:', JSON.stringify(err, null, 2));
    console.log('❌ [BACKEND] Stack:', err.stack);
    console.log('🔵 [BACKEND] ========================================\n');
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const startTime = Date.now();
  console.log('\n🔵 [BACKEND] ========== LOGIN REQUEST ==========');
  console.log('🔵 [BACKEND] Time:', new Date().toISOString());
  console.log('🔵 [BACKEND] Body:', JSON.stringify({ ...req.body, password: '***' }, null, 2));
  
  try {
    const { email, password } = req.body;

    console.log('🔵 [BACKEND] Validating input...');
    if (!email || !password) {
      console.log('❌ [BACKEND] Validation failed: Email or password missing');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('✅ [BACKEND] Validation passed');
    console.log('🔵 [BACKEND] Email:', email);
    console.log('🔵 [BACKEND] Authenticating with Supabase...');

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log('❌ [BACKEND] Supabase Auth Error:', JSON.stringify(authError, null, 2));
      if (authError.message && authError.message.includes('Invalid login credentials')) {
        console.log('⚠️ [BACKEND] Invalid credentials');
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      throw authError;
    }

    if (!authData || !authData.user) {
      console.log('❌ [BACKEND] No user data returned from Supabase');
      return res.status(401).json({ message: 'Authentication failed' });
    }

    console.log('✅ [BACKEND] Authentication successful');
    console.log('🔵 [BACKEND] User ID:', authData.user.id);
    console.log('🔵 [BACKEND] User Email:', authData.user.email);
    console.log('🔵 [BACKEND] Has session:', !!authData.session);
    console.log('🔵 [BACKEND] Has access token:', !!authData.session?.access_token);

    console.log('🔵 [BACKEND] Fetching user profile...');
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, phone, username')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.log('⚠️ [BACKEND] Profile fetch error:', JSON.stringify(profileError, null, 2));
      console.log('⚠️ [BACKEND] Continuing with default role: user');
    } else {
      console.log('✅ [BACKEND] Profile fetched successfully');
      console.log('🔵 [BACKEND] Profile data:', JSON.stringify(profile, null, 2));
    }

    const response = {
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile?.role || 'user',
        fullName: profile?.full_name || null,
        phone: profile?.phone || null,
      },
      session: {
        access_token: authData.session?.access_token ? '***' : null,
        refresh_token: authData.session?.refresh_token ? '***' : null,
      },
    };

    const duration = Date.now() - startTime;
    console.log('✅ [BACKEND] Login completed successfully in', duration, 'ms');
    console.log('🔵 [BACKEND] Response user:', JSON.stringify(response.user, null, 2));
    console.log('🔵 [BACKEND] ========================================\n');

    return res.json(response);
  } catch (err) {
    const duration = Date.now() - startTime;
    console.log('❌ [BACKEND] Login failed after', duration, 'ms');
    console.log('❌ [BACKEND] Error:', err.message);
    console.log('❌ [BACKEND] Error details:', JSON.stringify(err, null, 2));
    console.log('❌ [BACKEND] Stack:', err.stack);
    console.log('🔵 [BACKEND] ========================================\n');
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🔵 [BACKEND] Get Profile - User ID:', userId);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.log('❌ [BACKEND] Get Profile error:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('🔵 [BACKEND] Profile retrieved:');
    console.log('🔵 [BACKEND] - profile_picture_url:', profile?.profile_picture_url);
    console.log('🔵 [BACKEND] - team_name:', profile?.team_name);
    console.log('🔵 [BACKEND] - Full profile:', JSON.stringify(profile, null, 2));

    return res.json({ profile });
  } catch (err) {
    console.log('❌ [BACKEND] Get Profile error:', err.message);
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('🔵 [BACKEND] Update Profile Request Body:', JSON.stringify(req.body, null, 2));
    const {
      fullName,
      phone,
      email,
      profilePictureUrl,
      teamName,
      city,
      since,
      gender,
      playingRole,
      battingStyle,
      bowlingStyle,
      dob,
    } = req.body;
    const updates = {};

    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (profilePictureUrl !== undefined) {
      console.log('🔵 [BACKEND] Setting profile_picture_url:', profilePictureUrl);
      updates.profile_picture_url = profilePictureUrl;
    }
    if (teamName !== undefined) {
      console.log('🔵 [BACKEND] Setting team_name:', teamName);
      updates.team_name = teamName;
    }
    if (city !== undefined) updates.city = city;
    if (since !== undefined) updates.since = since;
    if (gender !== undefined) updates.gender = gender;
    if (playingRole !== undefined) updates.playing_role = playingRole;
    if (battingStyle !== undefined) updates.batting_style = battingStyle;
    if (bowlingStyle !== undefined) updates.bowling_style = bowlingStyle;
    if (dob !== undefined) updates.dob = dob;
    if (email !== undefined) {
      updates.username = email;
      // Also update auth email if provided
      await supabase.auth.admin.updateUserById(userId, { email });
    }

    console.log('🔵 [BACKEND] Updates object:', JSON.stringify(updates, null, 2));
    console.log('🔵 [BACKEND] User ID:', userId);

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.log('❌ [BACKEND] Profile update error:', JSON.stringify(error, null, 2));
      console.log('❌ [BACKEND] Error code:', error.code);
      console.log('❌ [BACKEND] Error message:', error.message);
      throw error;
    }

    if (!profile) {
      console.log('❌ [BACKEND] No profile returned from update');
      throw new Error('Profile update returned no data');
    }

    console.log('✅ [BACKEND] Profile updated successfully');
    console.log('🔵 [BACKEND] Updated profile data:', JSON.stringify(profile, null, 2));
    console.log('🔵 [BACKEND] profile_picture_url in response:', profile.profile_picture_url);
    console.log('🔵 [BACKEND] team_name in response:', profile.team_name);

    return res.json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (err) {
    console.log('❌ [BACKEND] Update profile error:', err.message);
    console.log('❌ [BACKEND] Error details:', JSON.stringify(err, null, 2));
    if (err.stack) {
      console.log('❌ [BACKEND] Stack trace:', err.stack);
    }
    next(err);
  }
};


