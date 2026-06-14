import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
}) => {
  return (
    <div className="bg-cardbg border border-borderbg rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      {/* Decorative gradient glowing blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-textsecondary uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-bold mt-2 text-textprimary tracking-tight">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className="p-3 bg-borderbg rounded-lg border border-borderbg text-primary flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-4 flex items-center space-x-2 text-xs">
          {trend && (
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                trend.isPositive
                  ? 'bg-success/15 text-success'
                  : 'bg-danger/15 text-danger'
              }`}
            >
              {trend.value}
            </span>
          )}
          {description && (
            <span className="text-textsecondary">{description}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
