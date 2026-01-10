/**
 * Constants and shared data for Dashboard components
 */

// Geographic coordinates for postal codes in Kristiansand area
export const GEO_COORDS: Record<string, { x: number; y: number }> = {
  "4600": { x: 45, y: 40 }, "4601": { x: 46, y: 41 }, "4602": { x: 44, y: 39 },
  "4603": { x: 47, y: 42 }, "4604": { x: 43, y: 38 }, "4605": { x: 48, y: 43 },
  "4608": { x: 42, y: 45 }, "4609": { x: 41, y: 46 }, "4610": { x: 50, y: 50 },
  "4611": { x: 49, y: 49 }, "4612": { x: 51, y: 51 }, "4613": { x: 48, y: 48 },
  "4614": { x: 52, y: 52 }, "4615": { x: 47, y: 47 }, "4616": { x: 53, y: 53 },
  "4617": { x: 46, y: 46 }, "4618": { x: 54, y: 54 }, "4619": { x: 45, y: 45 },
  "4620": { x: 50, y: 50 }, "4621": { x: 45, y: 55 }, "4622": { x: 40, y: 50 },
  "4623": { x: 55, y: 45 }, "4624": { x: 50, y: 40 }, "4625": { x: 50, y: 60 },
  "4626": { x: 35, y: 50 }, "4627": { x: 60, y: 50 }, "4628": { x: 50, y: 35 },
  "4629": { x: 50, y: 65 }, "4630": { x: 48, y: 52 }, "4631": { x: 49, y: 53 },
  "4632": { x: 47, y: 51 }, "4633": { x: 50, y: 54 }, "4634": { x: 46, y: 50 },
  "4635": { x: 51, y: 55 }, "4636": { x: 45, y: 49 }, "4637": { x: 52, y: 56 },
  "4638": { x: 44, y: 48 }, "4639": { x: 53, y: 57 }, "4640": { x: 43, y: 47 },
  "4641": { x: 42, y: 46 }, "4642": { x: 41, y: 45 }, "4643": { x: 40, y: 44 },
  "4644": { x: 39, y: 43 }, "4645": { x: 38, y: 42 }, "4660": { x: 35, y: 60 },
  "4661": { x: 36, y: 61 }, "4662": { x: 34, y: 59 }, "4663": { x: 37, y: 62 },
  "4664": { x: 33, y: 58 }, "4665": { x: 38, y: 63 }, "4670": { x: 30, y: 65 },
  "4671": { x: 31, y: 66 }, "4672": { x: 29, y: 64 }, "4680": { x: 25, y: 70 },
  "4681": { x: 26, y: 71 }, "4682": { x: 24, y: 69 }, "4683": { x: 27, y: 72 },
  "4684": { x: 23, y: 68 }, "4685": { x: 28, y: 73 }, "4686": { x: 22, y: 67 },
  "4687": { x: 29, y: 74 }, "4690": { x: 20, y: 75 }, "4691": { x: 21, y: 76 },
  "4692": { x: 19, y: 74 }, "4693": { x: 22, y: 77 }, "4694": { x: 18, y: 73 },
  "4695": { x: 23, y: 78 }, "4696": { x: 17, y: 72 }, "4697": { x: 24, y: 79 },
  "4698": { x: 16, y: 71 }, "4699": { x: 25, y: 80 }
} as const;

// Age group definitions for demographic analysis
export const AGE_GROUPS = [
  { label: '60+', min: 60, max: 999 },
  { label: '40-60', min: 40, max: 59 },
  { label: '20-40', min: 20, max: 39 },
  { label: '0-20', min: 0, max: 19 }
] as const;

// Known female first names (used for gender heuristics)
export const FEMALE_FIRST_NAMES = [
  'lise', 'vigdis', 'beate', 'frida', 'mille', 'thea', 'tiril'
] as const;

// Map visualization constants
export const MAP_HEAT_MIN_SIZE = 20;
export const MAP_HEAT_MAX_SIZE = 60;
export const MAP_HEAT_MIN_INTENSITY = 0.3;
export const MAP_HEAT_MAX_INTENSITY = 0.8;
