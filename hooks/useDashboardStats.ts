import { useMemo } from 'react';
import { Person, AppState, GroupCategory } from '../types';
import { DashboardFilters, FilterAgeGroup } from '../components/dashboard/FilterBar';
import { GEO_COORDS, AGE_GROUPS, FEMALE_FIRST_NAMES } from '../components/dashboard/dashboardConstants';
import { DemographicGroup, MapPoint, PostalCodeCount } from '../components/dashboard/dashboardTypes';

// Helper function to calculate age - exported for use in filtering
export const calculateAge = (person: Person): number | null => {
  if (person.birth_date) {
    const birth = new Date(person.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } else if (person.birth_year) {
    return new Date().getFullYear() - person.birth_year;
  }
  return null;
};

// Helper function to determine gender - exported for use in filtering
export const isWoman = (person: Person): boolean => {
  const firstNameLower = person.firstName.toLowerCase();
  const isInList = FEMALE_FIRST_NAMES.includes(firstNameLower as typeof FEMALE_FIRST_NAMES[number]);
  return firstNameLower.endsWith('a') || 
         firstNameLower.endsWith('e') ||
         isInList;
};

// Helper function to check if person matches age group filter
const matchesAgeGroup = (person: Person, ageGroup: FilterAgeGroup): boolean => {
  if (ageGroup === 'all') return true;
  
  const age = calculateAge(person);
  if (age === null) return false;
  
  switch (ageGroup) {
    case '0-18':
      return age >= 0 && age <= 18;
    case '19-64':
      return age >= 19 && age <= 64;
    case '65+':
      return age >= 65;
    default:
      return true;
  }
};

// Filter persons based on filters
const filterPersons = (persons: Person[], filters: DashboardFilters): Person[] => {
  return persons.filter(person => {
    // Status filter
    if (filters.status === 'active' && !person.is_active) return false;
    if (filters.status === 'inactive' && person.is_active) return false;
    
    // Gender filter
    if (filters.gender === 'male' && isWoman(person)) return false;
    if (filters.gender === 'female' && !isWoman(person)) return false;
    
    // Age group filter
    if (!matchesAgeGroup(person, filters.ageGroup)) return false;
    
    return true;
  });
};

// Re-export types for convenience
export type { MapPoint, DemographicGroup, PostalCodeCount } from '../components/dashboard/dashboardTypes';

export interface DashboardStats {
  totalPersons: number;
  activePersons: number;
  personsInService: number;
  percentInService: number;
  postalCodeCounts: PostalCodeCount;
  mapPoints: MapPoint[];
  demographicData: DemographicGroup[];
  maxCount: number;
  maxPostalCodeCount: number;
  isEmpty: boolean;
}

export interface UseDashboardStatsParams {
  persons: Person[] | null | undefined;
  groupMembers: AppState['groupMembers'];
  groups: AppState['groups'];
  filters: DashboardFilters;
}

export const useDashboardStats = ({ 
  persons, 
  groupMembers, 
  groups, 
  filters 
}: UseDashboardStatsParams): DashboardStats => {
  // Filter persons based on filters - handle null/undefined data
  const filteredPersons = useMemo(() => {
    if (!persons || persons.length === 0) {
      return [];
    }
    return filterPersons(persons, filters);
  }, [persons, filters]);

  const totalPersons = filteredPersons.length;
  
  const activePersons = useMemo(() => {
    return filteredPersons.filter(p => p.is_active).length;
  }, [filteredPersons]);

  const personsInService = useMemo(() => {
    const uniquePersonIds = new Set<string>();
    const filteredPersonIds = new Set(filteredPersons.map(p => p.id));
    
    groupMembers.forEach(gm => {
      if (gm.group_id && filteredPersonIds.has(gm.person_id)) {
        const group = groups.find(g => g.id === gm.group_id);
        if (group && group.category === GroupCategory.SERVICE) {
          uniquePersonIds.add(gm.person_id);
        }
      }
    });
    return uniquePersonIds.size;
  }, [filteredPersons, groupMembers, groups]);

  const percentInService = useMemo(() => {
    if (totalPersons === 0) return 0;
    return Math.round((personsInService / totalPersons) * 100);
  }, [totalPersons, personsInService]);

  const postalCodeCounts = useMemo<PostalCodeCount>(() => {
    const counts: PostalCodeCount = {};
    filteredPersons.forEach(person => {
      if (person.postalCode?.trim()) {
        const code = person.postalCode.trim();
        counts[code] = (counts[code] ?? 0) + 1;
      }
    });
    return counts;
  }, [filteredPersons]);

  // Generate map points from postal code counts
  const mapPoints = useMemo<MapPoint[]>(() => {
    return Object.entries(postalCodeCounts)
      .filter((entry): entry is [string, number] => {
        const [, count] = entry;
        const [code] = entry;
        return typeof count === 'number' && count > 0 && GEO_COORDS[code] !== undefined;
      })
      .map(([code, count]) => {
        const coords = GEO_COORDS[code]!;
        return {
          postalCode: code,
          count,
          x: coords.x,
          y: coords.y
        };
      });
  }, [postalCodeCounts]);

  const demographicData = useMemo<DemographicGroup[]>(() => {
    return AGE_GROUPS.map(group => {
      const women = filteredPersons.filter(p => {
        const age = calculateAge(p);
        if (age === null) return false;
        return age >= group.min && age <= group.max && isWoman(p);
      }).length;

      const men = filteredPersons.filter(p => {
        const age = calculateAge(p);
        if (age === null) return false;
        return age >= group.min && age <= group.max && !isWoman(p);
      }).length;

      return { ...group, women, men, total: women + men };
    });
  }, [filteredPersons]);

  const maxCount = useMemo(() => {
    if (demographicData.length === 0) return 1;
    const maxValue = Math.max(...demographicData.map(d => Math.max(d.women, d.men)));
    return maxValue > 0 ? maxValue : 1;
  }, [demographicData]);

  const maxPostalCodeCount = useMemo(() => {
    const counts = Object.values(postalCodeCounts).filter((c): c is number => typeof c === 'number');
    if (counts.length === 0) return 1;
    const maxValue = Math.max(...counts);
    return maxValue > 0 ? maxValue : 1;
  }, [postalCodeCounts]);

  const isEmpty = totalPersons === 0;

  return {
    totalPersons,
    activePersons,
    personsInService,
    percentInService,
    postalCodeCounts,
    mapPoints,
    demographicData,
    maxCount,
    maxPostalCodeCount,
    isEmpty
  };
};
