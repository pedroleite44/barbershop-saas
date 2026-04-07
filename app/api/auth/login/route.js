import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { initDatabase, sql } from "../../../../lib/db.js";

export async function POST(req) {
  try {
    await initDatabase();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const users = await sql`
      SELECT
        u.id,
        u.tenant_id,
        u.name,
        u.email,
        u.password,
        u.role,
        t.name AS tenant_name
      FROM users u
      JOIN tenants t ON t.id = u.tenant_id
      WHERE u.email = ${email}
      LIMIT 1
    `;

    if (!users.length) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    const user = users[0];
    const ok = await bcryptjs.compare(password, user.password);

    if (!ok) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        email: user.email,
        name: user.name,
        tenant_name: user.tenant_name,
      },
      tenant_name: user.tenant_name,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("ERRO LOGIN:", error);
    return NextResponse.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
