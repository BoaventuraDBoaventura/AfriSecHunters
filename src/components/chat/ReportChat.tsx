import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, Paperclip, X, Image, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ReportChatProps {
  reportId: string;
}

interface MessageWithSender {
  id: string;
  report_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  sender: Profile;
}

export function ReportChat({ reportId }: ReportChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel(`report-chat-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `report_id=eq.${reportId}`
        },
        async (payload) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single();

          if (senderData) {
            const newMsg = {
              ...(payload.new as Omit<MessageWithSender, 'sender'>),
              sender: senderData as Profile
            } as MessageWithSender;
            
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*)
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as MessageWithSender[]);
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'O arquivo deve ter no máximo 10MB.', variant: 'destructive' });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Erro', description: 'Tipo de arquivo não suportado. Use imagens, PDF ou texto.', variant: 'destructive' });
      return;
    }

    setPendingFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearPendingFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  const uploadFile = async (file: File): Promise<{ url: string; type: string } | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${reportId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      type: file.type.startsWith('image/') ? 'image' : 'file'
    };
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingFile) || !user || sending) return;

    setSending(true);
    setUploading(!!pendingFile);

    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;

      // Upload file if present
      if (pendingFile) {
        const uploadResult = await uploadFile(pendingFile);
        if (uploadResult) {
          attachmentUrl = uploadResult.url;
          attachmentType = uploadResult.type;
        } else {
          toast({ title: 'Erro', description: 'Falha ao enviar arquivo.', variant: 'destructive' });
          setSending(false);
          setUploading(false);
          return;
        }
      }

      const { error } = await supabase.from('messages').insert({
        report_id: reportId,
        sender_id: user.id,
        content: newMessage.trim() || (pendingFile ? `📎 ${pendingFile.name}` : ''),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      });

      if (!error) {
        setNewMessage('');
        clearPendingFile();
      }
    } catch (err) {
      console.error('Send error:', err);
      toast({ title: 'Erro', description: 'Falha ao enviar mensagem.', variant: 'destructive' });
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderAttachment = (message: MessageWithSender) => {
    if (!message.attachment_url) return null;

    if (message.attachment_type === 'image') {
      return (
        <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img 
            src={message.attachment_url} 
            alt="Anexo" 
            className="max-w-full max-h-64 rounded-lg border border-border/50 hover:opacity-90 transition-opacity"
          />
        </a>
      );
    }

    return (
      <a 
        href={message.attachment_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
      >
        <FileText className="h-4 w-4 text-primary" />
        <span className="truncate">Arquivo anexado</span>
        <Download className="h-4 w-4 ml-auto" />
      </a>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Carregando mensagens...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 rounded-lg border border-border/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs">Inicie a conversa sobre este relatório.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={message.sender?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {message.sender?.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {message.sender?.display_name || 'Usuário'}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {format(new Date(message.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.content}
                    {renderAttachment(message)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending File Preview */}
      {pendingFile && (
        <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-border/50 flex items-center gap-2">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded" />
          ) : (
            <div className="h-12 w-12 rounded bg-primary/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{pendingFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(pendingFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearPendingFile}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
          className="border-border/50 hover:border-primary hover:bg-primary/10"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          className="min-h-[60px] resize-none bg-background border-border/50 focus:border-primary"
          disabled={sending}
        />
        <Button
          onClick={handleSendMessage}
          disabled={(!newMessage.trim() && !pendingFile) || sending}
          className="h-auto bg-primary hover:bg-primary/90"
        >
          {uploading ? (
            <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}