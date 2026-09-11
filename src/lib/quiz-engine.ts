/**
 * Deutsch mit Omar — Advanced Examination & Question Engine
 * Goethe-style structural architecture for German language tests.
 */

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'text'
  | 'matching'
  | 'ordering'
  | 'audio'
  | 'image';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface ExamSection {
  id: string;
  titleAr: string;
  titleDe: string;
  titleEn?: string;
  descriptionAr?: string;
  order: number;
  durationMinutes?: number;
}

export interface RichQuestion {
  id: string;
  quizId: string;
  sectionId?: string;
  sectionName?: string;
  type: QuestionType;
  promptAr: string;
  promptDe?: string;
  promptEn?: string;
  options?: { id: string; textAr: string; textDe?: string }[];
  correctAnswers?: string[]; // IDs or strings for server scoring
  matchingPairs?: MatchingPair[]; // For matching type
  orderingItems?: { id: string; text: string; correctIndex: number }[]; // For ordering type
  acceptedAnswers?: string[]; // For fill in the blank
  audioUrl?: string | null;
  imageUrl?: string | null;
  explanationAr?: string;
  explanationDe?: string;
  points: number;
  order: number;
}

export interface ExamMeta {
  quizId: string;
  durationMinutes: number; // 0 = unlimited
  passingScore: number; // e.g. 60 (%)
  allowedAttempts: number; // 0 = unlimited, 1 = once
  showDetailedResults: boolean;
  instructionsAr?: string;
  instructionsDe?: string;
  sections: ExamSection[];
  examType: 'general' | 'goethe_model' | 'level_assessment' | 'unit_quiz';
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAnswer {
  questionId: string;
  selectedOption?: string; // single choice, true/false
  selectedOptions?: string[]; // multiple choice
  textValue?: string; // fill blank, text answer
  matchingMatches?: Record<string, string>; // leftId -> rightId
  orderedIds?: string[]; // array of item IDs in chosen order
}

export interface SectionScore {
  sectionId?: string;
  sectionTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface ExamEvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  incorrectCount: number;
  totalQuestions: number;
  sectionScores: SectionScore[];
  questionResults?: {
    questionId: string;
    isCorrect: boolean;
    earnedPoints: number;
    maxPoints: number;
    userAnswer: any;
    correctAnswer?: any;
    explanation?: string;
  }[];
}

/**
 * Standard default Goethe-style sections
 */
export const DEFAULT_GOETHE_SECTIONS: ExamSection[] = [
  { id: 'lesen', titleAr: 'القراءة (Lesen)', titleDe: 'Lesen', order: 1, durationMinutes: 25 },
  { id: 'hoeren', titleAr: 'الاستماع (Hören)', titleDe: 'Hören', order: 2, durationMinutes: 20 },
  { id: 'schreiben', titleAr: 'الكتابة (Schreiben)', titleDe: 'Schreiben', order: 3, durationMinutes: 20 },
  { id: 'sprechen', titleAr: 'المحادثة (Sprechen)', titleDe: 'Sprechen', order: 4, durationMinutes: 15 },
];

/**
 * Normalizes question from database row
 */
export function normalizeQuestion(row: any): RichQuestion {
  let meta: any = {};
  if (row.textDe && row.textDe.startsWith('{')) {
    try {
      meta = JSON.parse(row.textDe);
    } catch {
      meta = {};
    }
  }

  const type: QuestionType = meta.type || 'single_choice';

  // Build standard options if legacy format
  let options = meta.options;
  if (!options && (row.option1Ar || row.option2Ar)) {
    options = [
      { id: '1', textAr: row.option1Ar || '', textDe: row.option1De || '' },
      { id: '2', textAr: row.option2Ar || '', textDe: row.option2De || '' },
      { id: '3', textAr: row.option3Ar || '', textDe: row.option3De || '' },
      { id: '4', textAr: row.option4Ar || '', textDe: row.option4De || '' },
    ].filter(o => o.textAr);
  }

  // Determine correct answers
  let correctAnswers = meta.correctAnswers;
  if (!correctAnswers && row.correctOption) {
    correctAnswers = [String(row.correctOption)];
  }

  return {
    id: row.id,
    quizId: row.quizId,
    sectionId: meta.sectionId || 'general',
    sectionName: meta.sectionName || 'القسم العام',
    type,
    promptAr: row.textAr || '',
    promptDe: meta.promptDe || '',
    promptEn: row.textEn || '',
    options: options || [],
    correctAnswers: correctAnswers || [],
    matchingPairs: meta.matchingPairs || [],
    orderingItems: meta.orderingItems || [],
    acceptedAnswers: meta.acceptedAnswers || [],
    audioUrl: meta.audioUrl || null,
    imageUrl: row.imageUrl || meta.imageUrl || null,
    explanationAr: meta.explanationAr || '',
    explanationDe: meta.explanationDe || '',
    points: meta.points && meta.points > 0 ? Number(meta.points) : 1,
    order: row.order ?? 0,
  };
}

/**
 * Sanitizes questions for student view (removes correct answers and explanations)
 */
export function sanitizeQuestionsForStudent(questions: RichQuestion[]): any[] {
  return questions.map(q => ({
    id: q.id,
    quizId: q.quizId,
    sectionId: q.sectionId,
    sectionName: q.sectionName,
    type: q.type,
    promptAr: q.promptAr,
    promptDe: q.promptDe,
    options: q.options?.map(o => ({ id: o.id, textAr: o.textAr, textDe: o.textDe })),
    matchingPairs: q.matchingPairs ? {
      left: q.matchingPairs.map(p => ({ id: p.id, text: p.left })),
      right: [...q.matchingPairs.map(p => ({ id: p.id, text: p.right }))].sort(() => Math.random() - 0.5),
    } : undefined,
    orderingItems: q.orderingItems ? [...q.orderingItems.map(i => ({ id: i.id, text: i.text }))].sort(() => Math.random() - 0.5) : undefined,
    audioUrl: q.audioUrl,
    imageUrl: q.imageUrl,
    points: q.points,
    order: q.order,
  }));
}

/**
 * Evaluates student answers securely on the server
 */
export function evaluateExam(
  questions: RichQuestion[],
  answers: Record<string, StudentAnswer>,
  examMeta?: Partial<ExamMeta>
): ExamEvaluationResult {
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  const sectionMap = new Map<string, { title: string; score: number; maxScore: number }>();

  const questionResults = questions.map(q => {
    const sId = q.sectionId || 'general';
    const sTitle = q.sectionName || 'عام';

    if (!sectionMap.has(sId)) {
      sectionMap.set(sId, { title: sTitle, score: 0, maxScore: 0 });
    }
    const sec = sectionMap.get(sId)!;
    sec.maxScore += q.points;
    maxScore += q.points;

    const studentAns = answers[q.id];
    let isCorrect = false;

    if (studentAns) {
      switch (q.type) {
        case 'single_choice': {
          const selected = String(studentAns.selectedOption || '').trim();
          isCorrect = q.correctAnswers?.includes(selected) ?? false;
          break;
        }
        case 'multiple_choice': {
          const selected = (studentAns.selectedOptions || []).map(s => String(s).trim()).sort();
          const target = (q.correctAnswers || []).map(s => String(s).trim()).sort();
          isCorrect = selected.length === target.length && selected.every((val, idx) => val === target[idx]);
          break;
        }
        case 'true_false': {
          const selected = String(studentAns.selectedOption || '').trim().toLowerCase();
          const target = (q.correctAnswers?.[0] || '').trim().toLowerCase();
          isCorrect = selected === target;
          break;
        }
        case 'fill_blank': {
          const text = (studentAns.textValue || '').trim().toLowerCase();
          const valid = (q.acceptedAnswers || q.correctAnswers || []).map(a => a.trim().toLowerCase());
          isCorrect = valid.includes(text);
          break;
        }
        case 'text': {
          const text = (studentAns.textValue || '').trim();
          // Text answers: if accepted keywords are defined, check for any keyword; otherwise non-empty awards points
          if (q.acceptedAnswers && q.acceptedAnswers.length > 0) {
            isCorrect = q.acceptedAnswers.some(k => text.toLowerCase().includes(k.trim().toLowerCase()));
          } else {
            isCorrect = text.length > 3;
          }
          break;
        }
        case 'matching': {
          const matches = studentAns.matchingMatches || {};
          if (q.matchingPairs && q.matchingPairs.length > 0) {
            const allMatched = q.matchingPairs.every(pair => matches[pair.id] === pair.id);
            isCorrect = allMatched;
          }
          break;
        }
        case 'ordering': {
          const orderedIds = studentAns.orderedIds || [];
          if (q.orderingItems && q.orderingItems.length > 0) {
            const correctOrder = [...q.orderingItems].sort((a, b) => a.correctIndex - b.correctIndex).map(i => i.id);
            isCorrect = orderedIds.length === correctOrder.length && orderedIds.every((id, idx) => id === correctOrder[idx]);
          }
          break;
        }
        case 'audio':
        case 'image': {
          const selected = String(studentAns.selectedOption || studentAns.textValue || '').trim();
          isCorrect = (q.correctAnswers || []).some(a => a.trim().toLowerCase() === selected.toLowerCase());
          break;
        }
        default:
          isCorrect = false;
      }
    }

    const earnedPoints = isCorrect ? q.points : 0;
    if (isCorrect) {
      correctCount++;
      totalScore += earnedPoints;
      sec.score += earnedPoints;
    } else {
      incorrectCount++;
    }

    return {
      questionId: q.id,
      isCorrect,
      earnedPoints,
      maxPoints: q.points,
      userAnswer: studentAns,
      correctAnswer: q.correctAnswers,
      explanation: q.explanationAr,
    };
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passingScore = examMeta?.passingScore ?? 60;
  const passed = percentage >= passingScore;

  const sectionScores: SectionScore[] = Array.from(sectionMap.entries()).map(([secId, data]) => ({
    sectionId: secId,
    sectionTitle: data.title,
    score: data.score,
    maxScore: data.maxScore,
    percentage: data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0,
  }));

  return {
    totalScore,
    maxScore,
    percentage,
    passed,
    passingScore,
    correctCount,
    incorrectCount,
    totalQuestions: questions.length,
    sectionScores,
    questionResults,
  };
}
