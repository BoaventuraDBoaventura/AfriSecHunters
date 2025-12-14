import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Report, SeverityLevel } from '@/types/database';
import { CertificateCard } from '@/components/certificates/CertificateCard';
import { 
  User, 
  Trophy, 
  Bug, 
  DollarSign, 
  Calendar,
  Shield,
  Zap,
  Target,
  Award,
  Star,
  Flame,
  Crown,
  Skull,
  Eye,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  earned: boolean;
}

interface MonthlyStats {
  month: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface Certificate {
  id: string;
  pentester_id: string;
  rank_title: string;
  points_at_issue: number;
  issued_at: string;
  certificate_code: string;
}

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{
    totalReports: number;
    acceptedReports: number;
    severityCounts: Record<SeverityLevel, number>;
  } | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    // Fetch profile
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && profileData) {
      setProfile(profileData as Profile);

      // Fetch report stats usando função segura que bypassa RLS
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_hunter_public_stats', { hunter_id: id });

      if (!statsError && statsData) {
        const data = statsData as { 
          total_reports: number; 
          accepted_reports: number; 
          severity_counts: Record<SeverityLevel, number> 
        };
        setStats({
          totalReports: data.total_reports,
          acceptedReports: data.accepted_reports,
          severityCounts: data.severity_counts,
        });
      }

      // Fetch monthly stats para o gráfico
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_hunter_monthly_stats', { hunter_id: id });

      if (!monthlyError && monthlyData && Array.isArray(monthlyData)) {
        // Ordenar do mais antigo para o mais recente e formatar mês
        const formatted = (monthlyData as unknown as MonthlyStats[])
          .sort((a, b) => a.month.localeCompare(b.month))
          .map(item => ({
            ...item,
            month: new Date(item.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          }));
        setMonthlyStats(formatted);
      }

      // Fetch certificates
      const { data: certData } = await supabase
        .from('rank_certificates')
        .select('*')
        .eq('pentester_id', id)
        .order('issued_at', { ascending: false });

      if (certData) {
        setCertificates(certData as Certificate[]);
      }
    }
    setLoading(false);
  };

  const getBadges = (): Badge[] => {
    if (!profile || !stats) return [];

    return [
      {
        id: 'first-blood',
        name: 'First Blood',
        description: 'Primeiro bug reportado',
        icon: <Skull className="h-6 w-6" />,
        color: 'text-destructive',
        earned: stats.totalReports >= 1,
      },
      {
        id: 'bug-hunter',
        name: 'Bug Hunter',
        description: '10 vulnerabilidades encontradas',
        icon: <Bug className="h-6 w-6" />,
        color: 'text-primary',
        earned: (profile.vulnerabilities_found || 0) >= 10,
      },
      {
        id: 'critical-finder',
        name: 'Critical Finder',
        description: 'Encontrou vulnerabilidade crítica',
        icon: <Flame className="h-6 w-6" />,
        color: 'text-severity-critical',
        earned: stats.severityCounts.critical >= 1,
      },
      {
        id: 'high-striker',
        name: 'High Striker',
        description: '5 vulnerabilidades high+',
        icon: <Zap className="h-6 w-6" />,
        color: 'text-severity-high',
        earned: stats.severityCounts.high + stats.severityCounts.critical >= 5,
      },
      {
        id: 'consistent',
        name: 'Consistent',
        description: '25 relatórios aceitos',
        icon: <Target className="h-6 w-6" />,
        color: 'text-secondary',
        earned: stats.acceptedReports >= 25,
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: '50 vulnerabilidades encontradas',
        icon: <Shield className="h-6 w-6" />,
        color: 'text-accent',
        earned: (profile.vulnerabilities_found || 0) >= 50,
      },
      {
        id: 'elite',
        name: 'Elite Hunter',
        description: '100+ vulnerabilidades',
        icon: <Crown className="h-6 w-6" />,
        color: 'text-warning',
        earned: (profile.vulnerabilities_found || 0) >= 100,
      },
      {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'MZN 5.000.000+ em recompensas',
        icon: <DollarSign className="h-6 w-6" />,
        color: 'text-primary',
        earned: (profile.total_earnings || 0) >= 5000000,
      },
    ];
  };

  const getRankProgress = () => {
    const points = profile?.total_points || 0;
    const ranks = [
      { name: 'Novato', min: 0 },
      { name: 'Iniciante', min: 100 },
      { name: 'Intermediário', min: 500 },
      { name: 'Avançado', min: 1000 },
      { name: 'Expert', min: 2500 },
      { name: 'Master', min: 5000 },
      { name: 'Elite Hunter', min: 10000 },
      { name: 'Legend', min: 25000 },
    ];

    const currentRankIndex = ranks.findIndex((r, i) => {
      const nextRank = ranks[i + 1];
      return !nextRank || points < nextRank.min;
    });

    const currentRank = ranks[currentRankIndex];
    const nextRank = ranks[currentRankIndex + 1];

    const progress = nextRank 
      ? ((points - currentRank.min) / (nextRank.min - currentRank.min)) * 100
      : 100;

    return { currentRank, nextRank, progress, points };
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-32 bg-muted rounded-lg" />
              <div className="h-32 bg-muted rounded-lg" />
              <div className="h-32 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">Perfil não encontrado.</p>
          <Link to="/leaderboard">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Leaderboard
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const badges = getBadges();
  const earnedBadges = badges.filter(b => b.earned);
  const rankInfo = getRankProgress();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Link to="/leaderboard">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Leaderboard
          </Button>
        </Link>

        {/* Profile Header */}
        <CyberCard glow className="mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-primary/20 border-4 border-primary/50 flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-primary" />
                )}
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground">
                {profile.display_name || 'Anonymous Hunter'}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-primary font-mono text-lg">{profile.rank_title}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{profile.total_points || 0} pontos</span>
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mt-4 max-w-2xl">{profile.bio}</p>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  {profile.skills.map((skill, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/30 font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground justify-center md:justify-start">
                <Calendar className="h-4 w-4" />
                Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-3xl font-bold font-mono text-foreground">
                  {profile.vulnerabilities_found || 0}
                </div>
                <div className="text-xs text-muted-foreground">Bugs</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-primary">
                  MZN {((profile.total_earnings || 0) / 1000).toFixed(0)}k
                </div>
                <div className="text-xs text-muted-foreground">Ganhos</div>
              </div>
              <div>
                <div className="text-3xl font-bold font-mono text-warning">
                  {earnedBadges.length}
                </div>
                <div className="text-xs text-muted-foreground">Badges</div>
              </div>
            </div>
          </div>
        </CyberCard>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats by Severity */}
            <CyberCard>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                Vulnerabilidades por Severidade
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
                  const count = stats?.severityCounts[severity] || 0;
                  return (
                    <div 
                      key={severity}
                      className={cn(
                        "p-4 rounded-lg border text-center",
                        severity === 'critical' && "bg-severity-critical/10 border-severity-critical/30",
                        severity === 'high' && "bg-severity-high/10 border-severity-high/30",
                        severity === 'medium' && "bg-severity-medium/10 border-severity-medium/30",
                        severity === 'low' && "bg-severity-low/10 border-severity-low/30",
                      )}
                    >
                      <div className={cn(
                        "text-3xl font-bold font-mono",
                        `text-severity-${severity}`
                      )}>
                        {count}
                      </div>
                      <SeverityBadge severity={severity} className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </CyberCard>

            {/* Evolution Chart */}
            {monthlyStats.length > 0 && (
              <CyberCard>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Evolução ao Longo do Tempo
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyStats}>
                      <defs>
                        <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--severity-critical))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--severity-critical))" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--severity-high))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--severity-high))" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--severity-medium))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--severity-medium))" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--severity-low))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--severity-low))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="critical" 
                        name="Critical"
                        stackId="1"
                        stroke="hsl(var(--severity-critical))" 
                        fill="url(#colorCritical)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="high" 
                        name="High"
                        stackId="1"
                        stroke="hsl(var(--severity-high))" 
                        fill="url(#colorHigh)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="medium" 
                        name="Medium"
                        stackId="1"
                        stroke="hsl(var(--severity-medium))" 
                        fill="url(#colorMedium)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="low" 
                        name="Low"
                        stackId="1"
                        stroke="hsl(var(--severity-low))" 
                        fill="url(#colorLow)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CyberCard>
            )}

            {/* Badges */}
            <CyberCard>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-warning" />
                Conquistas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <div 
                    key={badge.id}
                    className={cn(
                      "p-4 rounded-lg border text-center transition-all",
                      badge.earned 
                        ? "bg-card border-primary/50 box-glow-sm" 
                        : "bg-muted/50 border-border opacity-40 grayscale"
                    )}
                  >
                    <div className={cn(
                      "mx-auto mb-2",
                      badge.earned ? badge.color : "text-muted-foreground"
                    )}>
                      {badge.icon}
                    </div>
                    <div className={cn(
                      "font-semibold text-sm",
                      badge.earned ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {badge.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </div>
                  </div>
                ))}
              </div>
            </CyberCard>

            {/* Certificates */}
            {certificates.length > 0 && (
              <CyberCard>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                  Certificados de Ranking
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <CertificateCard
                      key={cert.id}
                      id={cert.id}
                      pentesterName={profile.display_name || 'Hunter'}
                      rankTitle={cert.rank_title}
                      points={cert.points_at_issue}
                      issuedAt={cert.issued_at}
                      certificateCode={cert.certificate_code}
                    />
                  ))}
                </div>
              </CyberCard>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Rank Progress */}
            <CyberCard glow>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" />
                Progresso de Rank
              </h3>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary text-glow">
                  {rankInfo.currentRank.name}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {rankInfo.points} pontos
                </div>
              </div>
              
              {rankInfo.nextRank && (
                <>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(rankInfo.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{rankInfo.currentRank.min}</span>
                    <span className="text-primary">{rankInfo.nextRank.name}</span>
                    <span>{rankInfo.nextRank.min}</span>
                  </div>
                </>
              )}
            </CyberCard>

            {/* Stats Summary */}
            <CyberCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Resumo
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total de Relatórios</span>
                  <span className="font-mono font-bold text-foreground">{stats?.totalReports || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Relatórios Aceitos</span>
                  <span className="font-mono font-bold text-success">{stats?.acceptedReports || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa de Aceitação</span>
                  <span className="font-mono font-bold text-primary">
                    {stats?.totalReports ? Math.round((stats.acceptedReports / stats.totalReports) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="text-muted-foreground">Total Ganho</span>
                  <span className="font-mono font-bold text-primary text-lg">
                    MZN {(profile.total_earnings || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CyberCard>
          </div>
        </div>
      </div>
    </Layout>
  );
}
