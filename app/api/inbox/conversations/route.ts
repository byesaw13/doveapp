// Inbox conversations listing.
// Returns recent conversations with customer contact info for the sidebar.
//
// FILTERING LOGIC:
// By default, shows conversations where:
//   - conversations.status = 'open' (default)
//   - AND latest message ai_category != 'spam_or_ads' (hides explicit spam)
//
// QUERY PARAMETERS:
// - status=open    → only open conversations (default)
// - status=closed  → only closed conversations
// - status=all     → ignore status filter (but still hide spam)
// - hideSpam=false → disable AI spam filtering (show all categories)
//
// TODO: Optimize this query - currently uses two database calls for efficiency.
// Future: Use a single query with window functions or create a database view.
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Allow filtering by conversation status (default to open conversations).
    const statusParam = request.nextUrl.searchParams.get('status') || 'open';
    const hideSpam = request.nextUrl.searchParams.get('hideSpam') !== 'false'; // Default true, false disables filtering

    // Pagination parameters
    const page = Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('page') || '1', 10)
    );
    const pageSize = Math.min(
      50,
      Math.max(
        1,
        parseInt(request.nextUrl.searchParams.get('pageSize') || '20', 10)
      )
    );
    const offset = (page - 1) * pageSize;

    // Step 1: Get total count for pagination
    let countQuery = supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true });

    // Apply status filter to count query unless 'all'
    if (statusParam !== 'all') {
      countQuery = countQuery.eq('status', statusParam);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Failed to get total count', countError);
      return NextResponse.json(
        { error: 'Unable to load conversations' },
        { status: 500 }
      );
    }

    // Step 2: Get paginated conversations
    let query = supabase
      .from('conversations')
      .select(
        `
          id,
          title,
          status,
          lead_score,
          primary_channel,
          last_message_at,
          created_at,
          customer:customers (
            id,
            full_name,
            phone,
            email
          )
        `
      )
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Apply status filter unless 'all'
    if (statusParam !== 'all') {
      query = query.eq('status', statusParam);
    }

    const { data: conversations, error: convError } = await query;

    if (convError) {
      console.error('Failed to fetch conversations', convError);
      return NextResponse.json(
        { error: 'Unable to load conversations' },
        { status: 500 }
      );
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        conversations: [],
        pagination: {
          page,
          pageSize,
          total: totalCount || 0,
          hasMore: false,
        },
      });
    }

    // Step 3: Get latest message's ai_category for each conversation
    const conversationIds = conversations.map((c) => c.id);
    const { data: latestMessages, error: msgError } = await supabase
      .from('messages')
      .select('conversation_id, ai_category, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false });

    if (msgError) {
      console.error('Failed to fetch latest messages', msgError);
      return NextResponse.json(
        { error: 'Unable to load conversations' },
        { status: 500 }
      );
    }

    // Step 4: Create a map of conversation_id -> latest ai_category
    const latestCategoryMap = new Map<string, string | null>();
    for (const msg of latestMessages || []) {
      if (!latestCategoryMap.has(msg.conversation_id)) {
        latestCategoryMap.set(msg.conversation_id, msg.ai_category);
      }
    }

    // Step 5: Filter conversations based on latest message's ai_category
    // By default, only hide explicit spam/ads. Show everything else.
    const filteredConversations = conversations.filter((conversation) => {
      if (!hideSpam) return true; // Show all if spam filtering is disabled

      const latestCategory = latestCategoryMap.get(conversation.id);
      // Hide only if explicitly marked as spam/ads
      return latestCategory !== 'spam_or_ads';
    });

    // Step 6: Calculate pagination info
    const hasMore = (totalCount || 0) > page * pageSize;

    return NextResponse.json({
      conversations: filteredConversations,
      pagination: {
        page,
        pageSize,
        total: totalCount || 0,
        hasMore,
      },
    });
  } catch (err) {
    console.error('Unexpected inbox conversations error', err);
    return NextResponse.json(
      { error: 'Unable to load conversations' },
      { status: 500 }
    );
  }
}
