import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'chitral_food_hub_secure_jwt_token_key_2026_cfh';

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(enteredPassword, hashedPassword) {
  return bcrypt.compare(enteredPassword, hashedPassword);
}

/**
 * Middleware helper for API routes to extract and verify auth token
 */
export function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.cfh_token) {
    token = req.cookies.cfh_token;
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Ownership guard: confirms the logged-in user is allowed to manage
 * the given restaurantId (either they own it, or they're an admin).
 *
 * Returns { ok: true, auth } on success, or { ok: false, status, message }
 * on failure — callers should just forward that straight to res.
 */
export function requireRestaurantAccess(req, restaurantId) {
  const auth = getAuthUser(req);

  if (!auth) {
    return { ok: false, status: 401, message: 'Please log in to continue.' };
  }

  if (auth.role === 'admin') {
    return { ok: true, auth };
  }

  if (auth.role === 'restaurant_owner') {
    const ownedId = auth.restaurantId ? String(auth.restaurantId) : null;
    if (ownedId && ownedId === String(restaurantId)) {
      return { ok: true, auth };
    }
    return { ok: false, status: 403, message: 'You can only manage your own restaurant.' };
  }

  return { ok: false, status: 403, message: 'Not authorized for this action.' };
}
