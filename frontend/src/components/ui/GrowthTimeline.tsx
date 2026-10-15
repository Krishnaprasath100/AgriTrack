'use client';

import React from 'react';
import { CropCycle } from '@/types';
import { formatDate, getDaysRemaining, calculateCropProgress } from '@/lib/utils';
import { Calendar, CheckCircle2, Clock, Sprout } from 'lucide-react';

interface GrowthTimelineProps {
  crop: CropCycle;
}

export const GrowthTimeline: React.FC<GrowthTimelineProps> = ({ crop }) => {
  const progress = crop.status === 'Harvested' ? 100 : calculateCropProgress(crop.seedingDate, crop.expectedHarvestDate);
  const remaining = getDaysRemaining(crop.expectedHarvestDate);

  const stages = [
    {
      title: 'Seeding',
      date: formatDate(crop.seedingDate),
      isDone: true,
      icon: Sprout,
    },
    {
      title: 'Growth & Care',
      date: crop.status === 'Planned' ? 'Pending' : 'In Progress',
      isDone: crop.status !== 'Planned',
      icon: Clock,
    },
    {
      title: 'Expected Harvest',
      date: formatDate(crop.expectedHarvestDate),
      isDone: crop.status === 'Harvested' || crop.status === 'Ready to Harvest',
      icon: Calendar,
      highlight: remaining.isOverdue && crop.status !== 'Harvested',
    },
    {
      title: 'Harvested',
      date: crop.actualHarvestDate ? formatDate(crop.actualHarvestDate) : (crop.status === 'Harvested' ? 'Completed' : 'Pending'),
      isDone: crop.status === 'Harvested',
      icon: CheckCircle2,
    },
  ];

  return (
    <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#f9fbf9', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
      {/* Progress header & bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.82rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--primary-900)' }}>Cycle Progress</span>
        <span
          style={{
            fontWeight: 700,
            color: remaining.isOverdue && crop.status !== 'Harvested' ? '#dc2626' : 'var(--primary-700)',
          }}
        >
          {crop.status === 'Harvested' ? 'Harvest Completed (100%)' : `${progress}% • ${remaining.label}`}
        </span>
      </div>

      <div
        style={{
          width: '100%',
          height: '7px',
          backgroundColor: '#e5ede7',
          borderRadius: '999px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background:
              remaining.isOverdue && crop.status !== 'Harvested'
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, #52b788, #2d6a4f)',
            borderRadius: '999px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* 4 Steps Timeline nodes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          position: 'relative',
        }}
      >
        {stages.map((st, i) => {
          const Icon = st.icon;
          return (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: st.isDone ? '#dcfce7' : '#f1f5f9',
                  color: st.isDone ? '#15803d' : '#94a3b8',
                  border: st.highlight ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
                }}
              >
                <Icon size={14} />
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {st.title}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: st.highlight ? '#dc2626' : 'var(--text-dim)',
                  fontWeight: st.highlight ? 600 : 400,
                }}
              >
                {st.date}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
