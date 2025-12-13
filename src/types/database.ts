export type UserRole = 'pentester' | 'company' | 'admin';
export type ReportStatus = 'pending' | 'in_review' | 'accepted' | 'rejected' | 'paid';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type VulnerabilityType = 'xss' | 'sql_injection' | 'idor' | 'ssrf' | 'auth_bypass' | 'rce' | 'other';

export type PayoutMethod = 'bank_transfer' | 'mpesa' | 'paypal';

export interface PayoutDetails {
  [key: string]: string | undefined;
  bank_name?: string;
  account_number?: string;
  nib?: string;
  phone_number?: string;
  paypal_email?: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_name: string | null;
  company_logo: string | null;
  company_website: string | null;
  skills: string[] | null;
  total_earnings: number;
  total_points: number;
  vulnerabilities_found: number;
  rank_title: string;
  is_verified: boolean;
  payout_method: PayoutMethod | null;
  payout_details: PayoutDetails | null;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  scope: string[] | null;
  out_of_scope: string[] | null;
  rules: string | null;
  reward_low: number;
  reward_medium: number;
  reward_high: number;
  reward_critical: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: Profile;
}

export interface Report {
  id: string;
  program_id: string;
  pentester_id: string;
  title: string;
  vulnerability_type: VulnerabilityType;
  severity: SeverityLevel;
  description: string;
  steps_to_reproduce: string | null;
  impact: string | null;
  recommendation: string | null;
  proof_of_concept: string | null;
  status: ReportStatus;
  reward_amount: number | null;
  created_at: string;
  updated_at: string;
  program?: Program;
  pentester?: Profile;
}

export interface Message {
  id: string;
  report_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export const VULNERABILITY_LABELS: Record<VulnerabilityType, string> = {
  xss: 'Cross-Site Scripting (XSS)',
  sql_injection: 'SQL Injection',
  idor: 'Insecure Direct Object Reference (IDOR)',
  ssrf: 'Server-Side Request Forgery (SSRF)',
  auth_bypass: 'Authentication Bypass',
  rce: 'Remote Code Execution (RCE)',
  other: 'Other',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  paid: 'Paid',
};
