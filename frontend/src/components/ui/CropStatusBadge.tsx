'use client';

import React from 'react';
import { CropStatus } from '@/types';
import { Sprout, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CropStatusBadgeProps {
  status: CropStatus;
  isOverdue?: boolean;
}

export const CropStatusBadge: React.FC<CropStatusBadgeProps> = ({ status, isOverdue }) => {
  if (isOverdue && status !== 'Harvested') {
    return (
      <span className="badge badge-overdue" title="Harvest date has passed!">
        <AlertCircle size={12} /> Overdue
      </span>
    );
  }

  switch (status) {
    case 'Planned':
      return (
        <span className="badge badge-planned">
          <Clock size={12} /> Planned
        </span>
      );
    case 'Growing':
      return (
        <span className="badge badge-growing">
          <Sprout size={12} /> Growing
        </span>
      );
    case 'Ready to Harvest':
      return (
        <span className="badge badge-ready">
          <CheckCircle2 size={12} /> Ready to Harvest
        </span>
      );
    case 'Harvested':
      return (
        <span className="badge badge-harvested">
          <CheckCircle2 size={12} /> Harvested
        </span>
      );
    default:
      return <span className="badge badge-planned">{status}</span>;
  }
};
