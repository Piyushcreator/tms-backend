import jwt from "jsonwebtoken";
import User from "../../models/User.js";

export async function getUserFromReq(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email role").lean();
    return user
      ? { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
      : null;
  } catch {
    return null;
  }
}

export function requireAuth(ctx) {
  if (!ctx.user) throw new Error("UNAUTHENTICATED");
}

export function requireRole(ctx, roles) {
  requireAuth(ctx);
  if (!roles.includes(ctx.user.role)) throw new Error("FORBIDDEN");
}
