import React from 'react';

/**
 * Skeleton loader for Dashboard statistics and map
 * Shows placeholder content while data is loading
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Statistics skeleton */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
                <div className="flex-1 h-8 bg-slate-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map skeleton */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
          <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div 
            className="relative w-full bg-slate-100 rounded-lg border border-slate-200 animate-pulse"
            style={{ aspectRatio: '600 / 400', minHeight: '300px' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-400 text-sm font-medium">Laster kart...</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="h-3 w-64 bg-slate-200 rounded animate-pulse mx-auto"></div>
          </div>
        </div>
      </section>
    </div>
  );
};
