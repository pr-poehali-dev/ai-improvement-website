import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: number;
  otherUserName: string;
  currentUserId: number;
}

export default function ChatDialog({
  open,
  onOpenChange,
  otherUserId,
  otherUserName,
  currentUserId
}: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(
        `https://functions.poehali.dev/b242cc50-04aa-458a-bebe-f0546a95bd31?other_user_id=${otherUserId}`,
        {
          method: 'GET',
          headers: {
            'X-Auth-Token': token
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('https://functions.poehali.dev/b242cc50-04aa-458a-bebe-f0546a95bd31', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!
        },
        body: JSON.stringify({
          action: 'send',
          receiver_id: otherUserId,
          message: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages();
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
      });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(msg => {
      const dateKey = formatMessageDate(msg.created_at);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                {getInitials(otherUserName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold text-lg">{otherUserName}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Онлайн
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              <Icon name="X" size={18} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-muted/20 to-background">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-muted-foreground">Загрузка сообщений...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Icon name="MessageSquare" size={40} className="text-primary" />
              </div>
              <p className="text-lg font-medium">Сообщений пока нет</p>
              <p className="text-sm">Отправьте первое сообщение</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  <div className="flex items-center justify-center mb-4">
                    <Badge variant="secondary" className="text-xs px-3 py-1">
                      {date}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {msgs.map((msg, index) => {
                      const isMe = msg.sender_id === currentUserId;
                      const showAvatar = index === 0 || msgs[index - 1].sender_id !== msg.sender_id;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                          {!isMe && (
                            <Avatar className="w-8 h-8 mt-auto" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xs">
                                {getInitials(msg.sender_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                            {!isMe && showAvatar && (
                              <span className="text-xs font-medium text-muted-foreground mb-1 px-2">
                                {msg.sender_name}
                              </span>
                            )}
                            
                            <div
                              className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                isMe
                                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-sm'
                                  : 'bg-card border border-border rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                              
                              <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span
                                  className={`text-xs ${
                                    isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}
                                >
                                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {isMe && (
                                  <Icon 
                                    name={msg.is_read ? "CheckCheck" : "Check"} 
                                    size={14} 
                                    className={msg.is_read ? "text-green-400" : "text-primary-foreground/70"}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isMe && (
                            <Avatar className="w-8 h-8 mt-auto" style={{ visibility: showAvatar ? 'visible' : 'hidden' }}>
                              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-semibold">
                                Я
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="pr-10 h-11 rounded-full border-2 focus:border-primary"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-8 h-8 p-0"
                disabled
              >
                <Icon name="Smile" size={18} className="text-muted-foreground" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || !newMessage.trim()}
              className="rounded-full w-11 h-11 p-0"
              size="icon"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="Send" size={18} />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
