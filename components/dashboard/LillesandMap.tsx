import React, { useMemo, memo } from 'react';
import { MapPoint } from './dashboardTypes';
import { MAP_HEAT_MIN_SIZE, MAP_HEAT_MAX_SIZE, MAP_HEAT_MIN_INTENSITY, MAP_HEAT_MAX_INTENSITY } from './dashboardConstants';

interface LillesandMapProps {
  points: MapPoint[];
  maxPostalCodeCount: number;
  isEmpty?: boolean;
}

const LillesandMap: React.FC<LillesandMapProps> = ({ points, maxPostalCodeCount, isEmpty = false }) => {
  const totalPersons = useMemo(() => {
    return points.reduce((sum, point) => sum + point.count, 0);
  }, [points]);

  const uniquePostalCodes = useMemo(() => {
    return new Set(points.map(p => p.postalCode)).size;
  }, [points]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
        <h3 className="text-sm font-bold text-slate-800">Geografisk utbredelse</h3>
      </div>
      <div className="p-6">
        <div className="relative w-full" style={{ aspectRatio: '600 / 400', minHeight: '300px' }}>
          {/* Kartbilde */}
          <img 
            src="https://placehold.co/600x400?text=Kart+over+Kristiansand" 
            alt="Kart over Kristiansand" 
            className="w-full h-full object-cover rounded-lg border border-slate-200"
          />
          {/* Heatmap overlay */}
          <div className="absolute inset-0">
            {isEmpty || points.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 rounded-lg">
                <p className="text-sm font-medium text-slate-500">Ingen data å vise</p>
              </div>
            ) : (
              points.map((point) => {
                // Beregn størrelse basert på antall personer
                const size = MAP_HEAT_MIN_SIZE + (point.count / maxPostalCodeCount) * (MAP_HEAT_MAX_SIZE - MAP_HEAT_MIN_SIZE);
                // Beregn intensitet basert på antall personer
                const intensity = MAP_HEAT_MIN_INTENSITY + (point.count / maxPostalCodeCount) * (MAP_HEAT_MAX_INTENSITY - MAP_HEAT_MIN_INTENSITY);
              
              return (
                <div
                  key={point.postalCode}
                  className="absolute rounded-full cursor-pointer transition-all hover:scale-110"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: `rgba(255, 0, 0, ${intensity})`,
                    filter: 'blur(8px)',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 ${size}px rgba(255, 0, 0, ${intensity * 0.8})`
                  }}
                  title={`Postnr ${point.postalCode}: ${point.count} ${point.count === 1 ? 'person' : 'personer'}`}
                />
              );
              })
            )}
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            {isEmpty || points.length === 0 
              ? 'Ingen geografisk data tilgjengelig' 
              : `${uniquePostalCodes} postnummer med ${totalPersons} ${totalPersons === 1 ? 'person' : 'personer'}`}
          </p>
        </div>
      </div>
    </section>
  );
};

// Memoize component to prevent unnecessary re-renders when parent updates but props haven't changed
export default memo(LillesandMap);
