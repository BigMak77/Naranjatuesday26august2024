// Shared constants for document management

export const LOCATION_REF_CODES: Record<string, string> = {
  'England': 'EN',
  'Wales': 'WA',
  'Poland': 'PL',
  'Group': 'GR'
};

export const LOCATIONS = [
  'England',
  'Wales',
  'Poland',
  'Group'
] as const;

export type Location = typeof LOCATIONS[number];
