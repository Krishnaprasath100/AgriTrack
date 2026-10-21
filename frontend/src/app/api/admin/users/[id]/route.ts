import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { updateStoredUserStatus } from '@/lib/server/serverStore';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { accountStatus } = body;

    if (!accountStatus || !['active', 'deactivated'].includes(accountStatus)) {
      return NextResponse.json({ error: 'Invalid accountStatus parameter' }, { status: 400 });
    }

    if (isPostgresConfigured()) {
      try {
        await query(
          'UPDATE users SET account_status = $1, updated_at = NOW() WHERE uid = $2',
          [accountStatus, id]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL update user status error:', dbErr.message);
      }
    }

    updateStoredUserStatus(id, accountStatus);
    return NextResponse.json({ success: true, message: `Account status updated to ${accountStatus}` });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
