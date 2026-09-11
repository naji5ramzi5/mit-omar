import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { issueToken } from '@/lib/token';

export async function POST(req: Request) {
  try {
    const { email, name, avatarUrl } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      // Auto-register new student
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          name: name || email.split('@')[0],
          email,
          role: 'student',
        })
        .select('*')
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // STRICT SECURITY POLICY:
    // Any session created through Google OAuth in the public student platform
    // is strictly restricted to role: 'student'.
    // Admin privileges can NEVER be accessed via Google OAuth and require
    // explicit credentials through the protected Admin Panel.
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'student', // ALWAYS strictly student
    };

    const token = issueToken(user.id);

    return NextResponse.json({
      user: safeUser,
      token,
    });
  } catch (error) {
    console.error('Google sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
