
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcryptjs from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Production URL configuration
  ...(process.env.NODE_ENV === 'production' && {
    url: 'https://treehub.app',
  }),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            professionalProfile: true,
            companyProfile: true,
          }
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        const isPasswordValid = await bcryptjs.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: user.role,
          status: user.status,
          verificationStatus: user.verificationStatus,
          companyName: user.companyName || undefined,
          avatar: user.avatar || undefined,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.verificationStatus = user.verificationStatus;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.companyName = user.companyName;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as any;
        session.user.status = token.status as any;
        session.user.verificationStatus = token.verificationStatus as any;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.companyName = token.companyName as string;
        session.user.avatar = token.avatar as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
