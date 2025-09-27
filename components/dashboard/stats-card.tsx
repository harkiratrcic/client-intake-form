import React from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  description?: string;
}

export function StatsCard({ title, value, icon, change, description }: StatsCardProps) {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10" />
          </svg>
        );
      case 'neutral':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
              <div className="w-5 h-5 text-indigo-600">
                {icon}
              </div>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${getTrendColor(change.trend)}`}>
                    {getTrendIcon(change.trend)}
                    <span className="sr-only">
                      {change.trend === 'up' ? 'Increased' : change.trend === 'down' ? 'Decreased' : 'No change'} by
                    </span>
                    <span className="ml-1">{Math.abs(change.value)}%</span>
                  </div>
                )}
              </dd>
              {description && (
                <dd className="mt-1 text-sm text-gray-500">
                  {description}
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}