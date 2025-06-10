import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { RedisAdapter } from "@next-auth/redis-adapter";
import { redis } from "@/lib/redis";

const credentialsConfig = CredentialsProvider({
  name: "Credentials",
  credentials: {
    name: { label: "User Name" },
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials: any) {
    const { name, email, password, isLogin } = credentials;
    const user = await db.user.findUnique({ where: { email } });

    if (isLogin === "false" && !user) {
      const result = await db.user.create({
        data: { name, email, password },
      });
      return result ?? null;
    } else if (user && user?.password === password) {
      return user;
    } else return null;
  },
});

const config = {
  adapter: RedisAdapter(redis),
  providers: [Google, credentialsConfig],
  secret: process.env.SECRET,
  session: {
    strategy: "database", // uses Redis instead of JWT
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
