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

// Force callback URL to always use the stable production alias,
// so preview deployments don't generate unregistered redirect URIs.
const CANONICAL_URL = "https://website-mauve-one-60.vercel.app";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_WEB_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          redirect_uri: `${CANONICAL_URL}/api/auth/callback/google`,
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
        // Upsert customer record for non-admin/non-IT Google sign-ins
        const itEmails = [
          process.env.RYAN_EMAIL || "ryan@greasethreads.com",
          "rcoffman34@gmail.com",
        ];
        const isAdmin = user.email.endsWith("@greasethreads.com") || itEmails.includes(user.email);
        if (!isAdmin) {
          try {
            const db = getDb();
            const id = `google_${account.providerAccountId}`;
            // Try upsert - requires unique index on email (created via migration)
            await db.execute({
              sql: `INSERT INTO customers (id, google_id, email, name, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(email) DO UPDATE SET name=excluded.name, google_id=excluded.google_id`,
              args: [id, account.providerAccountId, user.email, user.name ?? "", Date.now().toString()],
            });
          } catch (err) {
            // Non-fatal — don't block sign-in if customer upsert fails
            console.error("Customer upsert failed (non-fatal):", err);
          }
        }
        return true;
      }

      return false;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // IT admin emails — personal Gmail allowed for Ryan (not on Workspace domain)
        const itEmails = [
          process.env.RYAN_EMAIL || "ryan@greasethreads.com",
          "rcoffman34@gmail.com",
        ];

        if (!user.email) {
          // Credentials login → admin
          token.role = "admin";
        } else if (
          user.email === "anthoney@greasethreads.com" ||
          user.email === "gnt-test-tech@greasethreads.com"
        ) {
          token.role = "technician";
        } else if (itEmails.includes(user.email)) {
          token.role = "it";
        } else if (
          user.email === "gnt-test-customer@greasethreads.com" ||
          !user.email.endsWith("@greasethreads.com")
        ) {
          token.role = "customer";
        } else if (user.email.endsWith("@greasethreads.com")) {
          token.role = "admin";
        } else {
          token.role = "customer";
        }
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
