import { useMemo } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Profile, Program, Report } from '@/types/database';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Bug, Users, FileText, Target } from 'lucide-react';

interface AdminAnalyticsProps {
  users: Profile[];
  programs: Program[];
  reports: Report[];
}

const COLORS = {
  primary: '#00FF41',
  secondary: '#00D4FF',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#6B7280',
};

const SEVERITY_COLORS = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
};

const STATUS_COLORS = {
  pending: '#6B7280',
  in_review: '#3B82F6',
  accepted: '#22C55E',
  rejected: '#EF4444',
  paid: '#00FF41',
};

export function AdminAnalytics({ users, programs, reports }: AdminAnalyticsProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const hunters = users.filter(u => u.role === 'pentester');
    const companies = users.filter(u => u.role === 'company');
    const activePrograms = programs.filter(p => p.is_active);
    const totalEarnings = users.reduce((sum, u) => sum + (u.total_earnings || 0), 0);
    const totalBugs = users.reduce((sum, u) => sum + (u.vulnerabilities_found || 0), 0);
    const acceptedReports = reports.filter(r => r.status === 'accepted' || r.status === 'paid');
    const paidReports = reports.filter(r => r.status === 'paid');
    const totalPaid = paidReports.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

    return {
      totalUsers: users.length,
      hunters: hunters.length,
      companies: companies.length,
      totalPrograms: programs.length,
      activePrograms: activePrograms.length,
      totalReports: reports.length,
      acceptedReports: acceptedReports.length,
      totalEarnings,
      totalBugs,
      totalPaid,
      avgRewardPerBug: acceptedReports.length > 0 ? totalPaid / acceptedReports.length : 0,
    };
  }, [users, programs, reports]);

  // Reports by status
  const reportsByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    reports.forEach(r => {
      const status = r.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || COLORS.muted,
    }));
  }, [reports]);

  // Reports by severity
  const reportsBySeverity = useMemo(() => {
    const severityCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    reports.forEach(r => {
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
    });
    return Object.entries(severityCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: SEVERITY_COLORS[name as keyof typeof SEVERITY_COLORS],
    }));
  }, [reports]);

  // Reports over time (last 30 days)
  const reportsOverTime = useMemo(() => {
    const last30Days: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      last30Days[key] = 0;
    }

    reports.forEach(r => {
      const date = r.created_at.split('T')[0];
      if (last30Days[date] !== undefined) {
        last30Days[date]++;
      }
    });

    return Object.entries(last30Days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      reports: count,
    }));
  }, [reports]);

  // Top hunters
  const topHunters = useMemo(() => {
    return users
      .filter(u => u.role === 'pentester')
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .slice(0, 5)
      .map(h => ({
        name: h.display_name || 'Anônimo',
        points: h.total_points || 0,
        bugs: h.vulnerabilities_found || 0,
        earnings: h.total_earnings || 0,
      }));
  }, [users]);

  // User distribution
  const userDistribution = useMemo(() => [
    { name: 'Hunters', value: stats.hunters, color: COLORS.primary },
    { name: 'Empresas', value: stats.companies, color: COLORS.secondary },
  ], [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-foreground font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <CyberCard className="text-center p-4">
          <Users className="h-6 w-6 text-primary mx-auto mb-2" />
          <div className="text-xl font-bold font-mono text-primary">{stats.hunters}</div>
          <div className="text-xs text-muted-foreground">Hunters</div>
        </CyberCard>
        <CyberCard className="text-center p-4">
          <FileText className="h-6 w-6 text-secondary mx-auto mb-2" />
          <div className="text-xl font-bold font-mono text-secondary">{stats.companies}</div>
          <div className="text-xs text-muted-foreground">Empresas</div>
        </CyberCard>
        <CyberCard className="text-center p-4">
          <Target className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <div className="text-xl font-bold font-mono text-yellow-500">{stats.activePrograms}</div>
          <div className="text-xs text-muted-foreground">Programas Ativos</div>
        </CyberCard>
        <CyberCard className="text-center p-4">
          <Bug className="h-6 w-6 text-orange-500 mx-auto mb-2" />
          <div className="text-xl font-bold font-mono text-orange-500">{stats.totalBugs}</div>
          <div className="text-xs text-muted-foreground">Bugs Encontrados</div>
        </CyberCard>
        <CyberCard className="text-center p-4">
          <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <div className="text-xl font-bold font-mono text-green-500">{stats.acceptedReports}</div>
          <div className="text-xs text-muted-foreground">Reports Aceitos</div>
        </CyberCard>
        <CyberCard className="text-center p-4">
          <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
          <div className="text-xl font-bold font-mono text-primary">
            MZN {stats.totalPaid.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">Total Pago</div>
        </CyberCard>
      </div>

      {/* Charts Row 1 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reports by Status */}
        <CyberCard className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Reports por Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {reportsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Reports by Severity */}
        <CyberCard className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Reports por Severidade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsBySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {reportsBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* User Distribution */}
        <CyberCard className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Distribuição de Usuários</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reports Over Time */}
        <CyberCard className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Reports (Últimos 30 dias)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportsOverTime}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                  interval={4}
                />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="reports" 
                  stroke={COLORS.primary} 
                  fillOpacity={1} 
                  fill="url(#colorReports)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>

        {/* Top Hunters */}
        <CyberCard className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Hunters</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topHunters} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="points" name="Pontos" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="bugs" name="Bugs" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CyberCard>
      </div>

      {/* Summary Stats */}
      <CyberCard className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumo da Plataforma</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-2xl font-bold font-mono text-primary">{stats.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total de Usuários</div>
          </div>
          <div className="text-center p-4 bg-secondary/5 rounded-lg border border-secondary/20">
            <div className="text-2xl font-bold font-mono text-secondary">{stats.totalPrograms}</div>
            <div className="text-sm text-muted-foreground">Total de Programas</div>
          </div>
          <div className="text-center p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
            <div className="text-2xl font-bold font-mono text-yellow-500">{stats.totalReports}</div>
            <div className="text-sm text-muted-foreground">Total de Reports</div>
          </div>
          <div className="text-center p-4 bg-green-500/5 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold font-mono text-green-500">
              MZN {stats.avgRewardPerBug.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Média por Bug</div>
          </div>
        </div>
      </CyberCard>
    </div>
  );
}
