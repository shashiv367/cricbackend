const supabase = require('../lib/supabaseClient');

// Middleware to verify JWT token from Supabase
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware to check if user has required role
exports.requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(403).json({ message: 'Role not found' });
      }

      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.userRole = profile.role;
      next();
    } catch (err) {
      res.status(403).json({ message: 'Authorization failed' });
    }
  };
};







