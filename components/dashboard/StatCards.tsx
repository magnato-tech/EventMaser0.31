import React, { memo } from 'react';
import { DemographicGroup } from './dashboardTypes';

interface StatCardsProps {
  totalPersons: number;
  activePersons: number;
  personsInService: number;
  percentInService: number;
  demographicData: DemographicGroup[];
  maxCount: number;
  isEmpty: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({
  totalPersons,
  activePersons,
  personsInService,
  percentInService,
  demographicData,
  maxCount,
  isEmpty
}) => {
  return (
    <>
      {/* Statistikk-kort kan legges til her hvis nødvendig */}
      
      {/* Demografisk oversikt */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
          <h3 className="text-sm font-bold text-slate-800">Demografisk oversikt</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-400 rounded"></div>
              <span className="text-xs font-semibold text-slate-700">Kvinner</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 rounded"></div>
              <span className="text-xs font-semibold text-slate-700">Menn</span>
            </div>
          </div>
          {isEmpty || demographicData.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-400">Ingen demografisk data tilgjengelig</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {demographicData.map((group) => {
                  const womenPercentage = maxCount > 0 ? (group.women / maxCount) * 100 : 0;
                  const menPercentage = maxCount > 0 ? (group.men / maxCount) * 100 : 0;
                  
                  return (
                    <div key={group.label} className="flex items-center gap-4">
                      <div className="w-12 text-xs font-bold text-slate-700 text-right">{group.label}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 flex items-center justify-end">
                          {group.women > 0 && (
                            <div 
                              className="bg-pink-400 h-8 flex items-center justify-end pr-2 text-white text-xs font-bold rounded-l"
                              style={{ width: `${womenPercentage}%`, minWidth: '24px' }}
                            >
                              {group.women}
                            </div>
                          )}
                        </div>
                        <div className="w-px h-8 bg-slate-300"></div>
                        <div className="flex-1 flex items-center justify-start">
                          {group.men > 0 && (
                            <div 
                              className="bg-blue-400 h-8 flex items-center justify-start pl-2 text-white text-xs font-bold rounded-r"
                              style={{ width: `${menPercentage}%`, minWidth: '24px' }}
                            >
                              {group.men}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  Antall personer (totalt: {totalPersons})
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(StatCards);
