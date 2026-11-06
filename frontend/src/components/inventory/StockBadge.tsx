import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

interface StockBadgeProps {
  currentStock: string | number;
  minimumStock: string | number;
  unit: string;
  isLowStock?: boolean;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  currentStock,
  minimumStock,
  unit,
  isLowStock,
}) => {
  const stockNum = parseFloat(String(currentStock));
  const minNum = parseFloat(String(minimumStock));
  const low = isLowStock !== undefined ? isLowStock : stockNum <= minNum;

  if (stockNum === 0) {
    return (
      <Badge variant="danger" size="sm">
        <AlertTriangle className="w-3 h-3 text-rose-600" />
        <span>Out of Stock (0 {unit})</span>
      </Badge>
    );
  }

  if (low) {
    return (
      <Badge variant="warning" size="sm">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>Low Stock: {stockNum} {unit} (Min: {minNum})</span>
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" size="sm">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
      <span>{stockNum} {unit}</span>
    </Badge>
  );
};

