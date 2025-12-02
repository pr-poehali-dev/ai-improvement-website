import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Student {
  id: number;
  full_name: string;
  email: string;
  tests_completed: number;
  average_score: number;
  last_activity: string | null;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'teacher') {
      navigate('/');
      return;
    }

    const userName = localStorage.getItem('user_name');
    if (userName) {
      setTeacherName(userName);
    }

    loadStudents();
  }, [navigate]);

  const loadStudents = async () => {
    setLoading(false);
    const mockStudents: Student[] = [
      {
        id: 1,
        full_name: 'Иван Петров',
        email: 'ivan@example.com',
        tests_completed: 15,
        average_score: 85,
        last_activity: '2024-12-01T10:30:00'
      },
      {
        id: 2,
        full_name: 'Мария Сидорова',
        email: 'maria@example.com',
        tests_completed: 22,
        average_score: 92,
        last_activity: '2024-12-02T14:20:00'
      },
      {
        id: 3,
        full_name: 'Петр Иванов',
        email: 'petr@example.com',
        tests_completed: 8,
        average_score: 68,
        last_activity: '2024-11-28T09:15:00'
      }
    ];
    setStudents(mockStudents);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    navigate('/login');
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 85) return { text: 'Отлично', color: 'bg-green-100 text-green-700' };
    if (score >= 70) return { text: 'Хорошо', color: 'bg-blue-100 text-blue-700' };
    if (score >= 50) return { text: 'Удовл.', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Требует внимания', color: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Кабинет преподавателя</h1>
            <p className="text-muted-foreground text-lg">
              Добро пожаловать, {teacherName}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
              <Icon name="Home" size={18} />
              На главную
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700">
              <Icon name="LogOut" size={18} />
              Выйти
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <Icon name="LayoutDashboard" size={18} />
              Обзор
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Icon name="Users" size={18} />
              Студенты
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Icon name="BarChart3" size={18} />
              Аналитика
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-2">
              <Icon name="BookOpen" size={18} />
              Материалы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon name="Users" size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{students.length}</div>
                    <div className="text-sm text-muted-foreground">Студентов</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Icon name="CheckCircle" size={24} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {students.reduce((sum, s) => sum + s.tests_completed, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Тестов пройдено</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Icon name="TrendingUp" size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {students.length > 0
                        ? Math.round(students.reduce((sum, s) => sum + s.average_score, 0) / students.length)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Средний балл</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Icon name="AlertCircle" size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {students.filter(s => s.average_score < 70).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Требует помощи</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="AlertTriangle" size={24} />
                Студенты, требующие внимания
              </h2>
              <div className="space-y-3">
                {students.filter(s => s.average_score < 70).map(student => (
                  <div key={student.id} className="p-4 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {student.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{student.average_score}%</p>
                        <p className="text-xs text-muted-foreground">{student.tests_completed} тестов</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Icon name="MessageCircle" size={16} className="mr-2" />
                        Связаться
                      </Button>
                    </div>
                  </div>
                ))}
                {students.filter(s => s.average_score < 70).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Все студенты показывают хорошие результаты! 🎉
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Список студентов</h2>
                <Button className="gap-2">
                  <Icon name="UserPlus" size={18} />
                  Добавить студента
                </Button>
              </div>
              <div className="space-y-3">
                {students.map(student => {
                  const badge = getPerformanceBadge(student.average_score);
                  return (
                    <div key={student.id} className="p-5 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                            {student.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-bold text-lg">{student.full_name}</p>
                              <Badge className={badge.color}>{badge.text}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{student.email}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Icon name="CheckCircle" size={14} className="text-green-600" />
                                {student.tests_completed} тестов
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon name="Award" size={14} className="text-blue-600" />
                                {student.average_score}% средний балл
                              </span>
                              {student.last_activity && (
                                <span className="flex items-center gap-1">
                                  <Icon name="Clock" size={14} className="text-muted-foreground" />
                                  {new Date(student.last_activity).toLocaleDateString('ru-RU')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Icon name="Eye" size={16} />
                            Подробнее
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Icon name="MessageCircle" size={16} />
                            Написать
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Статистика группы</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Распределение по успеваемости</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Отлично (85-100%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${(students.filter(s => s.average_score >= 85).length / students.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{students.filter(s => s.average_score >= 85).length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Хорошо (70-84%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${(students.filter(s => s.average_score >= 70 && s.average_score < 85).length / students.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{students.filter(s => s.average_score >= 70 && s.average_score < 85).length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Удовл. (50-69%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500"
                            style={{ width: `${(students.filter(s => s.average_score >= 50 && s.average_score < 70).length / students.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{students.filter(s => s.average_score >= 50 && s.average_score < 70).length}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Неудовл. (&lt;50%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500"
                            style={{ width: `${(students.filter(s => s.average_score < 50).length / students.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{students.filter(s => s.average_score < 50).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Активность студентов</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">Активные (последние 3 дня)</span>
                        <span className="text-xl font-bold text-green-700">
                          {students.filter(s => {
                            if (!s.last_activity) return false;
                            const daysDiff = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff <= 3;
                          }).length}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-700">Неактивные (3-7 дней)</span>
                        <span className="text-xl font-bold text-yellow-700">
                          {students.filter(s => {
                            if (!s.last_activity) return false;
                            const daysDiff = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff > 3 && daysDiff <= 7;
                          }).length}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-red-700">Требуют напоминания (&gt;7 дней)</span>
                        <span className="text-xl font-bold text-red-700">
                          {students.filter(s => {
                            if (!s.last_activity) return true;
                            const daysDiff = Math.floor((Date.now() - new Date(s.last_activity).getTime()) / (1000 * 60 * 60 * 24));
                            return daysDiff > 7;
                          }).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Учебные материалы</h2>
                <Button className="gap-2">
                  <Icon name="Plus" size={18} />
                  Добавить материал
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="FolderOpen" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Здесь будут отображаться учебные материалы</p>
                <p className="text-sm mt-2">Вы можете загружать лекции, тесты и задания для студентов</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
