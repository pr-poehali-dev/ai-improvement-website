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
import ChatDialog from '@/components/ChatDialog';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [materialContent, setMaterialContent] = useState('');
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedMaterialForReview, setSelectedMaterialForReview] = useState<Material | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedMaterialForView, setSelectedMaterialForView] = useState<Material | null>(null);
  const [materialStatuses, setMaterialStatuses] = useState<any[]>([]);
  const [reviewStatus, setReviewStatus] = useState('completed');
  const [reviewComment, setReviewComment] = useState('');
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<number | null>(null);
  
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [chatStudentId, setChatStudentId] = useState<number>(0);
  const [chatStudentName, setChatStudentName] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedMaterialForEdit, setSelectedMaterialForEdit] = useState<Material | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Общее');
  const [editContent, setEditContent] = useState('');
  const [updatingMaterial, setUpdatingMaterial] = useState(false);

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
    
    const userId = localStorage.getItem('user_id');
    if (userId) {
      setCurrentUserId(parseInt(userId));
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

  const handleUploadMaterial = async () => {
    if (!materialTitle.trim() || !materialContent.trim()) {
      alert('Заполните название и содержание материала');
      return;
    }

    setUploadingFile(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('https://functions.poehali.dev/370b1dc6-d070-4917-b166-1422d71566fb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!
        },
        body: JSON.stringify({
          action: 'create',
          title: materialTitle,
          description: materialDescription,
          content: materialContent,
          category: materialCategory
        })
      });

      if (response.ok) {
        setMaterialTitle('');
        setMaterialDescription('');
        setMaterialCategory('Общее');
        setMaterialContent('');
        setShowUploadDialog(false);
        loadMaterials();
        alert('Материал успешно создан!');
      } else {
        const errorText = await response.text();
        console.error('Ошибка сервера:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          alert('Не удалось создать материал: ' + (errorData.error || errorText));
        } catch {
          alert('Не удалось создать материал: ' + errorText);
        }
      }
    } catch (error) {
      console.error('Ошибка создания материала:', error);
      alert('Не удалось создать материал');
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

  const handleOpenEditDialog = (material: Material) => {
    setSelectedMaterialForEdit(material);
    setEditTitle(material.title);
    setEditDescription(material.description);
    setEditCategory(material.category);
    setEditContent(material.file_url);
    setShowEditDialog(true);
  };

  const handleUpdateMaterial = async () => {
    if (!selectedMaterialForEdit || !editTitle.trim() || !editContent.trim()) {
      alert('Заполните название и содержание материала');
      return;
    }

    setUpdatingMaterial(true);
    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('https://functions.poehali.dev/370b1dc6-d070-4917-b166-1422d71566fb', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!
        },
        body: JSON.stringify({
          material_id: selectedMaterialForEdit.id,
          title: editTitle,
          description: editDescription,
          content: editContent,
          category: editCategory
        })
      });

      if (response.ok) {
        setShowEditDialog(false);
        loadMaterials();
        alert('Материал успешно обновлен!');
      } else {
        const errorText = await response.text();
        alert('Не удалось обновить материал: ' + errorText);
      }
    } catch (error) {
      console.error('Ошибка обновления материала:', error);
      alert('Не удалось обновить материал');
    } finally {
      setUpdatingMaterial(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getMaterialIcon = (category: string) => {
    if (category === 'Лекции') return 'BookOpen';
    if (category === 'Практика') return 'Wrench';
    if (category === 'Тесты') return 'ClipboardCheck';
    if (category === 'Домашние задания') return 'PenTool';
    if (category === 'Дополнительные материалы') return 'FolderPlus';
    return 'FileText';
  };

  const loadMaterialStatuses = async (materialId: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch('https://functions.poehali.dev/e6287ede-7b3e-49b4-9586-8da518c65740', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token
        },
        body: JSON.stringify({
          action: 'get_material_statuses',
          material_id: materialId
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMaterialStatuses(data.statuses || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки статусов:', error);
    }
  };

  const handleOpenReview = async (material: Material) => {
    setSelectedMaterialForReview(material);
    await loadMaterialStatuses(material.id);
    setShowReviewDialog(true);
  };

  const handleUpdateMaterialStatus = async () => {
    if (!selectedStudentForReview || !selectedMaterialForReview) return;

    const token = localStorage.getItem('auth_token');

    try {
      const response = await fetch('https://functions.poehali.dev/e6287ede-7b3e-49b4-9586-8da518c65740', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token!
        },
        body: JSON.stringify({
          action: 'update_material_status',
          material_id: selectedMaterialForReview.id,
          student_id: selectedStudentForReview,
          status: reviewStatus,
          teacher_comment: reviewComment
        })
      });

      if (response.ok) {
        await loadMaterialStatuses(selectedMaterialForReview.id);
        setReviewComment('');
        setSelectedStudentForReview(null);
        alert('Статус обновлен!');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус');
    }
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
          <TabsList className="grid w-full grid-cols-5 mb-8">
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
            <TabsTrigger value="ai" className="gap-2">
              <Icon name="Brain" size={18} />
              Нейросеть для обучения
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

            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <img 
                  src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/4cb89443-4972-46d4-b6c0-5d01313e7652.jpg" 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="AlertTriangle" size={24} />
                Студенты, требующие внимания
              </h2>
              
              {students.filter(s => s.average_score < 70).length > 0 && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img 
                    src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/afc07bf9-c825-4210-99f9-21b229b3154d.jpg" 
                    alt="Иллюстрация студентов" 
                    className="w-full h-auto max-h-64 object-contain opacity-70"
                  />
                </div>
              )}
              
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
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <img 
                  src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/4cb89443-4972-46d4-b6c0-5d01313e7652.jpg" 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
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
                <>
                  {students.length > 0 && (
                    <div className="mb-6 rounded-lg overflow-hidden">
                      <img 
                        src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/afc07bf9-c825-4210-99f9-21b229b3154d.jpg" 
                        alt="Иллюстрация студентов" 
                        className="w-full h-auto max-h-64 object-contain opacity-70"
                      />
                    </div>
                  )}
                  
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
                                  setChatStudentId(student.id);
                                  setChatStudentName(student.full_name);
                                  setShowChatDialog(true);
                                }}
                              >
                                <Icon name="MessageCircle" size={16} />
                                Чат
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <img 
                  src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/4cb89443-4972-46d4-b6c0-5d01313e7652.jpg" 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
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

              <div className="mt-8 pt-8 border-t border-border/50">
                <h3 className="text-xl font-bold mb-6">Визуализация данных</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Круговая диаграмма */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold mb-4 text-center">Распределение студентов по успеваемости</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Отлично (85-100%)', value: students.filter(s => s.average_score >= 85).length, color: '#22c55e' },
                            { name: 'Хорошо (70-84%)', value: students.filter(s => s.average_score >= 70 && s.average_score < 85).length, color: '#3b82f6' },
                            { name: 'Удовл. (50-69%)', value: students.filter(s => s.average_score >= 50 && s.average_score < 70).length, color: '#eab308' },
                            { name: 'Неудовл. (<50%)', value: students.filter(s => s.average_score < 50).length, color: '#ef4444' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Отлично (85-100%)', value: students.filter(s => s.average_score >= 85).length, color: '#22c55e' },
                            { name: 'Хорошо (70-84%)', value: students.filter(s => s.average_score >= 70 && s.average_score < 85).length, color: '#3b82f6' },
                            { name: 'Удовл. (50-69%)', value: students.filter(s => s.average_score >= 50 && s.average_score < 70).length, color: '#eab308' },
                            { name: 'Неудовл. (<50%)', value: students.filter(s => s.average_score < 50).length, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Гистограмма */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="font-semibold mb-4 text-center">Количество студентов по категориям</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { category: 'Отлично', count: students.filter(s => s.average_score >= 85).length, fill: '#22c55e' },
                          { category: 'Хорошо', count: students.filter(s => s.average_score >= 70 && s.average_score < 85).length, fill: '#3b82f6' },
                          { category: 'Удовл.', count: students.filter(s => s.average_score >= 50 && s.average_score < 70).length, fill: '#eab308' },
                          { category: 'Неудовл.', count: students.filter(s => s.average_score < 50).length, fill: '#ef4444' }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Количество студентов">
                          {[
                            { category: 'Отлично', count: students.filter(s => s.average_score >= 85).length, fill: '#22c55e' },
                            { category: 'Хорошо', count: students.filter(s => s.average_score >= 70 && s.average_score < 85).length, fill: '#3b82f6' },
                            { category: 'Удовл.', count: students.filter(s => s.average_score >= 50 && s.average_score < 70).length, fill: '#eab308' },
                            { category: 'Неудовл.', count: students.filter(s => s.average_score < 50).length, fill: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <img 
                  src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/4cb89443-4972-46d4-b6c0-5d01313e7652.jpg" 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
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
                          <Icon name={getMaterialIcon(material.category)} size={24} className="text-primary" />
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
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2 flex-1"
                              onClick={() => {
                                setSelectedMaterialForView(material);
                                setShowViewDialog(true);
                              }}
                            >
                              <Icon name="Eye" size={14} />
                              Просмотр
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2"
                              onClick={() => handleOpenEditDialog(material)}
                            >
                              <Icon name="Pencil" size={14} />
                              Редактировать
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-2"
                              onClick={() => handleOpenReview(material)}
                            >
                              <Icon name="CheckSquare" size={14} />
                              Проверка
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
              <div className="mt-8 pt-8 border-t border-border/50">
                <img 
                  src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/f9232f27-3ad6-4fe8-9aac-67f145452f83.jpg" 
                  alt="" 
                  className="w-full h-auto max-h-32 object-contain opacity-20"
                />
              </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="p-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <img 
                  src="https://cdn.poehali.dev/projects/2340c444-1239-4e7b-b126-c7cce6b9f819/files/4cb89443-4972-46d4-b6c0-5d01313e7652.jpg" 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">AI-инструменты для обучения</h2>
                  <p className="text-muted-foreground">
                    Современные нейросетевые помощники для преподавателей
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 hover:shadow-lg transition-shadow border-2">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Icon name="Bot" size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Яндекс AI (Алиса)</h3>
                        <Badge className="bg-purple-100 text-purple-700 mb-2">Голосовой помощник</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Голосовой ассистент от Яндекса для быстрых ответов на вопросы, генерации идей и помощи в планировании занятий
                    </p>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => window.open('https://alice.yandex.ru/', '_blank')}
                    >
                      <Icon name="ExternalLink" size={16} />
                      Использовать
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow border-2">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Icon name="Sparkles" size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">YandexGPT</h3>
                        <Badge className="bg-blue-100 text-blue-700 mb-2">Текстовая генерация</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Нейросеть для создания учебных материалов, конспектов, заданий и проверки текстов студентов
                    </p>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => window.open('https://yandex.ru/chat', '_blank')}
                    >
                      <Icon name="ExternalLink" size={16} />
                      Использовать
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-shadow border-2">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                        <Icon name="Languages" size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Яндекс Переводчик AI</h3>
                        <Badge className="bg-pink-100 text-pink-700 mb-2">Перевод и языки</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Нейросетевой переводчик для работы с иностранными источниками, подготовки методических материалов на разных языках
                    </p>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => window.open('https://translate.yandex.ru/', '_blank')}
                    >
                      <Icon name="ExternalLink" size={16} />
                      Использовать
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-3">
                  <Icon name="Info" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Советы по использованию AI</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Используйте AI для генерации идей учебных заданий и тестов</li>
                      <li>• Проверяйте тексты и работы студентов на понятность и корректность</li>
                      <li>• Создавайте визуальные материалы для более эффективного объяснения</li>
                      <li>• Автоматизируйте рутинные задачи (планирование, конспекты, отчеты)</li>
                    </ul>
                  </div>
                </div>
              </div>
              </div>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать учебный материал</DialogTitle>
            <DialogDescription>
              Создайте текстовый материал для ваших студентов
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
              <label className="text-sm font-medium mb-2 block">Краткое описание</label>
              <Textarea
                placeholder="Краткое описание материала..."
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Содержание материала *</label>
              <Textarea
                placeholder="Введите текст лекции, задания или другой учебный материал..."
                value={materialContent}
                onChange={(e) => setMaterialContent(e.target.value)}
                rows={15}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {materialContent.length} символов
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowUploadDialog(false);
                setMaterialTitle('');
                setMaterialDescription('');
                setMaterialContent('');
              }}>
                Отмена
              </Button>
              <Button 
                onClick={handleUploadMaterial} 
                disabled={uploadingFile || !materialTitle.trim() || !materialContent.trim()}
              >
                {uploadingFile ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Material Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Проверка изучения материала</DialogTitle>
            <DialogDescription>
              {selectedMaterialForReview && selectedMaterialForReview.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold mb-3">Студенты</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map(student => {
                    const status = materialStatuses.find(s => s.student_id === student.id);
                    return (
                      <div 
                        key={student.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStudentForReview === student.id
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedStudentForReview(student.id);
                          if (status) {
                            setReviewStatus(status.status);
                            setReviewComment(status.teacher_comment || '');
                          } else {
                            setReviewStatus('not_started');
                            setReviewComment('');
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          {status && (
                            <Badge className={
                              status.status === 'completed' ? 'bg-green-100 text-green-700' :
                              status.status === 'needs_review' ? 'bg-yellow-100 text-yellow-700' :
                              status.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }>
                              {status.status === 'completed' && 'Изучено'}
                              {status.status === 'needs_review' && 'Требует изучения'}
                              {status.status === 'in_progress' && 'В процессе'}
                              {status.status === 'not_started' && 'Не начато'}
                            </Badge>
                          )}
                        </div>
                        {status && status.teacher_comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {status.teacher_comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-3">Отметка о проверке</h3>
                {selectedStudentForReview ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Статус изучения</label>
                      <select
                        className="w-full px-3 py-2 border rounded-md"
                        value={reviewStatus}
                        onChange={(e) => setReviewStatus(e.target.value)}
                      >
                        <option value="not_started">Не начато</option>
                        <option value="in_progress">В процессе</option>
                        <option value="completed">Лекция изучена</option>
                        <option value="needs_review">Лекция требует изучения</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Комментарий преподавателя</label>
                      <Textarea
                        placeholder="Добавьте комментарий для студента..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={5}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleUpdateMaterialStatus}
                    >
                      Сохранить оценку
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="UserCheck" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Выберите студента для проверки</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Material Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMaterialForView?.title}</DialogTitle>
            <DialogDescription>
              {selectedMaterialForView?.category} • {selectedMaterialForView?.created_at && new Date(selectedMaterialForView.created_at).toLocaleDateString('ru-RU')}
            </DialogDescription>
          </DialogHeader>
          {selectedMaterialForView && (
            <div className="space-y-4">
              {selectedMaterialForView.description && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{selectedMaterialForView.description}</p>
                </div>
              )}
              <div className="prose prose-sm max-w-none">
                <div className="p-6 bg-white rounded-lg border whitespace-pre-wrap">
                  {selectedMaterialForView.file_url}
                </div>
              </div>
            </div>
          )}
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

      {/* Edit Material Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать материал</DialogTitle>
            <DialogDescription>
              Измените информацию о материале
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Название материала *</label>
              <Input
                placeholder="Например: Лекция 5 - Алгоритмы"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Категория</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                <option value="Общее">Общее</option>
                <option value="Лекции">Лекции</option>
                <option value="Практика">Практика</option>
                <option value="Тесты">Тесты</option>
                <option value="Домашние задания">Домашние задания</option>
                <option value="Дополнительные материалы">Дополнительные материалы</option>
              </select>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name={getMaterialIcon(editCategory)} size={20} className="text-primary" />
                <span>Текущая иконка для категории "{editCategory}"</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Краткое описание</label>
              <Textarea
                placeholder="Краткое описание материала..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Содержание материала *</label>
              <Textarea
                placeholder="Введите текст лекции, задания или другой учебный материал..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={15}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editContent.length} символов
              </p>
            </div>
            {selectedMaterialForEdit && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Calendar" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Дата создания:</span>
                  <span className="font-medium">
                    {new Date(selectedMaterialForEdit.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowEditDialog(false);
                setSelectedMaterialForEdit(null);
              }}>
                Отмена
              </Button>
              <Button 
                onClick={handleUpdateMaterial} 
                disabled={updatingMaterial || !editTitle.trim() || !editContent.trim()}
              >
                {updatingMaterial ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <ChatDialog
        open={showChatDialog}
        onOpenChange={setShowChatDialog}
        otherUserId={chatStudentId}
        otherUserName={chatStudentName}
        currentUserId={currentUserId}
      />
    </div>
  );
}