import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      cropType,
      farmName,
      landArea,
      landAreaUnit,
      seedingDate,
      expectedHarvestDate,
      actualHarvestDate,
      status,
      notes,
    } = body;

    if (isPostgresConfigured()) {
      try {
        const sql = `
          UPDATE crop_cycles
          SET 
            crop_type = COALESCE($1, crop_type),
            farm_name = COALESCE($2, farm_name),
            land_area = COALESCE($3, land_area),
            land_area_unit = COALESCE($4, land_area_unit),
            seeding_date = COALESCE($5, seeding_date),
            expected_harvest_date = COALESCE($6, expected_harvest_date),
            actual_harvest_date = COALESCE($7, actual_harvest_date),
            status = COALESCE($8, status),
            notes = COALESCE($9, notes),
            updated_at = NOW()
          WHERE crop_cycle_id = $10
          RETURNING 
            crop_cycle_id as "cropCycleId",
            user_id as "userId",
            crop_type as "cropType",
            farm_name as "farmName",
            land_area as "landArea",
            land_area_unit as "landAreaUnit",
            TO_CHAR(seeding_date, 'YYYY-MM-DD') as "seedingDate",
            TO_CHAR(expected_harvest_date, 'YYYY-MM-DD') as "expectedHarvestDate",
            TO_CHAR(actual_harvest_date, 'YYYY-MM-DD') as "actualHarvestDate",
            status,
            notes,
            created_at as "createdAt",
            updated_at as "updatedAt";
        `;
        const dbRes = await query(sql, [
          cropType || null,
          farmName || null,
          landArea ? Number(landArea) : null,
          landAreaUnit || null,
          seedingDate || null,
          expectedHarvestDate || null,
          actualHarvestDate || null,
          status || null,
          notes || null,
          id,
        ]);

        if (dbRes.rows.length > 0) {
          return NextResponse.json({ success: true, data: dbRes.rows[0] });
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL update crop error:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, data: { cropCycleId: id, ...body } });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update crop cycle' }, { status: 500 });
  }
}

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
          'DELETE FROM crop_cycles WHERE crop_cycle_id = $1 AND ($2::text IS NULL OR user_id = $2)',
          [id, userId || null]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete crop error:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Crop cycle deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete crop cycle' }, { status: 500 });
  }
}
