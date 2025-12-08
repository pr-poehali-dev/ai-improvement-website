import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Student {
  id: number;
  full_name: string;
  email: string;
  tests_completed: number;
  average_score: number;
  last_activity: string | null;
  test_results?: any[];
  completed_topics?: string[];
}

interface Material {
  id: number;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  created_at: string;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [message, setMessage] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialCategory, setMaterialCategory] = useState('Общее');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    loadMaterials();
  }, [navigate]);

  const loadStudents = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/e6287ede-7b3e-49b4-9586-8da518c65740', {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки студентов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentDetails = async (studentId: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`https://functions.poehali.dev/e6287ede-7b3e-49b4-9586-8da518c65740?student_id=${studentId}`, {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedStudent(data.student);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error('Ошибка загрузки деталей студента:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedStudent || !message.trim()) return;

    setSendingMessage(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('https://functions.poehali.dev/e6287ede-7b3e-49b4-9586-8da518c65740', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!
        },
        body: JSON.stringify({
          action: 'send_message',
          student_id: selectedStudent.id,
          message: message
        })
      });

      if (response.ok) {
        setMessage('');
        setShowMessageDialog(false);
        alert('Сообщение отправлено!');
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Не удалось отправить сообщение');
    } finally {
      setSendingMessage(false);
    }
  };

  const loadMaterials = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('https://functions.poehali.dev/370b1dc6-d070-4917-b166-1422d71566fb', {
        method: 'GET',
        headers: {
          'X-Auth-Token': token
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadMaterial = async () => {
    if (!materialTitle.trim() || !selectedFile) {
      alert('Заполните название и выберите файл');
      return;
    }

    setUploadingFile(true);
    const token = localStorage.getItem('auth_token');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch('https://functions.poehali.dev/370b1dc6-d070-4917-b166-1422d71566fb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token!
          },
          body: JSON.stringify({
            action: 'upload',
            title: materialTitle,
            description: materialDescription,
            file_base64: base64,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            category: materialCategory
          })
        });

        if (response.ok) {
          setMaterialTitle('');
          setMaterialDescription('');
          setMaterialCategory('Общее');
          setSelectedFile(null);
          setShowUploadDialog(false);
          loadMaterials();
          alert('Материал успешно загружен!');
        } else {
          alert('Не удалось загрузить материал');
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Ошибка загрузки материала:', error);
      alert('Не удалось загрузить материал');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!confirm('Удалить этот материал?')) return;

    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch(`https://functions.poehali.dev/370b1dc6-d070-4917-b166-1422d71566fb?material_id=${materialId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': token!
        }
      });

      if (response.ok) {
        loadMaterials();
        alert('Материал удален');
      }
    } catch (error) {
      console.error('Ошибка удаления материала:', error);
      alert('Не удалось удалить материал');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return 'FileText';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('video')) return 'Video';
    if (fileType.includes('word') || fileType.includes('document')) return 'FileText';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Table';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'Presentation';
    return 'File';
  };

  const handleAddStudent = async () => {
    if (!newStudentEmail.trim()) return;

    setAddingStudent(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('https://functions.poehali.dev/e6287ede-7b3e-49b4-9586-8da518c65740', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!
        },
        body: JSON.stringify({
          action: 'add_student',
          email: newStudentEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNewStudentEmail('');
        setShowAddDialog(false);
        loadStudents();
        alert('Студент добавлен!');
      } else {
        alert(data.error || 'Не удалось добавить студента');
      }
    } catch (error) {
      console.error('Ошибка добавления студента:', error);
      alert('Не удалось добавить студента');
    } finally {
      setAddingStudent(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowMessageDialog(true);
                        }}
                      >
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
                <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
                  <Icon name="UserPlus" size={18} />
                  Добавить студента
                </Button>
              </div>
              {students.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-2">У вас пока нет студентов</p>
                  <p className="text-sm">Нажмите "Добавить студента" чтобы начать</p>
                </div>
              ) : (
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
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2"
                              onClick={() => loadStudentDetails(student.id)}
                            >
                              <Icon name="Eye" size={16} />
                              Подробнее
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2"
                              onClick={() => {
                                setSelectedStudent(student);
                                setShowMessageDialog(true);
                              }}
                            >
                              <Icon name="MessageCircle" size={16} />
                              Написать
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                            style={{ width: students.length > 0 ? `${(students.filter(s => s.average_score >= 85).length / students.length) * 100}%` : '0%' }}
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
                            style={{ width: students.length > 0 ? `${(students.filter(s => s.average_score >= 70 && s.average_score < 85).length / students.length) * 100}%` : '0%' }}
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
                            style={{ width: students.length > 0 ? `${(students.filter(s => s.average_score >= 50 && s.average_score < 70).length / students.length) * 100}%` : '0%' }}
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
                            style={{ width: students.length > 0 ? `${(students.filter(s => s.average_score < 50).length / students.length) * 100}%` : '0%' }}
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
                <Button className="gap-2" onClick={() => setShowUploadDialog(true)}>
                  <Icon name="Upload" size={18} />
                  Загрузить материал
                </Button>
              </div>
              {materials.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="FolderOpen" size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-2">У вас пока нет загруженных материалов</p>
                  <p className="text-sm">Загрузите лекции, тесты, презентации и другие материалы для студентов</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {materials.map(material => (
                    <Card key={material.id} className="p-5 hover:shadow-lg transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon name={getFileIcon(material.file_type)} size={24} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-bold text-lg truncate">{material.title}</h3>
                            <Badge className="bg-secondary/10 text-secondary flex-shrink-0">{material.category}</Badge>
                          </div>
                          {material.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{material.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" size={12} />
                              {new Date(material.created_at).toLocaleDateString('ru-RU')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="HardDrive" size={12} />
                              {formatFileSize(material.file_size)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2 flex-1"
                              onClick={() => window.open(material.file_url, '_blank')}
                            >
                              <Icon name="Download" size={14} />
                              Скачать
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteMaterial(material.id)}
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали студента</DialogTitle>
            <DialogDescription>Подробная информация об успеваемости</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedStudent.full_name}</h3>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{selectedStudent.tests_completed}</div>
                    <div className="text-sm text-muted-foreground">Тестов пройдено</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary">{selectedStudent.average_score}%</div>
                    <div className="text-sm text-muted-foreground">Средний балл</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{selectedStudent.completed_topics?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Тем изучено</div>
                  </div>
                </Card>
              </div>

              {selectedStudent.test_results && selectedStudent.test_results.length > 0 && (
                <div>
                  <h4 className="font-bold mb-3">История тестов</h4>
                  <div className="space-y-2">
                    {selectedStudent.test_results.slice(0, 5).map((result: any, index: number) => (
                      <div key={index} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{result.topic || 'Тест'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{result.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            {result.correct_answers}/{result.total_questions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить сообщение</DialogTitle>
            <DialogDescription>
              {selectedStudent && `Отправить сообщение студенту ${selectedStudent.full_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Введите ваше сообщение..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleSendMessage} disabled={sendingMessage || !message.trim()}>
                {sendingMessage ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Material Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Загрузить учебный материал</DialogTitle>
            <DialogDescription>
              Загрузите файл с учебным материалом для ваших студентов
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Название материала *</label>
              <Input
                placeholder="Например: Лекция 5 - Алгоритмы"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Описание</label>
              <Textarea
                placeholder="Краткое описание материала..."
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Категория</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={materialCategory}
                onChange={(e) => setMaterialCategory(e.target.value)}
              >
                <option value="Общее">Общее</option>
                <option value="Лекции">Лекции</option>
                <option value="Практика">Практика</option>
                <option value="Тесты">Тесты</option>
                <option value="Домашние задания">Домашние задания</option>
                <option value="Дополнительные материалы">Дополнительные материалы</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Файл *</label>
              <Input
                type="file"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Выбран: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowUploadDialog(false);
                setMaterialTitle('');
                setMaterialDescription('');
                setSelectedFile(null);
              }}>
                Отмена
              </Button>
              <Button 
                onClick={handleUploadMaterial} 
                disabled={uploadingFile || !materialTitle.trim() || !selectedFile}
              >
                {uploadingFile ? 'Загрузка...' : 'Загрузить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить студента</DialogTitle>
            <DialogDescription>
              Введите email студента для добавления в вашу группу
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email студента</label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddStudent} disabled={addingStudent || !newStudentEmail.trim()}>
                {addingStudent ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}