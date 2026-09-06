import type { LessonModule } from '../types';

export const LESSON_MODULES: LessonModule[] = [
  {
    moduleId: 1,
    moduleTitle: 'Арабский алфавит и махраджи',
    moduleDescription: 'Изучаем 28 букв, их звучание и место образования',
    lessonsCount: 16,
    icon: 'text-outline', // Ionicons
    color: '#0D6B4E', // primary green
    totalXP: 400,
  },
  {
    moduleId: 2,
    moduleTitle: 'Харакаты и слитное письмо',
    moduleDescription: 'Огласовки, сукун, шадда, танвин и соединение букв',
    lessonsCount: 17,
    icon: 'create-outline',
    color: '#D4A745', // gold
    totalXP: 450,
  },
  {
    moduleId: 3,
    moduleTitle: 'Мадды — удлинение звуков',
    moduleDescription: 'Все виды удлинений: таби\'и, муттасыль, лязим',
    lessonsCount: 12,
    icon: 'musical-notes-outline',
    color: '#4A90D9', // blue
    totalXP: 350,
  },
  {
    moduleId: 4,
    moduleTitle: 'Полный курс Таджвида',
    moduleDescription: 'Правила нун сакина, мим сакина, калькаля, ра',
    lessonsCount: 22,
    icon: 'school-outline',
    color: '#9B59B6', // purple
    totalXP: 700,
  },
  {
    moduleId: 5,
    moduleTitle: 'Практика на сурах',
    moduleDescription: 'Аль-Фатиха, Аль-Ихлас, Аль-Фаляк, Ан-Нас и другие',
    lessonsCount: 11,
    icon: 'book-outline',
    color: '#E74C3C', // red
    totalXP: 500,
  },
];
