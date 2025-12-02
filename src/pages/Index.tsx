import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedLecture, setSelectedLecture] = useState<{title: string; content: string; duration: string} | null>(null);

  const testQuestions = [
    {
      question: 'Какой закон описывает соотношение напряжения, тока и сопротивления в цепи постоянного тока?',
      answers: ['Закон Ома', 'Закон Кирхгофа', 'Закон Джоуля-Ленца', 'Закон Фарадея'],
      correct: 0,
      topic: 'Электрические цепи постоянного тока'
    },
    {
      question: 'Чему равна мощность в цепи постоянного тока?',
      answers: ['P = UI', 'P = I²R', 'P = U²/R', 'Все варианты верны'],
      correct: 3,
      topic: 'Электрические цепи постоянного тока'
    },
    {
      question: 'Первый закон Кирхгофа гласит:',
      answers: [
        'Сумма токов в узле равна нулю',
        'Сумма напряжений в контуре равна нулю',
        'Ток прямо пропорционален напряжению',
        'Мощность равна произведению напряжения на ток'
      ],
      correct: 0,
      topic: 'Электрические цепи постоянного тока'
    },
    {
      question: 'При последовательном соединении резисторов общее сопротивление:',
      answers: ['Уменьшается', 'Увеличивается', 'Не изменяется', 'Становится равным нулю'],
      correct: 1,
      topic: 'Электрические цепи постоянного тока'
    },
    {
      question: 'Что показывает КПД электрической цепи?',
      answers: [
        'Отношение полезной мощности к затраченной',
        'Сопротивление цепи',
        'Силу тока в цепи',
        'Напряжение на нагрузке'
      ],
      correct: 0,
      topic: 'Электрические цепи постоянного тока'
    },
    {
      question: 'Какое соединение источников ЭДС увеличивает напряжение?',
      answers: ['Параллельное', 'Последовательное', 'Смешанное', 'Не зависит от соединения'],
      correct: 1,
      topic: 'Электрические цепи постоянного тока'
    },
    {
      question: 'Что характеризует реактивное сопротивление конденсатора в цепи переменного тока?',
      answers: [
        'Xc = 1/(ωC)',
        'Xc = ωC',
        'Xc = ωL',
        'Xc = R'
      ],
      correct: 0,
      topic: 'Электрические цепи переменного тока'
    },
    {
      question: 'Как изменится ток в цепи переменного тока при увеличении частоты, если в цепи есть конденсатор?',
      answers: ['Увеличится', 'Уменьшится', 'Не изменится', 'Станет равным нулю'],
      correct: 0,
      topic: 'Электрические цепи переменного тока'
    },
    {
      question: 'Что такое резонанс в цепи переменного тока?',
      answers: [
        'Равенство индуктивного и емкостного сопротивлений',
        'Максимальное сопротивление цепи',
        'Минимальный ток в цепи',
        'Отсутствие реактивных элементов'
      ],
      correct: 0,
      topic: 'Электрические цепи переменного тока'
    },
    {
      question: 'Активная мощность в цепи переменного тока определяется как:',
      answers: ['P = UI cos φ', 'P = UI', 'P = I²Xc', 'P = U²/Xc'],
      correct: 0,
      topic: 'Электрические цепи переменного тока'
    },
    {
      question: 'Чему равен сдвиг фаз между током и напряжением в идеальной емкостной цепи?',
      answers: ['90° (ток опережает)', '90° (ток отстает)', '0°', '180°'],
      correct: 0,
      topic: 'Электрические цепи переменного тока'
    },
    {
      question: 'Полное сопротивление цепи переменного тока называется:',
      answers: ['Импеданс', 'Реактанс', 'Резистанс', 'Адмиттанс'],
      correct: 0,
      topic: 'Электрические цепи переменного тока'
    },
    {
      question: 'Какая величина измеряется в Фарадах?',
      answers: ['Сопротивление', 'Индуктивность', 'Емкость', 'Напряжение'],
      correct: 2,
      topic: 'Конденсаторы'
    },
    {
      question: 'Что происходит при последовательном соединении конденсаторов?',
      answers: [
        'Общая емкость увеличивается',
        'Общая емкость уменьшается',
        'Общая емкость не изменяется',
        'Напряжение становится одинаковым'
      ],
      correct: 1,
      topic: 'Конденсаторы'
    },
    {
      question: 'При параллельном соединении конденсаторов общая емкость:',
      answers: [
        'Равна сумме всех емкостей',
        'Меньше наименьшей емкости',
        'Равна произведению емкостей',
        'Не изменяется'
      ],
      correct: 0,
      topic: 'Конденсаторы'
    },
    {
      question: 'Энергия, накопленная в конденсаторе, определяется формулой:',
      answers: ['W = CU²/2', 'W = CU', 'W = C/U', 'W = U/C'],
      correct: 0,
      topic: 'Конденсаторы'
    },
    {
      question: 'Что происходит с зарядом конденсатора после отключения источника питания в идеальной цепи?',
      answers: ['Остается постоянным', 'Уменьшается', 'Увеличивается', 'Становится равным нулю'],
      correct: 0,
      topic: 'Конденсаторы'
    },
    {
      question: 'Диэлектрическая проницаемость влияет на:',
      answers: [
        'Емкость конденсатора',
        'Напряжение на конденсаторе',
        'Заряд конденсатора при постоянном напряжении',
        'Все варианты верны'
      ],
      correct: 3,
      topic: 'Конденсаторы'
    }
  ];

  const studentStats = {
    name: 'Анна Иванова',
    grade: '10 класс',
    testsCompleted: 24,
    averageScore: 85,
    strongSubjects: ['Электрические цепи постоянного тока', 'Конденсаторы'],
    weakSubjects: ['Электрические цепи переменного тока']
  };

  const progressData = [
    { subject: 'Электрические цепи постоянного тока', score: 92, trend: 'up' },
    { subject: 'Конденсаторы', score: 88, trend: 'up' },
    { subject: 'Электрические цепи переменного тока', score: 65, trend: 'up' }
  ];

  const aiRecommendations = [
    {
      subject: 'Электрические цепи переменного тока',
      suggestion: 'Рекомендую уделить внимание реактивным сопротивлениям и резонансным явлениям',
      priority: 'high',
      lectures: [
        {
          title: 'Основы переменного тока',
          duration: '45 мин',
          description: 'Понятие переменного тока, амплитуда, частота, период',
          content: `# Основы переменного тока

## Введение

Переменный ток — это электрический ток, который периодически изменяется по величине и направлению.

## Основные понятия

**Амплитуда (Im)** — максимальное значение тока за период.

**Период (T)** — время одного полного колебания тока.

**Частота (f)** — количество колебаний в секунду, измеряется в Герцах (Гц). Связана с периодом формулой: f = 1/T

**Угловая частота (ω)** — скорость изменения фазы колебаний: ω = 2πf

## Математическое описание

Мгновенное значение переменного тока описывается синусоидальной функцией:

i(t) = Im × sin(ωt + φ)

где:
- i(t) — мгновенное значение тока
- Im — амплитуда тока
- ω — угловая частота
- t — время
- φ — начальная фаза

## Действующее значение

Действующее (эффективное) значение переменного тока — это такое значение постоянного тока, при котором выделяется такая же мощность:

I = Im / √2 ≈ 0,707 × Im

Аналогично для напряжения: U = Um / √2

## Преимущества переменного тока

1. Легко трансформируется
2. Экономичная передача на большие расстояния
3. Простота генерации
4. Возможность изменения параметров

## Применение

Переменный ток используется в:
- Электроснабжении городов и предприятий
- Бытовых электроприборах
- Промышленном оборудовании
- Системах связи`
        },
        {
          title: 'Реактивные сопротивления',
          duration: '50 мин',
          description: 'Индуктивное и емкостное сопротивления, фазовые сдвиги',
          content: `# Реактивные сопротивления

## Введение

Реактивное сопротивление — это сопротивление элементов электрической цепи, обусловленное реакцией на изменение тока или напряжения.

## Индуктивное сопротивление (XL)

Индуктивность препятствует изменению тока в цепи.

**Формула:** XL = ωL = 2πfL

где:
- XL — индуктивное сопротивление (Ом)
- ω — угловая частота
- L — индуктивность (Генри)
- f — частота (Гц)

**Особенности:**
- Ток отстает от напряжения на 90°
- С ростом частоты сопротивление увеличивается
- Не потребляет активную мощность

## Емкостное сопротивление (XC)

Емкость также создает реактивное сопротивление переменному току.

**Формула:** XC = 1/(ωC) = 1/(2πfC)

где:
- XC — емкостное сопротивление (Ом)
- C — емкость (Фарады)

**Особенности:**
- Ток опережает напряжение на 90°
- С ростом частоты сопротивление уменьшается
- Не потребляет активную мощность

## Фазовые сдвиги

**В индуктивной цепи:** φ = +90° (ток отстает)

**В емкостной цепи:** φ = -90° (ток опережает)

**В комбинированной цепи:** φ зависит от соотношения XL и XC

## Полное сопротивление (импеданс)

Для последовательной RLC-цепи:

Z = √(R² + (XL - XC)²)

где:
- Z — полное сопротивление
- R — активное сопротивление

## Практическое значение

Реактивные сопротивления используются в:
- Фильтрах частот
- Колебательных контурах
- Источниках питания
- Системах согласования`
        },
        {
          title: 'Резонанс в цепях переменного тока',
          duration: '40 мин',
          description: 'Последовательный и параллельный резонанс, практические применения',
          content: `# Резонанс в цепях переменного тока

## Что такое резонанс?

Резонанс — это явление резкого возрастания амплитуды колебаний при совпадении частоты внешнего воздействия с собственной частотой колебательной системы.

## Последовательный резонанс (резонанс напряжений)

**Условие резонанса:** XL = XC

При резонансе:
- Полное сопротивление минимально: Z = R
- Ток максимальный: I = U/R
- Напряжения на L и C могут превышать напряжение источника
- Фазовый сдвиг равен нулю

**Резонансная частота:**

f₀ = 1/(2π√(LC))

**Добротность контура:**

Q = (ωL)/R = 1/(ωCR)

Чем выше добротность, тем острее резонансная кривая.

## Параллельный резонанс (резонанс токов)

**Условие резонанса:** BL = BC (реактивные проводимости равны)

При резонансе:
- Полное сопротивление максимально
- Ток от источника минимальный
- Токи в ветвях L и C могут быть очень большими
- Контур имеет чисто активное сопротивление

## Практические применения

### Радиоприемники
Используют резонанс для выделения сигнала нужной частоты из множества радиоволн.

### Генераторы
Обеспечивают устойчивую генерацию колебаний определенной частоты.

### Фильтры
- Полосовые фильтры (пропускают узкий диапазон частот)
- Режекторные фильтры (подавляют определенную частоту)

### Беспроводная передача энергии
Используется резонанс для эффективной передачи энергии.

### Измерительная техника
Резонансные методы измерения L и C.

## Опасность резонанса

В энергетических системах резонанс может привести к:
- Перенапряжениям
- Выходу оборудования из строя
- Аварийным ситуациям

Поэтому необходимо учитывать резонансные явления при проектировании электрических систем.`
        }
      ]
    },
    {
      subject: 'Конденсаторы',
      suggestion: 'Отлично! Продолжайте практиковать расчеты емкостей при различных соединениях',
      priority: 'low',
      lectures: [
        {
          title: 'Устройство и принцип работы конденсаторов',
          duration: '35 мин',
          description: 'Строение конденсатора, типы диэлектриков, основные параметры',
          link: '#'
        },
        {
          title: 'Соединение конденсаторов',
          duration: '40 мин',
          description: 'Последовательное и параллельное соединение, расчет емкостей',
          link: '#'
        }
      ]
    },
    {
      subject: 'Электрические цепи постоянного тока',
      suggestion: 'Попробуйте решить задачи на применение законов Кирхгофа',
      priority: 'medium',
      lectures: [
        {
          title: 'Законы Кирхгофа',
          duration: '55 мин',
          description: 'Первый и второй законы Кирхгофа, методика решения задач',
          link: '#'
        },
        {
          title: 'Расчет сложных электрических цепей',
          duration: '60 мин',
          description: 'Метод узловых потенциалов, метод контурных токов',
          link: '#'
        },
        {
          title: 'Мощность и энергия в цепях постоянного тока',
          duration: '45 мин',
          description: 'Расчет мощности, КПД, закон Джоуля-Ленца',
          link: '#'
        }
      ]
    }
  ];

  const handleStartTest = () => {
    setTestStarted(true);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    setActiveTab('tests');
  };

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...userAnswers, selectedAnswer];
      setUserAnswers(newAnswers);
      
      if (currentQuestion < testQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setTestCompleted(true);
        setShowResult(true);
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === testQuestions[index].correct) {
        correct++;
      }
    });
    return Math.round((correct / testQuestions.length) * 100);
  };

  const restartTest = () => {
    setTestStarted(false);
    setTestCompleted(false);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Icon name="GraduationCap" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Магистраль знаний</h1>
                <p className="text-sm text-muted-foreground">Платформа для успешного обучения</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Icon name="User" size={18} />
              Профиль
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1">
            <TabsTrigger value="home" className="gap-2 py-3">
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="tests" className="gap-2 py-3">
              <Icon name="ClipboardList" size={18} />
              <span className="hidden sm:inline">Тесты</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 py-3">
              <Icon name="User" size={18} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 py-3">
              <Icon name="TrendingUp" size={18} />
              <span className="hidden sm:inline">Аналитика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6 animate-fade-in">
            <Card className="p-8 bg-gradient-to-br from-primary/15 via-primary/10 to-secondary/15 border-primary/30 shadow-lg">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-3">
                    Привет, {studentStats.name.split(' ')[0]}! 👋
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Твой ИИ-помощник готов помочь улучшить успеваемость
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <Button size="lg" className="gap-2" onClick={handleStartTest}>
                      <Icon name="Play" size={20} />
                      Начать тест
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2" onClick={() => setActiveTab('analytics')}>
                      <Icon name="BarChart3" size={20} />
                      Мой прогресс
                    </Button>
                  </div>
                </div>
                <div className="w-full md:w-auto">
                  <div className="relative w-48 h-48 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 animate-pulse"></div>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 to-secondary/30 flex items-center justify-center shadow-inner">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary">{studentStats.averageScore}</div>
                        <div className="text-sm text-muted-foreground">Средний балл</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md">
                    <Icon name="CheckCircle" className="text-primary" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{studentStats.testsCompleted}</div>
                    <div className="text-sm text-muted-foreground">Тестов пройдено</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/20 flex items-center justify-center shadow-md">
                    <Icon name="TrendingUp" className="text-secondary" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{studentStats.strongSubjects.length}</div>
                    <div className="text-sm text-muted-foreground">Сильных раздела</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/25 to-secondary/15 flex items-center justify-center shadow-md">
                    <Icon name="Target" className="text-accent" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">+12%</div>
                    <div className="text-sm text-muted-foreground">Рост за месяц</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-br from-card via-primary/5 to-secondary/5 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <Icon name="Sparkles" className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold">Рекомендации ИИ</h3>
              </div>
              <div className="space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-secondary/10 hover:from-muted hover:to-secondary/20 transition-all hover:shadow-md border border-transparent hover:border-primary/20"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Icon name="Lightbulb" className="text-primary" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{rec.subject}</span>
                        <Badge
                          variant={
                            rec.priority === 'high'
                              ? 'destructive'
                              : rec.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {rec.priority === 'high'
                            ? 'Важно'
                            : rec.priority === 'medium'
                            ? 'Средне'
                            : 'Низко'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{rec.suggestion}</p>
                      
                      {rec.lectures && rec.lectures.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon name="BookOpen" size={16} className="text-primary" />
                            <span className="text-sm font-semibold">Рекомендуемые лекции:</span>
                          </div>
                          {rec.lectures.map((lecture, lectureIndex) => (
                            <button
                              key={lectureIndex}
                              onClick={() => setSelectedLecture({
                                title: lecture.title,
                                content: lecture.content,
                                duration: lecture.duration
                              })}
                              className="block w-full p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all group text-left"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Icon name="Play" size={14} className="text-primary group-hover:text-secondary transition-colors" />
                                    <span className="font-medium text-sm group-hover:text-primary transition-colors">{lecture.title}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{lecture.description}</p>
                                </div>
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                  <Icon name="Clock" size={12} className="mr-1" />
                                  {lecture.duration}
                                </Badge>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="animate-fade-in">
            {!testStarted ? (
              <Card className="p-8 text-center bg-gradient-to-br from-card via-primary/5 to-secondary/10 shadow-lg">
                <div className="max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <Icon name="ClipboardList" className="text-primary" size={48} />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Готовы начать тест?</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Тест содержит {testQuestions.length} вопросов. Выберите один правильный ответ для каждого вопроса.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <Icon name="HelpCircle" className="mx-auto mb-2 text-primary" size={32} />
                      <div className="font-bold text-2xl">{testQuestions.length}</div>
                      <div className="text-sm text-muted-foreground">Вопросов</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-secondary/15 to-secondary/5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <Icon name="Clock" className="mx-auto mb-2 text-secondary" size={32} />
                      <div className="font-bold text-2xl">10</div>
                      <div className="text-sm text-muted-foreground">Минут</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <Icon name="Target" className="mx-auto mb-2 text-primary" size={32} />
                      <div className="font-bold text-2xl">100</div>
                      <div className="text-sm text-muted-foreground">Макс. баллов</div>
                    </div>
                  </div>
                  <Button size="lg" className="gap-2" onClick={handleStartTest}>
                    <Icon name="Play" size={20} />
                    Начать тест
                  </Button>
                </div>
              </Card>
            ) : showResult ? (
              <Card className="p-8 bg-gradient-to-br from-card via-primary/5 to-secondary/10 shadow-lg">
                <div className="max-w-2xl mx-auto text-center">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                    calculateScore() >= 80 ? 'bg-gradient-to-br from-secondary/30 to-secondary/20' : calculateScore() >= 60 ? 'bg-gradient-to-br from-primary/20 to-secondary/15' : 'bg-gradient-to-br from-destructive/30 to-destructive/20'
                  }`}>
                    <Icon 
                      name={calculateScore() >= 80 ? 'Trophy' : calculateScore() >= 60 ? 'Award' : 'AlertCircle'} 
                      className={calculateScore() >= 80 ? 'text-secondary' : calculateScore() >= 60 ? 'text-accent' : 'text-destructive'}
                      size={64} 
                    />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    {calculateScore() >= 80 ? 'Отлично!' : calculateScore() >= 60 ? 'Хорошо!' : 'Нужно подтянуть'}
                  </h2>
                  <div className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">{calculateScore()}%</div>
                  <p className="text-lg text-muted-foreground mb-8">
                    Вы правильно ответили на {userAnswers.filter((ans, idx) => ans === testQuestions[idx].correct).length} из {testQuestions.length} вопросов
                  </p>
                  
                  <div className="space-y-4 mb-8 text-left">
                    <h3 className="text-xl font-bold text-center mb-4">Ваши ответы:</h3>
                    {testQuestions.map((q, idx) => {
                      const isCorrect = userAnswers[idx] === q.correct;
                      return (
                        <div key={idx} className={`p-4 rounded-lg border-2 shadow-sm transition-shadow hover:shadow-md ${
                          isCorrect ? 'border-secondary/30 bg-gradient-to-r from-secondary/10 to-secondary/5' : 'border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5'
                        }`}>
                          <div className="flex items-start gap-3">
                            <Icon 
                              name={isCorrect ? 'CheckCircle2' : 'XCircle'} 
                              className={isCorrect ? 'text-secondary' : 'text-destructive'}
                              size={24}
                            />
                            <div className="flex-1">
                              <div className="font-medium mb-2">{q.question}</div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Ваш ответ: </span>
                                <span className={isCorrect ? 'text-secondary' : 'text-destructive'}>
                                  {q.answers[userAnswers[idx]]}
                                </span>
                                {!isCorrect && (
                                  <>
                                    <br />
                                    <span className="text-muted-foreground">Правильный ответ: </span>
                                    <span className="text-secondary">{q.answers[q.correct]}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button size="lg" onClick={restartTest} className="gap-2">
                      <Icon name="RotateCcw" size={20} />
                      Пройти снова
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setActiveTab('home')} className="gap-2">
                      <Icon name="Home" size={20} />
                      На главную
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 bg-gradient-to-br from-card to-primary/5 shadow-lg">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      Вопрос {currentQuestion + 1} из {testQuestions.length}
                    </h2>
                    <Badge variant="outline" className="text-lg px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10">
                      <Icon name="Zap" size={16} className="mr-2" />
                      Электротехника
                    </Badge>
                  </div>
                  <Progress value={((currentQuestion + 1) / testQuestions.length) * 100} className="h-3" />
                </div>

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-6">{testQuestions[currentQuestion].question}</h3>
                  <div className="space-y-3">
                    {testQuestions[currentQuestion].answers.map((answer, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md ${
                          selectedAnswer === index
                            ? 'border-primary bg-gradient-to-r from-primary/15 to-secondary/10 shadow-md'
                            : 'border-border hover:border-primary/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-primary/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm ${
                              selectedAnswer === index ? 'border-primary bg-gradient-to-br from-primary to-primary/80' : 'border-muted-foreground'
                            }`}
                          >
                            {selectedAnswer === index && <div className="w-3 h-3 rounded-full bg-white"></div>}
                          </div>
                          <span className="font-medium">{answer}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={restartTest}>
                    <Icon name="X" size={20} className="mr-2" />
                    Отменить
                  </Button>
                  <Button onClick={handleNextQuestion} disabled={selectedAnswer === null}>
                    {currentQuestion < testQuestions.length - 1 ? (
                      <>
                        Далее
                        <Icon name="ChevronRight" size={20} className="ml-2" />
                      </>
                    ) : (
                      <>
                        Завершить
                        <Icon name="Check" size={20} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="animate-fade-in">
            <Card className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                      {studentStats.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="gap-2">
                    <Icon name="Upload" size={18} />
                    Загрузить фото
                  </Button>
                </div>

                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{studentStats.name}</h2>
                    <p className="text-muted-foreground text-lg">{studentStats.grade}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Icon name="ThumbsUp" className="text-green-500" size={20} />
                        Сильные стороны
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {studentStats.strongSubjects.map((subject, index) => (
                          <Badge key={index} className="bg-green-100 text-green-700 hover:bg-green-200">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Icon name="AlertCircle" className="text-orange-500" size={20} />
                        Требует внимания
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {studentStats.weakSubjects.map((subject, index) => (
                          <Badge key={index} className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4">Статистика</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-primary">{studentStats.testsCompleted}</div>
                        <div className="text-xs text-muted-foreground mt-1">Тестов</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-secondary">{studentStats.averageScore}%</div>
                        <div className="text-xs text-muted-foreground mt-1">Средний балл</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-green-600">142</div>
                        <div className="text-xs text-muted-foreground mt-1">Часов обучения</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-orange-600">18</div>
                        <div className="text-xs text-muted-foreground mt-1">Достижений</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Icon name="BarChart3" className="text-primary" size={28} />
                Прогресс по предметам
              </h2>
              <div className="space-y-6">
                {progressData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{item.subject}</span>
                        {item.trend === 'up' && <Icon name="TrendingUp" className="text-green-500" size={16} />}
                        {item.trend === 'down' && (
                          <Icon name="TrendingDown" className="text-red-500" size={16} />
                        )}
                        {item.trend === 'stable' && <Icon name="Minus" className="text-gray-500" size={16} />}
                      </div>
                      <span className="font-bold text-lg">{item.score}%</span>
                    </div>
                    <Progress value={item.score} className="h-3" />
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Icon name="Calendar" className="text-primary" size={20} />
                  Активность за неделю
                </h3>
                <div className="space-y-3">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium">{day}</span>
                      <div className="flex-1">
                        <div
                          className="h-8 rounded bg-primary/20"
                          style={{ width: `${Math.random() * 60 + 40}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Icon name="Award" className="text-primary" size={20} />
                  Последние достижения
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50">
                    <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                      <Icon name="Trophy" className="text-yellow-700" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Отличник недели</div>
                      <div className="text-xs text-muted-foreground">5 тестов подряд на 90+</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                      <Icon name="Zap" className="text-blue-700" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Быстрый старт</div>
                      <div className="text-xs text-muted-foreground">10 тестов за день</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                      <Icon name="Star" className="text-purple-700" size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Математический гений</div>
                      <div className="text-xs text-muted-foreground">100% по математике</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <Icon name="BookOpen" className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedLecture.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Icon name="Clock" size={14} />
                    <span>{selectedLecture.duration}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLecture(null)}
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
              >
                <Icon name="X" size={24} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-slate max-w-none">
                {selectedLecture.content ? selectedLecture.content.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold mb-4 mt-6">{line.substring(2)}</h1>;
                  } else if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-bold mb-3 mt-5">{line.substring(3)}</h2>;
                  } else if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-bold mb-2 mt-4">{line.substring(4)}</h3>;
                  } else if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={index} className="font-bold mb-2">{line.substring(2, line.length - 2)}</p>;
                  } else if (line.startsWith('- ')) {
                    return <li key={index} className="ml-4 mb-1">{line.substring(2)}</li>;
                  } else if (line.trim() === '') {
                    return <div key={index} className="h-2"></div>;
                  } else {
                    return <p key={index} className="mb-2 text-muted-foreground">{line}</p>;
                  }
                }) : (
                  <div className="text-center py-8">
                    <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Содержимое лекции скоро будет добавлено</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-muted/30">
              <Button
                onClick={() => setSelectedLecture(null)}
                className="w-full"
                size="lg"
              >
                Закрыть лекцию
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;