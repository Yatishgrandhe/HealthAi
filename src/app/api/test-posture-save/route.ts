import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, session_title, posture_score, analysis_data, image_urls } = body;

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Test saving to posture_check_sessions table
    const { data, error } = await supabase
      .from('posture_check_sessions')
      .insert({
        user_id,
        session_title,
        posture_score,
        analysis_data,
        image_urls,
        duration_seconds: 30
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 });
    }

    // Test reading from posture_check_sessions table
    const { data, error } = await supabase
      .from('posture_check_sessions')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0, data });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 