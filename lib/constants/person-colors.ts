export type AssignedPerson = 'team' | 'veeti' | 'alppa' | 'ilari';

export const PERSON_CONFIG: Record<AssignedPerson, { label: string; color: string; tailwind: string }> = {
  team: { label: 'Team', color: '#A855F7', tailwind: 'purple' },
  veeti: { label: 'Veeti', color: '#3B82F6', tailwind: 'blue' },
  alppa: { label: 'Alppa', color: '#F97316', tailwind: 'orange' },
  ilari: { label: 'Ilari', color: '#10B981', tailwind: 'emerald' },
};

// Organization-specific team members
const ORG_TEAM_MEMBERS: Record<string, AssignedPerson[]> = {
  'funect': ['team', 'veeti', 'alppa'],
  '77-football': ['team', 'ilari', 'alppa'],
};

// Default options (all people) - for backwards compatibility
export const PERSON_OPTIONS = (Object.keys(PERSON_CONFIG) as AssignedPerson[]).map((key) => ({
  value: key,
  label: PERSON_CONFIG[key].label,
  color: PERSON_CONFIG[key].color,
  tailwind: PERSON_CONFIG[key].tailwind,
}));

// Get person options for a specific organization
export function getPersonOptionsForOrg(orgSlug: string) {
  const members = ORG_TEAM_MEMBERS[orgSlug] || ['team', 'alppa'];
  return members.map((key) => ({
    value: key,
    label: PERSON_CONFIG[key].label,
    color: PERSON_CONFIG[key].color,
    tailwind: PERSON_CONFIG[key].tailwind,
  }));
}

export function getColorForPerson(person: string | null | undefined): string {
  const key = (person?.toLowerCase() || 'team') as AssignedPerson;
  return PERSON_CONFIG[key]?.color || PERSON_CONFIG.team.color;
}

export function getTailwindForPerson(person: string | null | undefined): string {
  const key = (person?.toLowerCase() || 'team') as AssignedPerson;
  return PERSON_CONFIG[key]?.tailwind || PERSON_CONFIG.team.tailwind;
}
