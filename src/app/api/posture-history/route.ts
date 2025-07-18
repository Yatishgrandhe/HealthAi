import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

// Helper function to get current user
async function getCurrentUser() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not available',
          message: 'Supabase client not initialized'
        },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Fetch posture history from database
    const { data: sessions, error } = await supabase
      .from('posture_check_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching posture history:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database query failed',
          message: error.message
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('posture_check_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.warn('Error getting count:', countError);
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessions || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    });

  } catch (error: any) {
    console.error('Error in posture history API:', error);
    
    if (error.message === 'User not authenticated') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          message: 'Please log in to view your posture history'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to fetch posture history'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database not available',
          message: 'Supabase client not initialized'
        },
        { status: 500 }
      );
    }

    const user = await getCurrentUser();
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing session ID',
          message: 'Session ID is required for deletion'
        },
        { status: 400 }
      );
    }

    // Delete the session (only if it belongs to the current user)
    const { error } = await supabase
      .from('posture_check_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting posture session:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database deletion failed',
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Posture session deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in posture history deletion:', error);
    
    if (error.message === 'User not authenticated') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication required',
          message: 'Please log in to delete posture sessions'
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to delete posture session'
      },
      { status: 500 }
    );
  }
}