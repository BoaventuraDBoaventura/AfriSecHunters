import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings, Loader2, Save, Percent, Phone } from 'lucide-react';

export function AdminSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState('10');
  const [originalFee, setOriginalFee] = useState('10');
  const [platformPhone, setPlatformPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .in('setting_key', ['platform_fee_percentage', 'platform_mpesa_number']);

      if (error) throw error;

      if (data) {
        const feeSetting = data.find(d => d.setting_key === 'platform_fee_percentage');
        const phoneSetting = data.find(d => d.setting_key === 'platform_mpesa_number');
        
        if (feeSetting) {
          const feeValue = typeof feeSetting.setting_value === 'string' 
            ? feeSetting.setting_value 
            : String(feeSetting.setting_value);
          setPlatformFee(feeValue);
          setOriginalFee(feeValue);
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
    
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      toast({ 
        title: 'Erro', 
        description: 'A taxa deve ser um valor entre 0 e 100.', 
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
      // Update platform fee
      const { error: feeError } = await supabase
        .from('platform_settings')
        .update({ 
          setting_value: platformFee,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'platform_fee_percentage');

      if (feeError) throw feeError;

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

  const hasChanges = platformFee !== originalFee || platformPhone !== originalPhone;

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

      <div className="grid gap-6 max-w-md">
        {/* Platform Fee Setting */}
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="h-5 w-5 text-secondary" />
            <h3 className="font-medium text-foreground">Taxa da Plataforma</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Percentagem cobrada sobre cada pagamento de recompensa. Esta taxa é deduzida do valor pago aos pentesters.
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
            <p>Exemplo: Com taxa de {platformFee}%, num pagamento de MZN 1.000:</p>
            <ul className="mt-1 space-y-1 ml-4 list-disc">
              <li>Pentester recebe: MZN {(1000 * (1 - parseFloat(platformFee || '0') / 100)).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</li>
              <li>Plataforma recebe: MZN {(1000 * parseFloat(platformFee || '0') / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</li>
            </ul>
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
