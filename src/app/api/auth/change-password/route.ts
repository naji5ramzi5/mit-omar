import { supabaseAdmin } from '@/lib/supabase';
import { decodeUserId } from '@/lib/admin-auth';
import { compare, hash } from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const userId = decodeUserId(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
    }

    // Fetch current user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, password')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check current password
    if (user.password) {
      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
