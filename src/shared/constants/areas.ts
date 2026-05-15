export const AREAS = [
  'Leads Hogar',
  'SAC',
  'Retencion',
  'Empresas y Horeca'
] as const;

export type AreaName = typeof AREAS[number];