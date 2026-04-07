import jwt from "jsonwebtoken";

export function getTokenFromRequest(req) {
  const authHeader = req.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = req.cookies?.get("auth_token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export function getAuthFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch (error) {
    console.error("JWT inválido:", error.message);
    return null;
  }
}

export function requireAuth(req, roles = []) {
  const auth = getAuthFromRequest(req);

  if (!auth) {
    return {
      error: Response.json({ error: "Não autorizado" }, { status: 401 }),
    };
  }

  if (roles.length > 0 && !roles.includes(auth.role)) {
    return {
      error: Response.json({ error: "Acesso negado" }, { status: 403 }),
    };
  }

  return { auth };
}
