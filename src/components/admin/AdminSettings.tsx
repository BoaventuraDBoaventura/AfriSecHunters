import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings, Loader2, Save, Percent, Phone, Wallet, RefreshCw, PiggyBank } from 'lucide-react';

interface GibrapayBalance {
  success: boolean;
  name?: string;
  balance?: number;
  statistics?: {
    total_transactions?: number;
    total_amount?: number;
  };
  error?: string;
}

export function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState('10');
  const [originalFee, setOriginalFee] = useState('10');
  const [pentesterDeduction, setPentesterDeduction] = useState('20');
  const [originalDeduction, setOriginalDeduction] = useState('20');
  const [platformPhone, setPlatformPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [gibrapayData, setGibrapayData] = useState<GibrapayBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchGibrapayBalance();
  }, []);

  const fetchGibrapayBalance = async () => {
    setLoadingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-gibrapay-balance');
      
      if (error) throw error;
      
      setGibrapayData(data);
    } catch (error: any) {
      console.error('Error fetching GibaPay balance:', error);
      setGibrapayData({ success: false, error: 'Não foi possível obter o saldo.' });
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .in('setting_key', ['platform_fee_percentage', 'platform_mpesa_number', 'pentester_deduction_percentage']);

      if (error) throw error;

      if (data) {
        const feeSetting = data.find(d => d.setting_key === 'platform_fee_percentage');
        const deductionSetting = data.find(d => d.setting_key === 'pentester_deduction_percentage');
        const phoneSetting = data.find(d => d.setting_key === 'platform_mpesa_number');
        
        if (feeSetting) {
          const feeValue = typeof feeSetting.setting_value === 'string' 
            ? feeSetting.setting_value 
            : String(feeSetting.setting_value);
          setPlatformFee(feeValue);
          setOriginalFee(feeValue);
        }
        
        if (deductionSetting) {
          const deductionValue = typeof deductionSetting.setting_value === 'string' 
            ? deductionSetting.setting_value 
            : String(deductionSetting.setting_value);
          setPentesterDeduction(deductionValue);
          setOriginalDeduction(deductionValue);
        }
        
        if (phoneSetting) {
          const phoneValue = typeof phoneSetting.setting_value === 'string' 
            ? phoneSetting.setting_value.replace(/"/g, '') 
            : String(phoneSetting.setting_value).replace(/"/g, '');
          setPlatformPhone(phoneValue);
          setOriginalPhone(phoneValue);
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível carregar as configurações.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const feeValue = parseFloat(platformFee);
    const deductionValue = parseFloat(pentesterDeduction);
    
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      toast({ 
        title: 'Erro', 
        description: 'A taxa da plataforma deve ser um valor entre 0 e 100.', 
        variant: 'destructive' 
      });
      return;
    }

    if (isNaN(deductionValue) || deductionValue < 0 || deductionValue > 100) {
      toast({ 
        title: 'Erro', 
        description: 'A dedução do pentester deve ser um valor entre 0 e 100.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!platformPhone || !/^258\d{9}$/.test(platformPhone)) {
      toast({ 
        title: 'Erro', 
        description: 'O número de telefone deve estar no formato 258XXXXXXXXX (12 dígitos).', 
        variant: 'destructive' 
      });
      return;
    }

    setSaving(true);
    try {
      // Update platform fee (store as number, not string)
      const { error: feeError } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: parseFloat(platformFee),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'platform_fee_percentage');

      if (feeError) throw feeError;

      // Update pentester deduction
      const { error: deductionError } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: parseFloat(pentesterDeduction),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'pentester_deduction_percentage');

      if (deductionError) throw deductionError;

      // Update platform phone
      const { error: phoneError } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: `"${platformPhone}"`,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'platform_mpesa_number');

      if (phoneError) throw phoneError;

      setOriginalFee(platformFee);
      setOriginalDeduction(pentesterDeduction);
      setOriginalPhone(platformPhone);
      toast({ 
        title: 'Sucesso', 
        description: 'Configurações atualizadas com sucesso.' 
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({ 
        title: 'Erro', 
        description: 'Não foi possível salvar as configurações.', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = platformFee !== originalFee || pentesterDeduction !== originalDeduction || platformPhone !== originalPhone;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Configurações da Plataforma</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* GibaPay Balance */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">Saldo GibaPay</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchGibrapayBalance}
              disabled={loadingBalance}
            >
              <RefreshCw className={`h-4 w-4 ${loadingBalance ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {loadingBalance ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : gibrapayData?.success ? (
            <div className="space-y-3">
              {gibrapayData.name && (
                <p className="text-sm text-muted-foreground">
                  Carteira: <span className="text-foreground">{gibrapayData.name}</span>
                </p>
              )}
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
                <p className="text-2xl font-bold text-primary">
                  MZN {(gibrapayData.balance || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {gibrapayData.statistics && (
                <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-2">
                  <p>Transações: {gibrapayData.statistics.total_transactions || 0}</p>
                  <p>Total movimentado: MZN {(gibrapayData.statistics.total_amount || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-destructive">{gibrapayData?.error || 'Erro ao carregar saldo'}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGibrapayBalance}
                className="mt-2"
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        {/* Platform Fee Setting - Added on top for company */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="h-5 w-5 text-secondary" />
            <h3 className="font-medium text-foreground">Taxa da Plataforma</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Percentagem adicionada ao valor da recompensa. Este valor é pago pela empresa e transferido para o número da plataforma.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                className="pr-8 bg-input border-border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Vai para o número M-Pesa da plataforma.</p>
          </div>
        </div>

        {/* Pentester Deduction Setting - Stays in GibaPay */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-foreground">Dedução do Pentester</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Percentagem deduzida do valor do pentester. Este valor fica retido no saldo GibaPay.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={pentesterDeduction}
                onChange={(e) => setPentesterDeduction(e.target.value)}
                className="pr-8 bg-input border-border"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Fica no saldo GibaPay da plataforma.</p>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 md:col-span-2 lg:col-span-3">
          <h3 className="font-medium text-foreground mb-3">📊 Exemplo de Cálculo (Recompensa: MZN 1.000)</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="p-3 bg-card rounded border border-border">
              <p className="text-muted-foreground">Recompensa definida</p>
              <p className="text-lg font-semibold text-foreground">MZN 1.000</p>
            </div>
            <div className="p-3 bg-card rounded border border-border">
              <p className="text-muted-foreground">+ Taxa plataforma ({platformFee}%)</p>
              <p className="text-lg font-semibold text-secondary">MZN {(1000 * parseFloat(platformFee || '0') / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">→ Vai para M-Pesa</p>
            </div>
            <div className="p-3 bg-card rounded border border-border">
              <p className="text-muted-foreground">Total cobrado da empresa</p>
              <p className="text-lg font-semibold text-primary">MZN {(1000 + 1000 * parseFloat(platformFee || '0') / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-card rounded border border-border">
              <p className="text-muted-foreground">Pentester recebe</p>
              <p className="text-lg font-semibold text-success">MZN {(1000 - 1000 * parseFloat(pentesterDeduction || '0') / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">({pentesterDeduction}% fica no GibaPay)</p>
            </div>
          </div>
        </div>

        {/* Platform Phone Number Setting */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-foreground">Número de Comissões</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Número de telefone M-Pesa/E-Mola onde as comissões da plataforma serão recebidas automaticamente.
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="text"
              placeholder="258XXXXXXXXX"
              value={platformPhone}
              onChange={(e) => setPlatformPhone(e.target.value.replace(/\D/g, ''))}
              className="bg-input border-border"
              maxLength={12}
            />
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <p>Formato: 258 + 9 dígitos (ex: 258840123456)</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
