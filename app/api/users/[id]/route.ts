import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, fullName, email, role, createdAt')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in user GET API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { username, password, fullName, email, role } = body;

    // Validate required fields (password is optional for updates)
    if (!username || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: username, email, role' },
        { status: 400 }
      );
    }

    // Check if username already exists (excluding current user)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', params.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists (excluding current user)
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', params.id)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      username,
      fullName: fullName,
      email,
      role,
    };

    // Hash password if provided
    if (password && password.trim() !== '') {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select('id, username, fullName, email, role, createdAt')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error in user PUT API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', params.id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in user DELETE API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
