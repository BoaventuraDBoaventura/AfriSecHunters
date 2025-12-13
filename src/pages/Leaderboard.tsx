import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { Trophy, Medal, Award, TrendingUp, Bug, DollarSign, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const [hunters, setHunters] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pentester')
      .order('total_points', { ascending: false })
      .limit(50);

    if (!error && data) {
      setHunters(data as Profile[]);
    }
    setLoading(false);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-mono">#{position + 1}</span>;
    }
  };

  const getRankStyles = (position: number) => {
    switch (position) {
      case 0:
        return 'border-yellow-500/50 bg-yellow-500/5';
      case 1:
        return 'border-gray-400/50 bg-gray-400/5';
      case 2:
        return 'border-amber-600/50 bg-amber-600/5';
      default:
        return 'border-border';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-primary text-glow-sm">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Os melhores caçadores de bugs. Encontre vulnerabilidades, ganhe pontos e suba no ranking.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <CyberCard className="text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {hunters[0]?.display_name || '---'}
            </div>
            <div className="text-sm text-muted-foreground">Top Hunter</div>
          </CyberCard>
          <CyberCard className="text-center">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-primary">
              {hunters.reduce((sum, h) => sum + (h.total_points || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total de Pontos</div>
          </CyberCard>
          <CyberCard className="text-center">
            <Bug className="h-8 w-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-secondary">
              {hunters.reduce((sum, h) => sum + (h.vulnerabilities_found || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Bugs Encontrados</div>
          </CyberCard>
        </div>

        {/* Leaderboard Table */}
        <CyberCard glow>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : hunters.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum hunter encontrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Hunter</div>
                <div className="col-span-2 text-right">Pontos</div>
                <div className="col-span-2 text-right">Bugs</div>
                <div className="col-span-2 text-right">Ganhos</div>
              </div>

              {/* Rows */}
              {hunters.map((hunter, index) => (
                <Link
                  key={hunter.id}
                  to={`/hunters/${hunter.id}`}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-4 py-4 rounded-lg border transition-all hover:bg-primary/5 group cursor-pointer",
                    getRankStyles(index)
                  )}
                >
                  <div className="col-span-1 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
                      {hunter.avatar_url ? (
                        <img src={hunter.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                      ) : (
                        <span className="text-primary font-bold">
                          {hunter.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {hunter.display_name || 'Anonymous'}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {hunter.rank_title}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="font-mono font-bold text-primary">
                      {(hunter.total_points || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="font-mono text-muted-foreground">
                      {hunter.vulnerabilities_found || 0}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="font-mono text-primary">
                      MZN {(hunter.total_earnings || 0).toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CyberCard>
      </div>
    </Layout>
  );
}
