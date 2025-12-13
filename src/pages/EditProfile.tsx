import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { CyberCard } from '@/components/ui/CyberCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PayoutDetails, PayoutMethod } from '@/types/database';
import { PayoutSettings } from '@/components/pentester/PayoutSettings';
import { 
  User, 
  Building2, 
  Camera, 
  Save, 
  ArrowLeft,
  Globe,
  Code,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EditProfile() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Pentester fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  
  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Payout fields (for pentesters)
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | null>(null);
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setSkills(profile.skills || []);
      setCompanyName(profile.company_name || '');
      setCompanyWebsite(profile.company_website || '');
      setAvatarUrl(profile.avatar_url);
      setPayoutMethod(profile.payout_method || null);
      setPayoutDetails(profile.payout_details || null);
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Por favor, selecione uma imagem válida.', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(urlWithCacheBuster);

      // Update profile with new avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', user.id);

      toast({ title: 'Avatar atualizado!' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 10) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const updates = profile?.role === 'company' 
        ? {
            display_name: displayName.trim() || null,
            bio: bio.trim() || null,
            company_name: companyName.trim() || null,
            company_website: companyWebsite.trim() || null,
          }
        : {
            display_name: displayName.trim() || null,
            bio: bio.trim() || null,
            skills: skills.length > 0 ? skills : null,
            payout_method: payoutMethod,
            payout_details: payoutDetails,
          };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update the auth context with new profile data
      await updateProfile(updates);

      toast({ title: 'Perfil atualizado com sucesso!' });
      
      // Redirect to appropriate dashboard
      navigate(profile?.role === 'company' ? '/company-dashboard' : '/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user || !profile) return null;

  const isPentester = profile.role === 'pentester';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-6 text-muted-foreground hover:text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <CyberCard glow>
          <div className="flex items-center gap-2 mb-8">
            {isPentester ? (
              <User className="h-6 w-6 text-primary" />
            ) : (
              <Building2 className="h-6 w-6 text-secondary" />
            )}
            <h1 className="text-2xl font-bold text-foreground">
              Editar Perfil
            </h1>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-24 w-24 border-2 border-primary/50">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                  {displayName?.[0]?.toUpperCase() || (isPentester ? 'P' : 'C')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Clique para alterar o avatar
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                {isPentester ? 'Nome de Exibição' : 'Seu Nome'}
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={isPentester ? 'Seu nome ou apelido' : 'Seu nome completo'}
                className="bg-background border-border/50 focus:border-primary"
                maxLength={50}
              />
            </div>

            {/* Company-specific fields */}
            {!isPentester && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da sua empresa"
                    className="bg-background border-border/50 focus:border-primary"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="companyWebsite"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://suaempresa.com"
                    type="url"
                    className="bg-background border-border/50 focus:border-primary"
                  />
                </div>
              </>
            )}

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                {isPentester ? 'Sobre Você' : 'Sobre a Empresa'}
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={isPentester 
                  ? 'Conte um pouco sobre sua experiência em segurança...' 
                  : 'Descreva sua empresa e seu programa de bug bounty...'
                }
                className="bg-background border-border/50 focus:border-primary min-h-[120px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/500
              </p>
            </div>

            {/* Skills (Pentester only) */}
            {isPentester && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Habilidades
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ex: Web Security, API Testing..."
                    className="bg-background border-border/50 focus:border-primary"
                    maxLength={30}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addSkill}
                    disabled={!newSkill.trim() || skills.length >= 10}
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    Adicionar
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-primary/20 text-primary border border-primary/30 pr-1"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 p-0.5 hover:bg-primary/30 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {skills.length}/10 habilidades
                </p>
              </div>
            )}

            {/* Payout Settings (Pentester only) */}
            {isPentester && (
              <div className="pt-4 border-t border-border">
                <PayoutSettings
                  payoutMethod={payoutMethod}
                  payoutDetails={payoutDetails}
                  onPayoutMethodChange={setPayoutMethod}
                  onPayoutDetailsChange={setPayoutDetails}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              className="flex-1 border-border hover:border-primary"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </CyberCard>
      </div>
    </Layout>
  );
}