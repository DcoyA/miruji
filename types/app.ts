export type Profile = {
  id: string;
  auth_user_id: string;
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
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
};

export type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  assigned_member_id: string | null;
  verification_type: string;
  reward_points: number;
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
};

export type ActiveTab = "calendar" | "missions" | "rewards" | "settings";
