export type UserRole = 'pentester' | 'company' | 'admin';
export type ReportStatus = 'pending' | 'in_review' | 'accepted' | 'rejected' | 'paid';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type VulnerabilityType = 
  | 'xss' 
  | 'sql_injection' 
  | 'idor' 
  | 'ssrf' 
  | 'auth_bypass' 
  | 'rce' 
  | 'info_disclosure'
  | 'csrf'
  | 'open_redirect'
  | 'business_logic'
  | 'dos'
  | 'other';

export type PayoutMethod = 'bank_transfer' | 'mpesa' | 'emola' | 'paypal';

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
  is_archived: boolean;
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
  evidence_urls: string[] | null;
  status: ReportStatus;
  reward_amount: number | null;
  created_at: string;
  updated_at: string;
  program?: Program;
  pentester?: Profile;
}

export interface ReportStatusHistory {
  id: string;
  report_id: string;
  old_status: ReportStatus | null;
  new_status: ReportStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
  changed_by_profile?: Profile;
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
  idor: 'Referência Direta Insegura (IDOR)',
  ssrf: 'Server-Side Request Forgery (SSRF)',
  auth_bypass: 'Bypass de Autenticação',
  rce: 'Execução Remota de Código (RCE)',
  info_disclosure: 'Divulgação de Informação',
  csrf: 'Cross-Site Request Forgery (CSRF)',
  open_redirect: 'Redirecionamento Aberto',
  business_logic: 'Falha de Lógica de Negócio',
  dos: 'Negação de Serviço (DoS)',
  other: 'Outro',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pendente',
  in_review: 'Em Análise',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  paid: 'Pago',
};

// CVSS Scores by severity (estimated ranges)
export const CVSS_RANGES: Record<SeverityLevel, { min: number; max: number; label: string }> = {
  low: { min: 0.1, max: 3.9, label: '0.1 - 3.9' },
  medium: { min: 4.0, max: 6.9, label: '4.0 - 6.9' },
  high: { min: 7.0, max: 8.9, label: '7.0 - 8.9' },
  critical: { min: 9.0, max: 10.0, label: '9.0 - 10.0' },
};