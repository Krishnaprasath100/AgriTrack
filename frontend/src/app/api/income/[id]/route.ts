import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (isPostgresConfigured()) {
      try {
        await query(
          'DELETE FROM income WHERE income_id = $1 AND ($2::text IS NULL OR user_id = $2)',
          [id, userId || null]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete income error:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Income record deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete income record' }, { status: 500 });
  }
}
