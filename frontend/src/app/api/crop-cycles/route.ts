import { NextRequest, NextResponse } from 'next/server';
import { query, isPostgresConfigured } from '@/lib/server/db';
import { INITIAL_DEMO_CROPS } from '@/lib/mockData';
import { generateId } from '@/lib/utils';
import { CropCycle } from '@/types';

let fallbackCrops: CropCycle[] = [...INITIAL_DEMO_CROPS];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    if (isPostgresConfigured()) {
      try {
        const sql = `
          SELECT 
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
            updated_at as "updatedAt"
          FROM crop_cycles
          WHERE user_id = $1
          ORDER BY seeding_date DESC;
        `;
        const dbRes = await query(sql, [userId]);
        return NextResponse.json({ success: true, data: dbRes.rows });
      } catch (dbErr: any) {
        console.warn('PostgreSQL get crops error, falling back:', dbErr.message);
      }
    }

    const crops = fallbackCrops.filter((c) => c.userId === userId || userId.startsWith('demo'));
    return NextResponse.json({ success: true, data: crops });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch crop cycles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      cropType,
      farmName,
      landArea,
      landAreaUnit = 'Acres',
      seedingDate,
      expectedHarvestDate,
      actualHarvestDate,
      status = 'Growing',
      notes,
    } = body;

    if (!userId || !cropType || !seedingDate || !expectedHarvestDate) {
      return NextResponse.json(
        { error: 'Missing required crop cycle fields' },
        { status: 400 }
      );
    }

    const cropCycleId = generateId('crop');
    const now = new Date().toISOString();

    if (isPostgresConfigured()) {
      try {
        let safeUserId = userId;
        const uCheck = await query('SELECT uid FROM users WHERE uid = $1', [userId]);
        if (uCheck.rows.length === 0) {
          const uEmailCheck = await query('SELECT uid FROM users WHERE LOWER(email) = LOWER($1)', [userId]);
          if (uEmailCheck.rows.length > 0) {
            safeUserId = uEmailCheck.rows[0].uid;
          } else {
            // Auto-sync user into PostgreSQL users table so foreign key constraint never fails
            try {
              await query(`
                INSERT INTO users (uid, full_name, email, password_hash, role, farm_name, account_status, phone_verified, email_verified, created_at, updated_at)
                VALUES ($1, $2, NULL, 'auth_managed', 'farmer', 'My Farm', 'active', true, false, NOW(), NOW())
                ON CONFLICT (uid) DO NOTHING;
              `, [userId, `Farmer ${String(userId).slice(-4)}`]);
              safeUserId = userId;
            } catch (syncErr: any) {
              console.warn('Could not auto-create user for crop cycle:', syncErr.message);
            }
          }
        }

        const sql = `
          INSERT INTO crop_cycles (
            crop_cycle_id, user_id, crop_type, farm_name, land_area, land_area_unit,
            seeding_date, expected_harvest_date, actual_harvest_date, status, notes,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          ON CONFLICT (crop_cycle_id) DO UPDATE SET
            crop_type = EXCLUDED.crop_type,
            farm_name = EXCLUDED.farm_name,
            land_area = EXCLUDED.land_area,
            land_area_unit = EXCLUDED.land_area_unit,
            seeding_date = EXCLUDED.seeding_date,
            expected_harvest_date = EXCLUDED.expected_harvest_date,
            actual_harvest_date = EXCLUDED.actual_harvest_date,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            updated_at = NOW()
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
          cropCycleId,
          safeUserId,
          cropType,
          farmName || '',
          landArea ? Number(landArea) : null,
          landAreaUnit,
          seedingDate,
          expectedHarvestDate,
          actualHarvestDate || null,
          status,
          notes || '',
        ]);

        return NextResponse.json({ success: true, data: dbRes.rows[0] }, { status: 201 });
      } catch (dbErr: any) {
        console.error('PostgreSQL create crop error:', dbErr.message);
      }
    }

    const newCrop: CropCycle = {
      cropCycleId,
      userId,
      cropType,
      farmName: farmName || '',
      landArea: landArea ? Number(landArea) : undefined,
      landAreaUnit,
      seedingDate,
      expectedHarvestDate,
      actualHarvestDate,
      status,
      notes,
      createdAt: now,
      updatedAt: now,
    };

    fallbackCrops.unshift(newCrop);
    return NextResponse.json({ success: true, data: newCrop }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create crop cycle' }, { status: 500 });
  }
}
