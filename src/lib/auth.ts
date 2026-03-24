import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client/http";

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username !== process.env.ADMIN_USERNAME) return null;

        const stored = (process.env.ADMIN_PASSWORD || "").trim();
        if (!stored) return null;

        let valid = false;
        if (stored.startsWith("$2")) {
          valid = await bcrypt.compare(credentials.password.trim(), stored);
        } else {
          valid = credentials.password.trim() === stored;
        }

        if (!valid) return null;
        return { id: "1", name: "Admin" };
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      // Always allow credential login (admin)
      if (account?.provider === "credentials") return true;

      // For Google Sign-In, allow anyone
      if (account?.provider === "google" && user.email) {
        // Upsert customer record for non-admin Google sign-ins
        const isAdmin = user.email.endsWith("@greasethreads.com");
        if (!isAdmin) {
          try {
            const db = getDb();
            const id = `google_${account.providerAccountId}`;
            await db.execute({
              sql: `INSERT INTO customers (id, google_id, email, name, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(email) DO UPDATE SET name=excluded.name, google_id=excluded.google_id`,
              args: [id, account.providerAccountId, user.email, user.name ?? "", Date.now()],
            });
          } catch {
            // Table may not exist yet — don't block sign-in
          }
        }
        return true;
      }

      return false;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Admin: greasethreads.com email OR credentials login
        const isAdmin =
          user.email?.endsWith("@greasethreads.com") || !user.email;
        token.role = isAdmin ? "admin" : "customer";
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.provider = token.provider;
      }
      return session;
    },
  },
};
