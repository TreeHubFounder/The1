
import 'next-auth';
import { UserRole, UserStatus, VerificationStatus } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    verificationStatus: VerificationStatus;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    avatar?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      status: UserStatus;
      verificationStatus: VerificationStatus;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      avatar?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    status: UserStatus;
    verificationStatus: VerificationStatus;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    avatar?: string;
  }
}
