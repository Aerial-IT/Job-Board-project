import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({ allowDangerousEmailAccountLinking: true }),
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async session({ session, token, user }) {
      console.log("Session callback - token:", token, "user:", user);
      if (session?.user) {
        if (user?.userType === "JOB_SEEKER") {
          try {
            const jobSeeker = await prisma.jobSeeker.findUnique({
              where: {
                userId: user.id,
              },
              select: {
                name: true,
                ats_keywords: true,
                resume: true,
                id: true,
              },
            });

            session.user.jobseekerId = jobSeeker?.id;
            session.user.jobseekerResume = jobSeeker?.resume;
            session.user.keywords = jobSeeker?.ats_keywords;
          } catch (error) {
            console.error("Error fetching job seeker:", error);
          }
        }
        session.user.role = user?.userType || undefined;
        session.user.id = user?.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
      }
      return token;
    },
  },
});
