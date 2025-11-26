export type AssignedPerson = 'team' | 'veeti' | 'alppa';

export const PERSON_CONFIG: Record<AssignedPerson, { label: string; color: string; tailwind: string }> = {
  team: { label: 'Team', color: '#A855F7', tailwind: 'purple' },
  veeti: { label: 'Veeti', color: '#3B82F6', tailwind: 'blue' },
  alppa: { label: 'Alppa', color: '#F97316', tailwind: 'orange' },
};

export const PERSON_OPTIONS = (Object.keys(PERSON_CONFIG) as AssignedPerson[]).map((key) => ({
  value: key,
  label: PERSON_CONFIG[key].label,
  color: PERSON_CONFIG[key].color,
  tailwind: PERSON_CONFIG[key].tailwind,
}));

export function getColorForPerson(person: string | null | undefined): string {
  const key = (person?.toLowerCase() || 'team') as AssignedPerson;
  return PERSON_CONFIG[key]?.color || PERSON_CONFIG.team.color;
}

export function getTailwindForPerson(person: string | null | undefined): string {
  const key = (person?.toLowerCase() || 'team') as AssignedPerson;
  return PERSON_CONFIG[key]?.tailwind || PERSON_CONFIG.team.tailwind;
}
