import { useState, useEffect } from 'react';
import { Person, CoreRole, AppState } from '../types';

/**
 * Database representation of a person (as stored in Supabase)
 * This matches the actual database schema with snake_case naming
 */
export interface DatabasePerson {
  id: string;
  first_name: string; // snake_case in database
  last_name: string;
  email?: string | null;
  phone?: string | null;
  social_security_number?: string | null;
  birth_year?: number | null;
  birth_date?: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  is_admin: boolean;
  is_active: boolean;
  core_role: string; // Stored as string in DB, but should be CoreRole enum
  created_at?: string;
  updated_at?: string;
}

/**
 * Maps a DatabasePerson to our application's Person interface
 * Handles the transformation from snake_case (DB) to camelCase (app)
 */
export const mapDatabasePersonToPerson = (dbPerson: DatabasePerson): Person => {
  return {
    id: dbPerson.id,
    firstName: dbPerson.first_name,
    lastName: dbPerson.last_name,
    email: dbPerson.email ?? undefined,
    phone: dbPerson.phone ?? undefined,
    social_security_number: dbPerson.social_security_number ?? undefined,
    birth_year: dbPerson.birth_year ?? undefined,
    birth_date: dbPerson.birth_date ?? undefined,
    streetAddress: dbPerson.street_address ?? undefined,
    postalCode: dbPerson.postal_code ?? undefined,
    city: dbPerson.city ?? undefined,
    is_admin: dbPerson.is_admin,
    is_active: dbPerson.is_active,
    core_role: dbPerson.core_role as CoreRole
  };
};

/**
 * Hook for fetching members from the database
 * Structured for async Supabase integration
 * 
 * TODO: When integrating Supabase, replace mockDataFetcher with:
 * ```typescript
 * const { data: dbPersons, error: fetchError } = await supabase
 *   .from('persons')
 *   .select('*');
 * if (fetchError) throw fetchError;
 * return dbPersons.map(mapDatabasePersonToPerson);
 * ```
 */
export interface UseMembersResult {
  data: Person[] | null;
  loading: boolean;
  error: Error | null;
}

interface UseMembersOptions {
  mockData?: AppState; // Temporary: for mock data during development
}

export const useMembers = (options?: UseMembersOptions): UseMembersResult => {
  const [data, setData] = useState<Person[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simulate async data fetching
    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual Supabase query when ready:
        // import { supabase } from '../lib/supabase';
        // const { data: dbPersons, error: fetchError } = await supabase
        //   .from('persons')
        //   .select('*');
        // 
        // if (fetchError) throw fetchError;
        // const mappedPersons = dbPersons.map(mapDatabasePersonToPerson);
        // setData(mappedPersons);

        // For now, simulate async operation and use mock data
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

        if (options?.mockData) {
          // Convert current AppState persons to DatabasePerson format (for simulation)
          // In real implementation, this would come from Supabase
          const mockDbPersons: DatabasePerson[] = options.mockData.persons.map(person => ({
            id: person.id,
            first_name: person.firstName,
            last_name: person.lastName,
            email: person.email ?? null,
            phone: person.phone ?? null,
            social_security_number: person.social_security_number ?? null,
            birth_year: person.birth_year ?? null,
            birth_date: person.birth_date ?? null,
            street_address: person.streetAddress ?? null,
            postal_code: person.postalCode ?? null,
            city: person.city ?? null,
            is_admin: person.is_admin,
            is_active: person.is_active,
            core_role: person.core_role
          }));

          // Map database format to app format
          const mappedPersons = mockDbPersons.map(mapDatabasePersonToPerson);
          setData(mappedPersons);
        } else {
          // No mock data provided - in production this would be an error
          // but for now return empty array
          setData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch members'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [options?.mockData?.persons]);

  return { data, loading, error };
};
