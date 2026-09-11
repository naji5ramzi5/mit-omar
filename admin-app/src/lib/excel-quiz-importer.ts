/**
 * Deutsch mit Omar — Excel Question Importer & Validator
 * Supports .xlsx & .xls question sheets with preview, validation, and template generation.
 */

import * as XLSX from 'xlsx';
import { QuestionType, RichQuestion } from './quiz-engine';

export interface ExcelRowValidation {
  rowNumber: number;
  raw: any;
  isValid: boolean;
  errors: string[];
  parsedQuestion?: Partial<RichQuestion>;
}

export interface ExcelImportReport {
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  rows: ExcelRowValidation[];
  validQuestions: Partial<RichQuestion>[];
}

const TYPE_MAPPINGS: Record<string, QuestionType> = {
  'single_choice': 'single_choice',
  'اختيار فردي': 'single_choice',
  'اختيار من متعدد': 'single_choice',
  'mcq': 'single_choice',
  'multiple_choice': 'multiple_choice',
  'اختيار متعدد': 'multiple_choice',
  'اكثر من اجابة': 'multiple_choice',
  'أكثر من إجابة': 'multiple_choice',
  'true_false': 'true_false',
  'صح وخطأ': 'true_false',
  'صح/خطأ': 'true_false',
  'صح أو خطأ': 'true_false',
  'fill_blank': 'fill_blank',
  'فراغات': 'fill_blank',
  'إكمال فراغ': 'fill_blank',
  'ملء الفراغ': 'fill_blank',
  'text': 'text',
  'نص': 'text',
  'سؤال نصي': 'text',
  'كتابي': 'text',
  'matching': 'matching',
  'توصيل': 'matching',
  'مطابقة': 'matching',
  'ordering': 'ordering',
  'ترتيب': 'ordering',
  'audio': 'audio',
  'صوتي': 'audio',
  'استماع': 'audio',
  'image': 'image',
  'صورة': 'image',
};

function normalizeHeaderKey(key: string): string {
  const clean = key.trim().toLowerCase().replace(/\s+/g, '_');
  if (['question', 'السؤال', 'نص_السؤال', 'text', 'prompt'].includes(clean)) return 'question';
  if (['question_type', 'type', 'نوع_السؤال', 'النوع'].includes(clean)) return 'question_type';
  if (['option_a', 'الخيار_أ', 'الخيار_a', 'opt_a', 'a'].includes(clean)) return 'option_a';
  if (['option_b', 'الخيار_ب', 'الخيار_b', 'opt_b', 'b'].includes(clean)) return 'option_b';
  if (['option_c', 'الخيار_ج', 'الخيار_c', 'opt_c', 'c'].includes(clean)) return 'option_c';
  if (['option_d', 'الخيار_د', 'الخيار_d', 'opt_d', 'd'].includes(clean)) return 'option_d';
  if (['correct_answer', 'الإجابة_الصحيحة', 'الاجابة_الصحيحة', 'correct', 'answer'].includes(clean)) return 'correct_answer';
  if (['points', 'النقاط', 'الدرجة', 'score'].includes(clean)) return 'points';
  if (['section', 'القسم', 'المحور'].includes(clean)) return 'section';
  if (['explanation', 'التفسير', 'الشرح', 'ملاحظات'].includes(clean)) return 'explanation';
  return clean;
}

/**
 * Parses binary buffer of an Excel file and returns validation report
 */
export function validateExcelQuestions(fileBuffer: Buffer | ArrayBuffer): ExcelImportReport {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return { totalRows: 0, validRowsCount: 0, errorRowsCount: 0, rows: [], validQuestions: [] };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const rows: ExcelRowValidation[] = [];
  const validQuestions: Partial<RichQuestion>[] = [];
  const seenQuestions = new Set<string>();

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 2; // Row 1 is header
    const normalized: Record<string, any> = {};
    for (const [k, v] of Object.entries(raw)) {
      normalized[normalizeHeaderKey(k)] = v;
    }

    const errors: string[] = [];

    // 1. Question Prompt validation
    const questionText = String(normalized.question || '').trim();
    if (!questionText) {
      errors.push('نص السؤال مفقود أو فارغ');
    } else if (seenQuestions.has(questionText.toLowerCase())) {
      errors.push('سؤال مكرر في هذا الملف');
    } else {
      seenQuestions.add(questionText.toLowerCase());
    }

    // 2. Question Type validation
    const rawType = String(normalized.question_type || 'single_choice').trim().toLowerCase();
    const type: QuestionType = TYPE_MAPPINGS[rawType] || 'single_choice';

    // 3. Points validation
    let points = 1;
    if (normalized.points !== undefined && normalized.points !== '') {
      points = Number(normalized.points);
      if (isNaN(points) || points <= 0) {
        errors.push('قيمة النقاط غير صالحة (يجب أن تكون رقماً أكبر من صفر)');
      }
    }

    // 4. Options & Correct Answer validation
    const optionA = String(normalized.option_a || '').trim();
    const optionB = String(normalized.option_b || '').trim();
    const optionC = String(normalized.option_c || '').trim();
    const optionD = String(normalized.option_d || '').trim();
    const rawCorrect = String(normalized.correct_answer || '').trim();

    if (!rawCorrect && type !== 'text') {
      errors.push('الإجابة الصحيحة مفقودة');
    }

    const optionsList: { id: string; textAr: string }[] = [];
    if (optionA) optionsList.push({ id: '1', textAr: optionA });
    if (optionB) optionsList.push({ id: '2', textAr: optionB });
    if (optionC) optionsList.push({ id: '3', textAr: optionC });
    if (optionD) optionsList.push({ id: '4', textAr: optionD });

    let correctAnswers: string[] = [];

    if (type === 'single_choice') {
      if (optionsList.length < 2) {
        errors.push('أسئلة الاختيار الفردي تتطلب خيارين على الأقل (أ، ب)');
      }
      const letter = rawCorrect.toUpperCase();
      let targetId = '1';
      if (letter === 'A' || letter === '1' || letter === 'أ') targetId = '1';
      else if (letter === 'B' || letter === '2' || letter === 'ب') targetId = '2';
      else if (letter === 'C' || letter === '3' || letter === 'ج') targetId = '3';
      else if (letter === 'D' || letter === '4' || letter === 'د') targetId = '4';
      else {
        const found = optionsList.find(o => o.textAr.toLowerCase() === rawCorrect.toLowerCase());
        if (found) targetId = found.id;
        else errors.push(`الإجابة الصحيحة "${rawCorrect}" لا تطابق أي خيار متاح`);
      }
      correctAnswers = [targetId];
    } else if (type === 'multiple_choice') {
      if (optionsList.length < 2) {
        errors.push('أسئلة الاختيار المتعدد تتطلب خيارين على الأقل');
      }
      const parts = rawCorrect.split(/[,;\s]+/).filter(Boolean);
      const mappedIds: string[] = [];
      for (const p of parts) {
        const l = p.toUpperCase();
        if (l === 'A' || l === '1' || l === 'أ') mappedIds.push('1');
        else if (l === 'B' || l === '2' || l === 'ب') mappedIds.push('2');
        else if (l === 'C' || l === '3' || l === 'ج') mappedIds.push('3');
        else if (l === 'D' || l === '4' || l === 'د') mappedIds.push('4');
        else {
          const found = optionsList.find(o => o.textAr.toLowerCase() === p.toLowerCase());
          if (found) mappedIds.push(found.id);
          else errors.push(`الخيار المحدد بالإجابة "${p}" غير موجود`);
        }
      }
      correctAnswers = [...new Set(mappedIds)];
      if (correctAnswers.length === 0) {
        errors.push('لم يتم تحديد أي إجابات صحيحة صالحة');
      }
    } else if (type === 'true_false') {
      const lower = rawCorrect.toLowerCase();
      if (['صح', 'true', 'richtig', 'نعم', '1', 't'].includes(lower)) {
        correctAnswers = ['true'];
      } else if (['خطأ', 'false', 'falsch', 'لا', '0', 'f'].includes(lower)) {
        correctAnswers = ['false'];
      } else {
        errors.push('الإجابة الصحيحة لسؤال صح/خطأ يجب أن تكون: صح أو خطأ');
      }
    } else if (type === 'fill_blank') {
      correctAnswers = rawCorrect.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
      if (correctAnswers.length === 0) {
        errors.push('يرجى كتابة الكلمة الصحيحة لملء الفراغ');
      }
    } else {
      correctAnswers = [rawCorrect];
    }

    const sectionName = String(normalized.section || '').trim() || 'عام';
    const explanation = String(normalized.explanation || '').trim();

    const isValid = errors.length === 0;

    const parsedQuestion: Partial<RichQuestion> = {
      type,
      promptAr: questionText,
      options: optionsList,
      correctAnswers,
      acceptedAnswers: type === 'fill_blank' || type === 'text' ? correctAnswers : undefined,
      points: points > 0 ? points : 1,
      sectionName,
      sectionId: sectionName.toLowerCase().replace(/\s+/g, '-'),
      explanationAr: explanation,
      order: idx + 1,
    };

    if (isValid) {
      validQuestions.push(parsedQuestion);
    }

    rows.push({
      rowNumber,
      raw: normalized,
      isValid,
      errors,
      parsedQuestion: isValid ? parsedQuestion : undefined,
    });
  });

  const validRowsCount = rows.filter(r => r.isValid).length;
  const errorRowsCount = rows.length - validRowsCount;

  return {
    totalRows: rows.length,
    validRowsCount,
    errorRowsCount,
    rows,
    validQuestions,
  };
}

/**
 * Generates an exemplary Excel template ready for download
 */
export function generateExcelTemplate(): Buffer {
  const sampleData = [
    {
      'question': 'Wie heißt die Hauptstadt von Deutschland?',
      'question_type': 'single_choice',
      'option_a': 'München',
      'option_b': 'Berlin',
      'option_c': 'Hamburg',
      'option_d': 'Frankfurt',
      'correct_answer': 'B',
      'points': 1,
      'section': 'Lesen',
      'explanation': 'Berlin ist die Bundeshauptstadt der Bundesrepublik Deutschland.',
    },
    {
      'question': 'Welche dieser Verben sind trennbar? (اختر أكثر من إجابة)',
      'question_type': 'multiple_choice',
      'option_a': 'einkaufen',
      'option_b': 'verstehen',
      'option_c': 'aufstehen',
      'option_d': 'bekommen',
      'correct_answer': 'A,C',
      'points': 2,
      'section': 'Lesen',
      'explanation': 'einkaufen (kauft ein) und aufstehen (steht auf) sind trennbare Verben.',
    },
    {
      'question': 'In Deutschland fährt man auf der rechten Straßenseite.',
      'question_type': 'true_false',
      'option_a': '',
      'option_b': '',
      'option_c': '',
      'option_d': '',
      'correct_answer': 'صح',
      'points': 1,
      'section': 'Lesen',
      'explanation': 'In Deutschland gilt das Rechtsfahrgebot.',
    },
    {
      'question': 'Ich gehe jeden Morgen um 8 Uhr ___ die Arbeit.',
      'question_type': 'fill_blank',
      'option_a': '',
      'option_b': '',
      'option_c': '',
      'option_d': '',
      'correct_answer': 'auf,in',
      'points': 1,
      'section': 'Schreiben',
      'explanation': 'Man sagt: auf die Arbeit gehen.',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set nice column widths
  worksheet['!cols'] = [
    { wch: 45 }, // question
    { wch: 18 }, // question_type
    { wch: 20 }, // option_a
    { wch: 20 }, // option_b
    { wch: 20 }, // option_c
    { wch: 20 }, // option_d
    { wch: 16 }, // correct_answer
    { wch: 10 }, // points
    { wch: 14 }, // section
    { wch: 45 }, // explanation
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الأسئلة النموذجية');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
