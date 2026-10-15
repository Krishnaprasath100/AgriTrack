'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  colorTone?: 'green' | 'amber' | 'blue' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  colorTone = 'green',
}) => {
  const getColors = () => {
    switch (colorTone) {
      case 'rose':
        return { bg: '#fee2e2', text: '#b91c1c' };
      case 'amber':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'blue':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      default:
        return { bg: '#d8f3dc', text: '#1b4332' };
    }
  };

  const colors = getColors();

  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <div className="stat-icon" style={{ backgroundColor: colors.bg, color: colors.text }}>
          <Icon size={22} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtext && (
        <div className="stat-footer">
          {trend === 'positive' && <span style={{ color: 'var(--profit-green)', fontWeight: 600 }}>↑</span>}
          {trend === 'negative' && <span style={{ color: 'var(--loss-red)', fontWeight: 600 }}>↓</span>}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};
