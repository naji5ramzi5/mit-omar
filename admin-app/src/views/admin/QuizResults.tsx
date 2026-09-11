'use client';

import { useState } from 'react';
import {
  Award, Search, Filter, Calendar, Clock, CheckCircle2, XCircle,
  GraduationCap, RefreshCw, User, BookOpen
} from 'lucide-react';
import { SectionHeader, EmptyState, ListLoading, LevelBadge } from './ui';
import { useAdminData } from './api';
import { LEVELS } from './types';

export default function QuizResultsSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading, refresh } = useAdminData<any>('/api/admin/quiz-results', token, 'results');
  const results = items || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');

  const filtered = results.filter((r: any) => {
    const matchesSearch =
      r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = levelFilter === 'all' || r.quizLevel === levelFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pass' && r.passed) ||
      (statusFilter === 'fail' && !r.passed);

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const totalAttempts = results.length;
  const passedAttempts = results.filter((r: any) => r.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  return (
    <div>
      <SectionHeader
        title="نتائج ومحاولات الاختبارات"
        subtitle="سجل نتائج الطلاب ومعدلات النجاح وإحصائيات المحاولات في كافة المستويات"
        action={
          <button
            onClick={refresh}
            className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-orange" />
            تحديث النتائج
          </button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-bold p-4 border-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">إجمالي المحاولات</span>
            <span className="text-xl font-black text-foreground">{totalAttempts}</span>
          </div>
        </div>

        <div className="card-bold p-4 border-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">المحاولات الناجحة</span>
            <span className="text-xl font-black text-emerald-600">{passedAttempts}</span>
          </div>
        </div>

        <div className="card-bold p-4 border-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">نسبة النجاح العامة</span>
            <span className="text-xl font-black text-blue-600">{passRate}%</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card-bold p-4 border-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث باسم الطالب، البريد، أو عنوان الاختبار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 ps-9 pe-4 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="py-2 px-3 rounded-xl bg-secondary border border-border text-xs font-bold focus:outline-none"
          >
            <option value="all">كافة المستويات</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 rounded-xl bg-secondary border border-border text-xs font-bold focus:outline-none"
          >
            <option value="all">كافة النتائج</option>
            <option value="pass">الناجحين فقط ✓</option>
            <option value="fail">الراسبين فقط ✗</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      {loading ? <ListLoading /> : filtered.length === 0 ? (
        <EmptyState icon={Award} text="لا توجد نتائج مسجلة مطابقة للفلاتر" />
      ) : (
        <div className="card-bold overflow-hidden border-2 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3.5 font-bold">الطالب</th>
                  <th className="p-3.5 font-bold">الاختبار والمستوى</th>
                  <th className="p-3.5 font-bold text-center">المحاولة</th>
                  <th className="p-3.5 font-bold text-center">الدرجة</th>
                  <th className="p-3.5 font-bold text-center">النسبة</th>
                  <th className="p-3.5 font-bold text-center">الحالة</th>
                  <th className="p-3.5 font-bold text-center">المدة المستغرقة</th>
                  <th className="p-3.5 font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r: any) => {
                  const dateStr = r.completedAt
                    ? new Date(r.completedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })
                    : '-';

                  const minutes = Math.floor((r.durationSeconds || 0) / 60);
                  const seconds = (r.durationSeconds || 0) % 60;

                  return (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xs shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{r.studentName}</span>
                            <span className="text-[11px] text-muted-foreground block">{r.studentEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <LevelBadge level={r.quizLevel} />
                          <span className="font-bold text-foreground">{r.quizTitle}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-bold">
                        #{r.attemptNumber || 1}
                      </td>

                      <td className="p-3.5 text-center font-mono font-bold">
                        {r.score} / {r.totalQuestions}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`font-black ${r.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                          {r.percentage}%
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          r.passed
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {r.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {r.passed ? 'ناجح' : 'غير ناجح'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center text-muted-foreground font-mono">
                        {minutes} د و {seconds} ث
                      </td>

                      <td className="p-3.5 text-muted-foreground text-[11px]">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
