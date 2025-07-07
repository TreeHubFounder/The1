
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role, companyName } = body;

    // Validate required fields
    if (!email || !password || !firstName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role as UserRole,
        companyName: role === 'COMPANY' ? companyName : undefined,
        emailVerifiedAt: new Date(), // Auto-verify for now
      }
    });

    // Create profile based on role
    if (role === 'PROFESSIONAL') {
      await prisma.professionalProfile.create({
        data: {
          userId: user.id,
          specializations: [],
          equipmentOwned: [],
          portfolioImages: [],
          portfolioVideos: [],
        }
      });
    } else if (role === 'COMPANY') {
      await prisma.companyProfile.create({
        data: {
          userId: user.id,
          serviceAreas: [],
          serviceTypes: [],
          equipmentInventory: [],
        }
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
