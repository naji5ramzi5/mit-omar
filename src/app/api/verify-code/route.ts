import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

interface VerifyCodeRequest {
  code: string;
}

interface VerifyCodeResponse {
  success: boolean;
  error?: string;
  course?: {
    id: string;
    title: string;
    description: string;
    level: string;
  };
  access_token?: string;
  redirect_url: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as VerifyCodeRequest;
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      );
    }

    // Query activationCodes table - try both plain and hash lookups
    // First, try to find by exact code match (stored plain temporarily)
    const { data: codeData, error } = await supabaseAdmin
      .from('activationCodes')
      .select('*, course:courses(titleAr,titleDe,titleEn,level), user:users(name,email)')
      .or(`code_plain.eq.${code},code_hash.eq.${code}`)
      .single();

    if (error || !codeData) {
      return NextResponse.json(
        { success: false, error: 'Invalid code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Check if code is expired
    const expiryDate = new Date(codeData.expiresAt);
    const now = new Date();
    if (expiryDate < now) {
      return NextResponse.json(
        { success: false, error: `This code has expired on ${codeData.expiresAt.toLocaleDateString()}.` },
        { status: 400 }
      );
    }

    // Check if code already used
    if (codeData.is_used) {
      return NextResponse.json(
        { success: false, error: 'This code has already been used.' },
        { status: 400 }
      );
    }

    // Check rate limiting - failed attempts
    // (Simplified - in production would use IP-based tracking)
    // For now, just proceed with verification

    // Mark code as used in a transaction-like manner
    const { error: updateError } = await supabaseAdmin
      .from('activationCodes')
      .update({ 
        is_used: true,
        used_by: codeData.user?.email,
        used_at: new Date().toISOString()
      })
      .eq('id', codeData.id);

    if (updateError) {
      console.error('Failed to mark code as used:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to process code. Please try again.' },
        { status: 500 }
      );
    }

    // Create enrollment for the user
    const { data: user } = await supabaseAdmin.auth.getUser();
    const userId = user?.user?.id;

    // Check if already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from('enrollments')
      .select()
      .eq('user_id', userId)
      .eq('course_id', codeData.course_id)
      .single();

    let enrollment;
    if (existingEnrollment) {
      enrollment = existingEnrollment;
    } else {
      // Create new enrollment
      const { data: newEnrollment, error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: codeData.course_id,
          code: code,
          activated_at: new Date().toISOString(),
          expires_at: codeData.expiresAt,
          is_active: true
        })
        .select()
        .single();

      if (enrollError) {
        // If enrollment creation fails, still mark code as used but revert
        await supabaseAdmin
          .from('activationCodes')
          .update({ is_used: false })
          .eq('id', codeData.id);
        return NextResponse.json(
          { success: false, error: 'Failed to enroll. Please contact support.' },
          { status: 500 }
        );
      }
      enrollment = newEnrollment;
    }

    // Generate access token (JWT-like)
    const access_token = btoa(`${userId}:${codeData.course_id}:${Date.now()}`);

    return NextResponse.json({
      success: true,
      data: {
        course_id: codeData.course_id,
        course_title: codeData.course?.titleEn || codeData.course?.titleAr || codeData.course?.titleDe,
        access_token,
        redirect_url: `/course/${codeData.course_id}?token=${access_token}`
      }
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}