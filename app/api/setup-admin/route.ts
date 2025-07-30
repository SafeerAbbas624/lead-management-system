import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Setup admin API called');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Check if any admin users already exist
    console.log('Checking for existing admin users...');
    const { data: existingAdmins, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Admin');

    console.log('Check result:', { existingAdmins, checkError });

    if (checkError) {
      console.error('Error checking existing admins:', checkError);
      throw checkError;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Admin user already exists'
      }, { status: 409 });
    }

    // Create default admin user
    const defaultAdmin = {
      username: 'admin',
      password: 'admin123', // Default password - should be changed after first login
      fullname: 'System Administrator',
      email: 'safeerabbas.624@hotmail.com',
      role: 'Admin'
    };

    // Hash password
    console.log('Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultAdmin.password, saltRounds);
    console.log('Password hashed successfully');

    // Insert admin user
    console.log('Inserting admin user...');
    const insertData = {
      username: defaultAdmin.username,
      password: hashedPassword,
      fullName: defaultAdmin.fullname,
      email: defaultAdmin.email,
      role: defaultAdmin.role,
      createdAt: new Date().toISOString(),
    };
    console.log('Insert data:', { ...insertData, password: '[HIDDEN]' });

    const { data: newAdmin, error: insertError } = await supabase
      .from('users')
      .insert(insertData)
      .select('id, username, fullName, email, role, createdAt')
      .single();

    console.log('Insert result:', { newAdmin, insertError });

    if (insertError) {
      console.error('Error creating admin user:', insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: 'Default admin user created successfully',
      user: newAdmin,
      credentials: {
        username: defaultAdmin.username,
        password: defaultAdmin.password,
        note: 'Please change the password after first login'
      }
    });
  } catch (error) {
    console.error('Error in setup-admin API:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        fullError: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
