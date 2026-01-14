const supabase = require('../lib/supabaseClient');

// List all locations
exports.listLocations = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return res.json({ locations: data || [] });
  } catch (err) {
    next(err);
  }
};

// Create or get location
exports.createOrGetLocation = async (req, res, next) => {
  try {
    const { name, address, city, state, country } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Location name is required' });
    }

    const normalizedName = name.trim();

    // Check if location exists
    const { data: existing, error: checkError } = await supabase
      .from('locations')
      .select('*')
      .ilike('name', normalizedName)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.json({
        message: 'Location already exists',
        location: existing[0],
      });
    }

    // Create new location
    const { data: location, error: insertError } = await supabase
      .from('locations')
      .insert({
        name: normalizedName,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      message: 'Location created successfully',
      location,
    });
  } catch (err) {
    next(err);
  }
};







