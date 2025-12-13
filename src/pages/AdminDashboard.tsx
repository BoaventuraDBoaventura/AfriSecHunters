import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { Profile, Program, Report } from '@/types/database';
import { Users, FileText, Shield, Trash2, Ban, CheckCircle, Eye, BarChart3 } from 'lucide-react';
import { AdminAnalytics } from '@/components/admin/AdminAnalytics';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    
    const [usersRes, programsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('programs').select('*, company:profiles!programs_company_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('reports').select('*, program:programs(*), pentester:profiles!reports_pentester_id_fkey(*)').order('created_at', { ascending: false }),
    ]);

    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (programsRes.data) setPrograms(programsRes.data as Program[]);
    if (reportsRes.data) setReports(reportsRes.data as Report[]);
    
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível deletar o usuário', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Usuário deletado' });
      fetchData();
    }
  };

  const handleToggleProgram = async (programId: string, isActive: boolean) => {
    const { error } = await supabase.from('programs').update({ is_active: !isActive }).eq('id', programId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o programa', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: `Programa ${!isActive ? 'ativado' : 'desativado'}` });
      fetchData();
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    const { error } = await supabase.from('programs').delete().eq('id', programId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível deletar o programa', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Programa deletado' });
      fetchData();
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível deletar o relatório', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Relatório deletado' });
      fetchData();
    }
  };

  const handleVerifyUser = async (userId: string, isVerified: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_verified: !isVerified }).eq('id', userId);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o usuário', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: `Usuário ${!isVerified ? 'verificado' : 'não verificado'}` });
      fetchData();
    }
  };

  if (adminLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-primary">Carregando...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-primary text-glow-sm">Painel Admin</span>
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie usuários, programas e relatórios da plataforma.</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <CyberCard className="text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-primary">{users.length}</div>
            <div className="text-sm text-muted-foreground">Usuários</div>
          </CyberCard>
          <CyberCard className="text-center">
            <FileText className="h-8 w-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-secondary">{programs.length}</div>
            <div className="text-sm text-muted-foreground">Programas</div>
          </CyberCard>
          <CyberCard className="text-center">
            <Shield className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-yellow-500">{reports.length}</div>
            <div className="text-sm text-muted-foreground">Relatórios</div>
          </CyberCard>
        </div>

        {/* Tabs */}
        <CyberCard glow>
          <Tabs defaultValue="analytics">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Usuários
              </TabsTrigger>
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Programas
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Relatórios
              </TabsTrigger>
            </TabsList>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AdminAnalytics users={users} programs={programs} reports={reports} />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Pontos</th>
                      <th className="py-3 px-4">Verificado</th>
                      <th className="py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-primary/5">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                              ) : (
                                <span className="text-primary text-sm font-bold">
                                  {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{user.display_name || 'Anônimo'}</div>
                              <div className="text-xs text-muted-foreground">{user.rank_title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'company' ? 'bg-blue-500/20 text-blue-400' : 'bg-primary/20 text-primary'
                          }`}>
                            {user.role === 'company' ? 'Empresa' : 'Hunter'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-primary">{user.total_points}</td>
                        <td className="py-3 px-4">
                          {user.is_verified ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Ban className="h-5 w-5 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/hunters/${user.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerifyUser(user.id, user.is_verified)}
                            >
                              <CheckCircle className={`h-4 w-4 ${user.is_verified ? 'text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar usuário?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O usuário será removido permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Programs Tab */}
            <TabsContent value="programs">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-4">Programa</th>
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Recompensas</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map(program => (
                      <tr key={program.id} className="border-b border-border/50 hover:bg-primary/5">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{program.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{program.description}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {program.company?.company_name || program.company?.display_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          <span className="text-primary">R$ {program.reward_low}</span>
                          <span className="text-muted-foreground"> - </span>
                          <span className="text-destructive">R$ {program.reward_critical}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            program.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {program.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/programs/${program.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleProgram(program.id, program.is_active)}
                            >
                              {program.is_active ? (
                                <Ban className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar programa?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O programa e todos os relatórios associados serão removidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProgram(program.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                      <th className="py-3 px-4">Relatório</th>
                      <th className="py-3 px-4">Hunter</th>
                      <th className="py-3 px-4">Severidade</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id} className="border-b border-border/50 hover:bg-primary/5">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{report.title}</div>
                          <div className="text-xs text-muted-foreground">{report.program?.title}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {report.pentester?.display_name || 'Anônimo'}
                        </td>
                        <td className="py-3 px-4">
                          <SeverityBadge severity={report.severity} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/reports/${report.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Deletar relatório?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O relatório será removido permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CyberCard>
      </div>
    </Layout>
  );
}
