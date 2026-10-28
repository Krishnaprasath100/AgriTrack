import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { updateStoredUserStatus, deleteStoredUser, getAllStoredUsers } from '@/lib/server/serverStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Guard against deleting the primary admin account
    const stored = getAllStoredUsers().find(
      (u) => u.uid === id || u.email.toLowerCase() === id.toLowerCase()
    );
    if (stored?.email.toLowerCase() === 'krishnaprasath720@gmail.com') {
      return NextResponse.json({ error: 'Cannot delete primary admin account' }, { status: 403 });
    }

    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM users WHERE uid = $1', [id]);
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete user error:', dbErr.message);
      }
    }

    deleteStoredUser(id);
    return NextResponse.json({ success: true, message: `User ${id} deleted successfully` });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
