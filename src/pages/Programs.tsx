import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { supabase } from '@/integrations/supabase/client';
import { Program, Profile } from '@/types/database';
import { Search, Building2, DollarSign, ExternalLink } from 'lucide-react';

export default function Programs() {
  const [programs, setPrograms] = useState<(Program & { company: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        company:profiles!programs_company_id_fkey(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPrograms(data as (Program & { company: Profile })[]);
    }
    setLoading(false);
  };

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(search.toLowerCase()) ||
    program.company?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-primary text-glow-sm">Programas</span> de Bug Bounty
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore os programas disponíveis, escolha seu alvo e comece a caçar vulnerabilidades.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar programas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <CyberCard key={i} className="animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded mb-2 w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CyberCard>
            ))}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search ? 'Nenhum programa encontrado.' : 'Nenhum programa disponível no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <Link key={program.id} to={`/programs/${program.id}`}>
                <CyberCard className="h-full">
                  {/* Company Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                      {program.company?.company_logo ? (
                        <img src={program.company.company_logo} alt="" className="h-8 w-8 rounded" />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{program.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {program.company?.company_name || 'Empresa'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {program.description || 'Sem descrição disponível.'}
                  </p>

                  {/* Rewards */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <DollarSign className="h-4 w-4" />
                      Recompensas
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <SeverityBadge severity="low" className="text-[10px] py-0.5 px-2" />
                        <span className="text-muted-foreground">MZN {program.reward_low?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <SeverityBadge severity="medium" className="text-[10px] py-0.5 px-2" />
                        <span className="text-muted-foreground">MZN {program.reward_medium?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <SeverityBadge severity="high" className="text-[10px] py-0.5 px-2" />
                        <span className="text-muted-foreground">MZN {program.reward_high?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <SeverityBadge severity="critical" className="text-[10px] py-0.5 px-2" />
                        <span className="text-muted-foreground">MZN {program.reward_critical?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* View Button */}
                  <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/10">
                    Ver Programa
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CyberCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
