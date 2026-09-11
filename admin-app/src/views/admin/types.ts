export interface Course {
  id: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  level: string;
  imageUrl?: string | null;
  order: number;
  isActive: boolean;
  _count?: { lessons: number; enrollments: number };
}

export interface Lesson {
  id: string;
  courseId: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  videoUrl?: string | null;
  videoId?: string | null;
  duration: number;
  order: number;
  isFree: boolean;
}

export interface Post {
  id: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  contentAr?: string | null;
  contentDe?: string | null;
  contentEn?: string | null;
  excerptAr?: string | null;
  excerptDe?: string | null;
  excerptEn?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  images?: any[] | null;
  isPublished: boolean;
  createdAt: string;
}

export interface Banner {
  id: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string | null;
  link?: string | null;
  pageSlug?: string | null;
  labelAr?: string | null;
  labelDe?: string | null;
  labelEn?: string | null;
  order: number;
  isActive: boolean;
}

export interface Quiz {
  id: string;
  level: string;
  titleAr: string;
  titleDe: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  isActive: boolean;
  durationMinutes?: number;
  passingScore?: number;
  allowedAttempts?: number;
  showDetailedResults?: boolean;
  instructionsAr?: string;
  instructionsDe?: string;
  sections?: any[];
  examType?: string;
  _count?: { questions: number; quizAttempts: number };
}

export interface Question {
  id: string;
  quizId: string;
  textAr: string;
  textDe: string;
  textEn: string;
  imageUrl?: string | null;
  option1Ar: string;
  option1De: string;
  option1En: string;
  option2Ar: string;
  option2De: string;
  option2En: string;
  option3Ar: string;
  option3De: string;
  option3En: string;
  option4Ar: string;
  option4De: string;
  option4En: string;
  correctOption: number;
  order: number;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt: string;
  _count?: { enrollments: number };
}

export interface StudentDetail extends Student {
  enrollments: Array<{
    id: string;
    course: { id: string; titleAr: string; titleDe: string; titleEn: string; level: string };
    activatedAt: string;
    expiresAt: string | null;
    isActive: boolean;
  }>;
  _count?: { enrollments: number; lessonProgress: number };
}

export interface Testimonial {
  id: string;
  nameAr: string;
  nameDe: string;
  nameEn: string;
  roleAr?: string | null;
  roleDe?: string | null;
  roleEn?: string | null;
  textAr: string;
  textDe: string;
  textEn: string;
  level?: string | null;
  rating: number;
  avatar?: string | null;
  isActive: boolean;
  order: number;
}

export interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalStudents: number;
  totalCourses: number;
  totalPosts: number;
  totalEnrollments: number;
  activeEnrollments: number;
  totalSubscribers: number;
  visits: {
    today: number;
    week: number;
    month: number;
    total: number;
    last14: Array<{ day: string; count: number }>;
  };
  enrollmentsThisMonth: number;
  quizStats: {
    attempts: number;
    avgScore: number;
  };
  lessonProgress: {
    completed: number;
    total: number;
    rate: number;
  };
}

export type SettingsMap = Record<string, string>;

export interface ActivationCode {
  id: string;
  code: string;
  courseId: string;
  isUsed: boolean;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  course?: { titleAr: string; titleDe: string; titleEn: string; level: string } | null;
  user?: { name: string; email: string } | null;
}

export interface Booking {
  id: string;
  studentName: string;
  phoneNumber: string;
  level: string;
  preferredDate: string;
  teacherName?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const POST_CATEGORIES = ['education', 'exams', 'lifestyle', 'grammar'];
