'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Printer, Loader2, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';

interface CheckResult {
  eligible: boolean;
  name?: string;
  courseTitle?: { ar: string; de: string; en: string };
  completedAt?: string | null;
  progress?: { completed: number; total: number };
}

export default function CertificateView() {
  const { locale, viewParams, goBack, navigate } = useAppStore();
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<CheckResult | null>(null);

  const ui =
    locale === 'ar'
      ? {
          badge: 'شهادة إتمام',
          title: 'شهادة إتمام الكورس',
          checking: 'جارٍ التحقق من تقدمك في الكورس…',
          ineligible: "لم تكمل هذا الكورس بعد",
          ineligibleHint: (p: CheckResult['progress']) => p ? `أكملت ${p.completed} من ${p.total} درساً — واصل التقدم!` : 'أكمل جميع الدروس للحصول على شهادتك',
          backToCourses: 'عودة إلى دوراتي',
          goStudent: 'اذهب إلى دوراتي',
          certificate: 'شهادة إتمام',
          thisCertifies: 'يشهد الأستاذ محمد عمر بأن',
          hasCompleted: 'قد أتم بنجاح',
          courseName: (title: string) => title || 'دورة اللغة الألمانية',
          dated: 'بتاريخ',
          download: 'طباعة / حفظ PDF',
          print: 'طباعة',
          passNote: 'هذه الشهادة تعبّر عن إكمال متطلبات الكورس بنجاح.',
        }
      : locale === 'de'
      ? {
          badge: 'Zertifikat',
          title: 'Kursabschluss-Zertifikat',
          checking: 'Wir prüfen deinen Kursfortschritt…',
          ineligible: 'Du hast diesen Kurs noch nicht abgeschlossen',
          ineligibleHint: (p: CheckResult['progress']) => p ? `Du hast ${p.completed} von ${p.total} Lektionen abgeschlossen – weiter so!` : 'Schließe alle Lektionen ab, um dein Zertifikat zu erhalten',
          backToCourses: 'Zurück zu meinen Kursen',
          goStudent: 'Zu meinen Kursen',
          certificate: 'Zertifikat',
          thisCertifies: 'Hiermit wird bescheinigt, dass',
          hasCompleted: 'den Kurs erfolgreich abgeschlossen hat',
          courseName: (title: string) => title || 'Deutschkurs',
          dated: 'Ausgestellt am',
          download: 'Drucken / PDF speichern',
          print: 'Drucken',
          passNote: 'Dieses Zertifikat bestätigt den erfolgreichen Abschluss des Kurses.',
        }
      : {
          badge: 'Certificate',
          title: 'Course Completion Certificate',
          checking: 'Checking your course progress…',
          ineligible: 'You have not completed this course yet',
          ineligibleHint: (p: CheckResult['progress']) => p ? `You completed ${p.completed} of ${p.total} lessons — keep it up!` : 'Complete all lessons to earn your certificate',
          backToCourses: 'Back to my courses',
          goStudent: 'Go to my courses',
          certificate: 'Certificate of Completion',
          thisCertifies: 'This certifies that',
          hasCompleted: 'has successfully completed',
          courseName: (title: string) => title || 'German Language Course',
          dated: 'Dated',
          download: 'Print / Save as PDF',
          print: 'Print',
          passNote: 'This certificate acknowledges the successful completion of the course.',
        };

  useEffect(() => {
    const courseId = viewParams.courseId || 'none';
    fetch(`/api/certificates/check?courseId=${courseId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('dmo-token') || ''}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setResult({
          eligible: !!d.eligible,
          name: d.name || user?.name || '',
          courseTitle: d.courseTitle,
          completedAt: d.completedAt,
          progress: d.progress,
        });
      })
      .catch(() => setResult({ eligible: false }))
      .finally(() => setChecking(false));
  }, [viewParams.courseId, user?.name]);

  const formattedDate = () => {
    const date = result?.completedAt ? new Date(result.completedAt) : new Date();
    return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-brand-orange" />
        </motion.div>
        <p className="text-sm text-muted-foreground font-semibold">{ui.checking}</p>
      </div>
    );
  }

  if (!result?.eligible) {
    return (
      <div className="pt-12 pb-24">
        <div className="container-bold max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-bold p-10 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-amber-400/20 to-brand-orange/20 flex items-center justify-center">
              <Award className="w-8 h-8 text-brand-orange" />
            </div>
            <h1 className="font-display text-xl font-black text-foreground mb-2">{ui.ineligible}</h1>
            <p className="text-sm text-muted-foreground mb-8">{ui.ineligibleHint(result?.progress)}</p>
            <button onClick={() => navigate('student')} className="btn-bold-primary w-full justify-center">
              <ChevronRight className="w-4 h-4" />
              {ui.goStudent}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-24 print:pt-0 print:pb-0">
      <div className="container-bold max-w-3xl">
        <div className="hidden print:block text-center mb-6">
          <span className="level-badge">{ui.badge}</span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
          <div>
            <span className="level-badge mb-2 inline-block">{ui.badge}</span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">{ui.title}</h1>
          </div>
          <div className="flex gap-2.5">
            <button onClick={goBack} className="btn-bold-secondary text-xs px-4 py-2.5">
              {ui.backToCourses}
            </button>
            <button onClick={() => window.print()} className="btn-bold-primary text-xs px-4 py-2.5">
              <Download className="w-4 h-4" />
              {ui.download}
            </button>
          </div>
        </div>

        {/* Certificate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={locale === 'ar' ? 'text-right' : 'text-left'}
        >
          <div
            id="certificate-print"
            className="relative bg-white dark:bg-card rounded-2xl border border-border shadow-lg overflow-hidden print:border-2 print:shadow-none"
          >
            {/* Decorative frame */}
            <div className="absolute inset-3 border border-brand-orange/20 rounded-xl pointer-events-none" />
            <div className="absolute inset-[18px] border-2 border-dashed border-brand-orange/20 rounded-lg pointer-events-none" />

            <div className="relative px-8 sm:px-16 py-12 sm:py-16">
              {/* Top seal */}
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-md">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>

              <p className="text-center text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-brand-orange mb-4">
                {ui.certificate}
              </p>

              <p className="text-center text-sm text-foreground/70 mb-2">{ui.thisCertifies}</p>
              <h2 className="text-center font-display text-3xl sm:text-5xl font-black text-foreground mb-3 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange bg-clip-text text-transparent">
                {result.name}
              </h2>
              <p className="text-center text-sm text-foreground/70 mb-6">{ui.hasCompleted}</p>

              <div className="text-center mb-8">
                <span className="inline-block px-6 sm:px-10 py-2.5 rounded-full bg-brand-orange/10 border border-brand-orange/25">
                  <span className="font-display text-lg sm:text-2xl font-black text-brand-orange">
                    {ui.courseName(result.courseTitle?.[locale] || result.courseTitle?.ar || '')}
                  </span>
                </span>
              </div>

              <div className="text-center mb-10">
                <span className="text-xs text-muted-foreground font-semibold">{ui.dated}</span>
                <span className="block text-sm font-bold text-foreground mt-1">{formattedDate()}</span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto">
                <div className="text-center">
                  <div className="h-px bg-foreground/20 mb-2" />
                  <p className="text-xs font-bold text-foreground">Mohamed Omar</p>
                  <p className="text-[10px] text-muted-foreground">Deutsch mit Omar</p>
                </div>
                <div className="text-center print:hidden">
                  <div className="h-px bg-foreground/20 mb-2" />
                  <p className="text-xs font-bold text-foreground">www.deutsch-mit-omar.com</p>
                  <p className="text-[10px] text-muted-foreground">{ui.passNote}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6 print:hidden">{ui.passNote}</p>
      </div>
    </div>
  );
}