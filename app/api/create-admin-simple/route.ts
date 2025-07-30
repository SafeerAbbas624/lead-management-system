import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Simple approach - just try to create the admin user
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Try to insert directly
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: username,
        password: hashedPassword,
        fullName: 'System Administrator',
        email: 'safeerabbas.624@hotmail.com',
        role: 'Admin',
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // If user already exists, that's okay
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({
          success: false,
          message: 'Admin user already exists',
          credentials: {
            username: username,
            password: password
          }
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        username: username,
        password: password,
        note: 'Please change password after first login'
      },
      user: {
        id: data.id,
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        role: data.role
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
