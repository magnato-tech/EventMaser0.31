/**
 * Type definitions for Dashboard components
 */

export interface AgeGroup {
  label: string;
  min: number;
  max: number;
}

export interface DemographicGroup extends AgeGroup {
  women: number;
  men: number;
  total: number;
}

export interface MapPoint {
  postalCode: string;
  count: number;
  x: number;
  y: number;
}

export interface PostalCodeCount {
  [postalCode: string]: number;
}
