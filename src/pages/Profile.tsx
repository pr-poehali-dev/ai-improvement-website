import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import ChatDialog from '@/components/ChatDialog';

interface UserData {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
  test_results: any[];
  completed_topics: string[];
  last_activity: string | null;
}

interface Teacher {
  id: number;
  full_name: string;
  email: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatTeacherId, setChatTeacherId] = useState<number>(0);
  const [chatTeacherName, setChatTeacherName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number>(0);

  useEffect(() => {
    loadProfile();
    loadTeachers();
    
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/6f04f0e4-6b9b-4b83-9359-a67eb64cd803', {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка загрузки профиля');
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          navigate('/login');
        }
        return;
      }

      setUser(data.user);
    } catch (err) {
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('https://functions.poehali.dev/6f04f0e4-6b9b-4b83-9359-a67eb64cd803?action=get_teachers', {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      const data = await response.json();

      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error('Ошибка загрузки преподавателей:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-lg mb-4">{error || 'Не удалось загрузить профиль'}</p>
          <Button onClick={() => navigate('/login')}>Вернуться ко входу</Button>
        </div>
      </div>
    );
  }

  const completedTests = (user.test_results && Array.isArray(user.test_results)) ? user.test_results.length : 0;
  const completedTopics = (user.completed_topics && Array.isArray(user.completed_topics)) ? user.completed_topics.length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <Icon name="ArrowLeft" size={18} />
            На главную
          </Button>
          <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700">
            <Icon name="LogOut" size={18} />
            Выйти
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border mb-6">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
              {user.full_name.trim().split(' ')[0].charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{user.full_name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mb-1">
                <Icon name="Mail" size={16} />
                {user.email}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon name="Calendar" size={16} />
                Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{completedTests}</p>
                  <p className="text-sm text-blue-600">Пройдено тестов</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Icon name="BookOpen" size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{completedTopics}</p>
                  <p className="text-sm text-green-600">Изучено тем</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Icon name="Award" size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {completedTests > 0 ? Math.round((completedTests / 10) * 100) : 0}%
                  </p>
                  <p className="text-sm text-purple-600">Прогресс</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {teachers.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Icon name="Users" size={24} />
              Мои преподаватели
            </h2>
            <div className="space-y-3">
              {teachers.map(teacher => (
                <div key={teacher.id} className="p-4 bg-muted rounded-lg flex items-center justify-between hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {teacher.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{teacher.full_name}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      setChatTeacherId(teacher.id);
                      setChatTeacherName(teacher.full_name);
                      setShowChatDialog(true);
                    }}
                  >
                    <Icon name="MessageCircle" size={16} />
                    Написать
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {user.test_results && user.test_results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Icon name="History" size={24} />
              История тестов
            </h2>
            <div className="space-y-3">
              {user.test_results.slice().reverse().map((result: any, index: number) => (
                <div key={index} className="p-4 bg-muted rounded-lg flex items-center justify-between hover:bg-muted/80 transition-colors">
                  <div>
                    <p className="font-medium">{result.topic || 'Тест'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.date).toLocaleDateString('ru-RU', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{result.score}%</p>
                    <p className="text-xs text-muted-foreground">{result.correct_answers}/{result.total_questions} правильных</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ChatDialog
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          otherUserId={chatTeacherId}
          otherUserName={chatTeacherName}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}