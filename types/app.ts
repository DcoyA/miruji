export type Profile = {
  id: string;
  auth_user_id: string;
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
  recovery_email: string | null;
};

export type WorkspaceInvite = {
  id: string;
  invite_code: string;
  role: string;
  suggested_name: string | null;
  status: string;
  expires_at: string;
};

export type Workspace = {
  id: string;
  name: string;
  description: string | null;
};

export type Member = {
  id: string;
  profile_id: string | null;
  display_name: string;
  role: string;
  is_virtual: boolean;
  requires_account: boolean;
  status: string;
  avatar_url: string | null;
};

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  due_time: string | null;
  assigned_member_id: string | null;
  verification_type: string;
  reward_points: number;
  template_id: string | null;
  created_by_member_id: string | null;
  evidence_url: string | null;
  evidence_text: string | null;
};

export type TaskTemplate = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  assigned_member_id: string | null;
  verification_type: string;
  reward_points: number;
  rollover_enabled: boolean;
  repeat_type: string;
  repeat_weekdays: number[];
  is_active: boolean;
  due_time: string | null;
};

export type Reward = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  requested_by_member_id: string | null;
  target_member_id: string | null;
  cost_points: number;
  status: string;
};

export type RewardTransaction = {
  id: string;
  member_id: string;
  amount: number;
  transaction_type: string;
  source_type: string;
  source_id: string | null;
  memo: string | null;
  created_at: string;
};

export type ActiveTab = "calendar" | "missions" | "rewards" | "settings";
