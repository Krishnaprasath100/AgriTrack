import { Router, Request, Response } from 'express';
import { query, isPostgresConfigured } from '../db';
import { validateCropCycleInput } from '../lib/validation';
import { INITIAL_DEMO_CROPS } from '../lib/mockData';
import { generateId } from '../lib/utils';
import { CropCycle } from '../types';

const router = Router();

// In-memory fallback cache for newly added crops if postgres is not active
let fallbackCrops: CropCycle[] = [...INITIAL_DEMO_CROPS];

// GET /api/crop-cycles
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
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
        return res.json({ success: true, data: dbRes.rows });
      } catch (dbErr: any) {
        console.warn('PostgreSQL get crops error, falling back to demo crops:', dbErr.message);
      }
    }

    const crops = fallbackCrops.filter((c) => c.userId === userId || userId.startsWith('demo'));
    return res.json({ success: true, data: crops });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch crop cycles' });
  }
});

// POST /api/crop-cycles
router.post('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const body = req.body;
    const validation = validateCropCycleInput(body);

    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const id = body.cropCycleId || generateId('crp');
    const now = new Date().toISOString();

    const cropRecord: CropCycle = {
      cropCycleId: id,
      userId: body.userId,
      cropType: body.cropType,
      farmName: body.farmName,
      landArea: Number(body.landArea),
      landAreaUnit: body.landAreaUnit || 'Acres',
      seedingDate: body.seedingDate,
      expectedHarvestDate: body.expectedHarvestDate,
      actualHarvestDate: body.actualHarvestDate || undefined,
      status: body.status || 'Planted',
      notes: body.notes || '',
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    if (isPostgresConfigured()) {
      try {
        const sql = `
          INSERT INTO crop_cycles (
            crop_cycle_id, user_id, crop_type, farm_name, land_area, land_area_unit,
            seeding_date, expected_harvest_date, actual_harvest_date, status, notes,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
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
            updated_at = NOW();
        `;

        await query(sql, [
          id,
          cropRecord.userId,
          cropRecord.cropType,
          cropRecord.farmName,
          cropRecord.landArea,
          cropRecord.landAreaUnit,
          cropRecord.seedingDate,
          cropRecord.expectedHarvestDate,
          cropRecord.actualHarvestDate || null,
          cropRecord.status,
          cropRecord.notes || '',
        ]);

        await query(
          'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [generateId('log'), cropRecord.userId, 'created', 'cropCycle', id, `Planted ${cropRecord.cropType} at ${cropRecord.farmName}`]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL insert crop error, using fallback:', dbErr.message);
      }
    }

    const existingIdx = fallbackCrops.findIndex((c) => c.cropCycleId === id);
    if (existingIdx >= 0) {
      fallbackCrops[existingIdx] = cropRecord;
    } else {
      fallbackCrops.unshift(cropRecord);
    }

    return res.status(201).json({ success: true, data: cropRecord });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save crop cycle' });
  }
});

// PATCH & PUT /api/crop-cycles/:id
const updateCropHandler = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const updates = req.body;

    if (isPostgresConfigured()) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (updates.cropType !== undefined) {
          fields.push(`crop_type = $${idx++}`);
          values.push(updates.cropType);
        }
        if (updates.farmName !== undefined) {
          fields.push(`farm_name = $${idx++}`);
          values.push(updates.farmName);
        }
        if (updates.landArea !== undefined) {
          fields.push(`land_area = $${idx++}`);
          values.push(updates.landArea ? Number(updates.landArea) : null);
        }
        if (updates.landAreaUnit !== undefined) {
          fields.push(`land_area_unit = $${idx++}`);
          values.push(updates.landAreaUnit);
        }
        if (updates.seedingDate !== undefined) {
          fields.push(`seeding_date = $${idx++}`);
          values.push(updates.seedingDate);
        }
        if (updates.expectedHarvestDate !== undefined) {
          fields.push(`expected_harvest_date = $${idx++}`);
          values.push(updates.expectedHarvestDate);
        }
        if (updates.actualHarvestDate !== undefined) {
          fields.push(`actual_harvest_date = $${idx++}`);
          values.push(updates.actualHarvestDate || null);
        }
        if (updates.status !== undefined) {
          fields.push(`status = $${idx++}`);
          values.push(updates.status);
        }
        if (updates.notes !== undefined) {
          fields.push(`notes = $${idx++}`);
          values.push(updates.notes || null);
        }

        fields.push(`updated_at = NOW()`);
        values.push(id);

        const sql = `UPDATE crop_cycles SET ${fields.join(', ')} WHERE crop_cycle_id = $${idx}`;
        await query(sql, values);

        if (updates.userId) {
          await query(
            'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            [generateId('log'), updates.userId, 'updated', 'cropCycle', id, `Updated crop cycle #${id}`]
          );
        }
      } catch (dbErr: any) {
        console.warn('PostgreSQL update crop error:', dbErr.message);
      }
    }

    const idx = fallbackCrops.findIndex((c) => c.cropCycleId === id);
    if (idx >= 0) {
      fallbackCrops[idx] = { ...fallbackCrops[idx], ...updates, updatedAt: new Date().toISOString() };
    }

    return res.json({ success: true, message: `Updated crop cycle #${id}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update crop cycle' });
  }
};

router.patch('/:id', updateCropHandler);
router.put('/:id', updateCropHandler);

// DELETE /api/crop-cycles/:id
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = (req.query.userId as string) || 'demo_farmer_1';

    if (isPostgresConfigured()) {
      try {
        await query('DELETE FROM crop_cycles WHERE crop_cycle_id = $1', [id]);
        await query(
          'INSERT INTO activity_logs (log_id, user_id, action_type, entity_type, entity_id, description, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [generateId('log'), userId, 'deleted', 'cropCycle', id, `Deleted crop cycle #${id}`]
        );
      } catch (dbErr: any) {
        console.warn('PostgreSQL delete crop error:', dbErr.message);
      }
    }

    fallbackCrops = fallbackCrops.filter((c) => c.cropCycleId !== id);
    return res.json({ success: true, message: `Deleted crop cycle #${id}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete crop cycle' });
  }
});

export default router;
