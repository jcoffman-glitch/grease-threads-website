import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        if (credentials.username !== process.env.ADMIN_USERNAME) return null;

        const stored = process.env.ADMIN_PASSWORD;
        if (!stored) return null;

        // Support both bcrypt hash and plaintext (plaintext for initial setup)
        let valid = false;
        if (stored.startsWith("$2")) {
          valid = await bcrypt.compare(credentials.password, stored);
        } else {
          valid = credentials.password === stored;
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
};
