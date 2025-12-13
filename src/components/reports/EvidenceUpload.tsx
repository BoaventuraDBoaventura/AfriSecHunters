import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, FileText, Film, Loader2 } from 'lucide-react';

interface EvidenceUploadProps {
  onUploadComplete: (urls: string[]) => void;
  existingUrls?: string[];
  maxFiles?: number;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function EvidenceUpload({ onUploadComplete, existingUrls = [], maxFiles = 5 }: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingUrls);
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    if (uploadedUrls.length + files.length > maxFiles) {
      toast({
        title: 'Limite excedido',
        description: `Você pode enviar no máximo ${maxFiles} arquivos.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({
          title: 'Tipo não suportado',
          description: `${file.name} não é um tipo de arquivo suportado.`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede o limite de 10MB.`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const newUrls: string[] = [];
      const newPreviews: { url: string; type: string; name: string }[] = [];

      for (const file of validFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('report-evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('report-evidence')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
        newPreviews.push({
          url: publicUrl,
          type: file.type,
          name: file.name,
        });
      }

      const allUrls = [...uploadedUrls, ...newUrls];
      setUploadedUrls(allUrls);
      setPreviews([...previews, ...newPreviews]);
      onUploadComplete(allUrls);

      toast({
        title: 'Upload concluído',
        description: `${validFiles.length} arquivo(s) enviado(s) com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const newUrls = uploadedUrls.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setUploadedUrls(newUrls);
    setPreviews(newPreviews);
    onUploadComplete(newUrls);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Film className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || uploadedUrls.length >= maxFiles}
          className="border-dashed border-2 border-border hover:border-primary"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {uploading ? 'Enviando...' : 'Adicionar Evidência'}
        </Button>
        <span className="text-sm text-muted-foreground">
          {uploadedUrls.length}/{maxFiles} arquivos • Max 10MB cada
        </span>
      </div>

      {/* File Previews */}
      {(previews.length > 0 || uploadedUrls.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(previews.length > 0 ? previews : uploadedUrls.map(url => ({ url, type: 'image/*', name: url.split('/').pop() || '' }))).map((file, index) => (
            <div
              key={index}
              className="relative group rounded-lg border border-border overflow-hidden bg-muted/30"
            >
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 flex flex-col items-center justify-center gap-2 p-2">
                  {getFileIcon(file.type)}
                  <span className="text-xs text-muted-foreground text-center truncate w-full">
                    {file.name}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Supported formats info */}
      <p className="text-xs text-muted-foreground">
        Formatos suportados: JPG, PNG, GIF, WebP, MP4, WebM, PDF, TXT
      </p>
    </div>
  );
}