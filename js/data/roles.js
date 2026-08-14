export const ROLE_GROUPS = [
  {
    name: 'Leitung',
    roles: [
      { key: 'owner', label: 'Owner', rank: 100, filled: true },
      { key: 'co_owner', label: 'Co-Owner', rank: 95 },
      { key: 'project_management', label: 'Projektmanagement', rank: 90 },
      { key: 'leadership', label: 'Führungskraft', rank: 88 },
      { key: 'teamlead', label: 'Teamleitung', rank: 85 },
    ],
  },
  {
    name: 'Human Resources',
    roles: [
      { key: 'hr_lead', label: 'HR-Leitung', rank: 80 },
      { key: 'hr_manager', label: 'HR-Manager', rank: 76 },
      { key: 'hr_staff', label: 'HR-Mitarbeiter', rank: 72 },
    ],
  },
  {
    name: 'Administration',
    roles: [
      { key: 'head_admin', label: 'Head of Administration', rank: 78 },
      { key: 'lead_admin', label: 'Leitender Administrator', rank: 74 },
      { key: 'senior_admin', label: 'Senior Administrator', rank: 70 },
      { key: 'admin', label: 'Administrator', rank: 66 },
      { key: 'junior_admin', label: 'Junior Administrator', rank: 62 },
      { key: 'test_admin', label: 'Test Administrator', rank: 58 },
    ],
  },
  {
    name: 'Moderation',
    roles: [
      { key: 'head_mod', label: 'Head of Moderation', rank: 56 },
      { key: 'senior_mod', label: 'Senior Moderator', rank: 52 },
      { key: 'moderator', label: 'Moderator', rank: 48 },
      { key: 'junior_mod', label: 'Junior Moderator', rank: 44 },
      { key: 'test_mod', label: 'Test Moderator', rank: 40 },
    ],
  },
  {
    name: 'Support',
    roles: [
      { key: 'head_support', label: 'Head of Support', rank: 38 },
      { key: 'senior_support', label: 'Senior Supporter', rank: 34 },
      { key: 'supporter', label: 'Supporter', rank: 30 },
      { key: 'junior_support', label: 'Junior Supporter', rank: 26 },
      { key: 'test_support', label: 'Support in Ausbildung', rank: 20 },
    ],
  },
];

export const PUBLIC_TEAM = [
  {
    discordName: 'vibevisionde',
    robloxName: 'Idk765433454',
    role: 'Owner',
    roleKey: 'owner',
    status: 'active',
  },
];

export const ALL_ROLES = ROLE_GROUPS.flatMap(group => group.roles.map(role => ({ ...role, group: group.name })));

export function roleByKey(key) {
  return ALL_ROLES.find(role => role.key === key) || { key: 'player', label: 'Spieler', rank: 0, group: 'Spieler' };
}
