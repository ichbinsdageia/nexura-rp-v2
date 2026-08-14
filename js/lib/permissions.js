import { roleByKey } from '../data/roles.js';

export const BRANCHES = Object.freeze({
  leadership: ['teamlead', 'leadership', 'project_management', 'co_owner', 'owner'],
  hr: ['hr_staff', 'hr_manager', 'hr_lead'],
  administration: ['test_admin', 'junior_admin', 'admin', 'senior_admin', 'lead_admin', 'head_admin'],
  moderation: ['test_mod', 'junior_mod', 'moderator', 'senior_mod', 'head_mod'],
  support: ['test_support', 'junior_support', 'supporter', 'senior_support', 'head_support'],
});

export const PERMISSIONS = {
  player: ['own_record', 'own_submissions', 'own_appeals'],
  test_support: ['create_player_entry', 'read_basic_submissions'],
  junior_support: ['create_player_entry', 'read_basic_submissions'],
  supporter: ['create_player_entry', 'read_basic_submissions'],
  senior_support: ['create_player_entry', 'read_basic_submissions'],
  head_support: ['create_player_entry', 'read_basic_submissions', 'manage_support', 'manage_public_ideas'],
  test_mod: ['create_player_entry', 'read_player_records', 'score_violations'],
  junior_mod: ['create_player_entry', 'read_player_records', 'score_violations'],
  moderator: ['create_player_entry', 'read_player_records', 'score_violations'],
  senior_mod: ['create_player_entry', 'read_player_records', 'score_violations'],
  head_mod: ['create_player_entry', 'read_player_records', 'score_violations', 'manage_moderation'],
  test_admin: ['manage_player_records', 'manage_sanctions', 'prepare_account_links', 'manage_sessions_draft', 'manage_team_records', 'propose_promotions', 'propose_rules', 'manage_gangs', 'manage_projects'],
  junior_admin: ['manage_player_records', 'manage_sanctions', 'prepare_account_links', 'manage_sessions_draft', 'manage_team_records', 'propose_promotions', 'propose_rules', 'manage_gangs', 'manage_projects'],
  admin: ['manage_player_records', 'manage_sanctions', 'prepare_account_links', 'manage_sessions_draft', 'review_appeals', 'manage_team_records', 'propose_promotions', 'propose_rules', 'manage_gangs', 'manage_projects'],
  senior_admin: ['manage_player_records', 'manage_sanctions', 'prepare_account_links', 'manage_sessions_draft', 'review_appeals', 'manage_team_records', 'propose_promotions', 'propose_rules', 'manage_gangs', 'manage_projects'],
  lead_admin: ['manage_player_records', 'manage_sanctions', 'prepare_account_links', 'manage_sessions_draft', 'review_appeals', 'manage_team_records', 'propose_promotions', 'propose_rules', 'manage_gangs', 'manage_projects'],
  head_admin: ['manage_player_records', 'manage_sanctions', 'prepare_account_links', 'manage_sessions_draft', 'review_appeals', 'manage_team_records', 'propose_promotions', 'propose_rules', 'manage_gangs', 'manage_projects'],
  hr_staff: ['manage_applications', 'manage_team_records', 'manage_absences', 'propose_promotions', 'propose_rules', 'manage_projects'],
  hr_manager: ['manage_applications', 'manage_team_records', 'manage_absences', 'propose_promotions', 'propose_rules', 'manage_projects'],
  hr_lead: ['manage_applications', 'manage_team_records', 'manage_absences', 'propose_promotions', 'propose_rules', 'manage_projects'],
  teamlead: ['approve_sanctions', 'decide_appeals', 'approve_sessions', 'approve_account_links', 'decide_applications', 'manage_team_records', 'approve_promotions', 'manage_rules_draft', 'reset_admin_mfa', 'manage_projects', 'manage_gangs'],
  leadership: ['approve_sanctions', 'decide_appeals', 'approve_sessions', 'approve_account_links', 'decide_applications', 'manage_team_records', 'approve_promotions', 'manage_rules_draft', 'manage_projects', 'manage_gangs'],
  project_management: ['approve_sanctions', 'decide_appeals', 'approve_sessions', 'approve_account_links', 'decide_applications', 'manage_team_records', 'approve_promotions', 'manage_rules_draft', 'manage_content', 'manage_projects', 'manage_gangs'],
  co_owner: ['*'],
  owner: ['*'],
};

export function hasPermission(roleKey, permission) {
  if (permission === 'self_workflows' && isTeam(roleKey)) return true;
  const own = PERMISSIONS[roleKey] || PERMISSIONS.player;
  return own.includes('*') || own.includes(permission);
}

export function inBranch(roleKey, branch, includeLeadership = true) {
  const roles = BRANCHES[branch] || [];
  return roles.includes(roleKey) || (includeLeadership && BRANCHES.leadership.includes(roleKey));
}

export function isOwner(roleKey) { return roleKey === 'owner'; }
export function isLeadership(roleKey) { return BRANCHES.leadership.includes(roleKey); }
export function isTeam(roleKey) { return roleByKey(roleKey).rank >= 20; }
export function requiresMfa(roleKey) { return BRANCHES.administration.includes(roleKey) || BRANCHES.leadership.includes(roleKey); }
