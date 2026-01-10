import React, { memo } from 'react';
import { Filter } from 'lucide-react';

export type FilterStatus = 'all' | 'active' | 'inactive';
export type FilterGender = 'all' | 'male' | 'female';
export type FilterAgeGroup = 'all' | '0-18' | '19-64' | '65+';

export interface DashboardFilters {
  status: FilterStatus;
  gender: FilterGender;
  ageGroup: FilterAgeGroup;
}

interface FilterBarProps {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const handleStatusChange = (value: FilterStatus) => {
    onFilterChange({ ...filters, status: value });
  };

  const handleGenderChange = (value: FilterGender) => {
    onFilterChange({ ...filters, gender: value });
  };

  const handleAgeGroupChange = (value: FilterAgeGroup) => {
    onFilterChange({ ...filters, ageGroup: value });
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
        <Filter className="text-indigo-600" size={18} />
        <h3 className="text-sm font-bold text-slate-800">Filtre</h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="all">Alle</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>

          {/* Kjønn filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
              Kjønn
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleGenderChange(e.target.value as FilterGender)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="all">Alle</option>
              <option value="male">Mann</option>
              <option value="female">Kvinne</option>
            </select>
          </div>

          {/* Aldersgruppe filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">
              Aldersgruppe
            </label>
            <select
              value={filters.ageGroup}
              onChange={(e) => handleAgeGroupChange(e.target.value as FilterAgeGroup)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            >
              <option value="all">Alle</option>
              <option value="0-18">0-18 år</option>
              <option value="19-64">19-64 år</option>
              <option value="65+">65+ år</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
};

// Memoize component - filters change frequently but component structure doesn't
export default memo(FilterBar);
