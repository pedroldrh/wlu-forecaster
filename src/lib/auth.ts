import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isWluVerified: true },
        });
        if (dbUser) {
          session.user.role = dbUser.role;
          session.user.isWluVerified = dbUser.isWluVerified;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email?.endsWith("@mail.wlu.edu")) {
        await prisma.user.update({
          where: { id: user.id! },
          data: { isWluVerified: true },
        });
      }
    },
  },
});
