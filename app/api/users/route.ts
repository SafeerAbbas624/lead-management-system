import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, fullName, email, role, createdAt')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return NextResponse.json(users || []);
  } catch (error) {
    console.error('Error in users GET API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, fullName, email, role } = body;

    // Validate required fields
    if (!username || !password || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: username, password, email, role' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        fullName: fullName,
        email,
        role,
        createdAt: new Date().toISOString(),
      })
      .select('id, username, fullName, email, role, createdAt')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error in users POST API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
