'use client';

import { useState } from 'react';
import { toast } from './toast';
import { Eye, ArrowRight, Users, BookOpen, CheckCircle2, Trash2, Loader2, Mail, Phone } from 'lucide-react';
import { PrimaryButton, GhostButton, ConfirmDialog, SectionHeader, EmptyState, LevelBadge, ListLoading } from './ui';
import { adminFetch, fieldOf, useAdminData } from './api';
import { Student, StudentDetail } from './types';

export default function StudentsSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading: listLoading, refresh } = useAdminData<Student>('/api/admin/students', token, 'students');
  const students = items || [];
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleView = async (s: Student) => {
    setLoadingDetail(true);
    try {
      const data = await adminFetch<{ student: StudentDetail }>(`/api/admin/students/${s.id}`, token);
      setDetail(data.student);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingDetail(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/students/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الطالب');
      setDeleteId(null);
      setDetail(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  if (detail) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setDetail(null)} className="p-2 hover:bg-secondary rounded-xl transition-all"><ArrowRight className="w-5 h-5" /></button>
          <h2 className="text-xl font-black text-foreground">تفاصيل الطالب</h2>
        </div>

        <div className="card-bold p-6 border-2 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center text-2xl font-black shrink-0">
              {detail.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-foreground">{detail.name}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{detail.email}</span>
                {detail.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{detail.phone}</span>}
              </div>
            </div>
            <button onClick={() => setDeleteId(detail.id)} className="mr-auto p-2.5 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all" title="حذف الطالب"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 bg-secondary/50 rounded-2xl">
              <p className="text-2xl font-black text-foreground">{detail._count?.enrollments || 0}</p>
              <p className="text-xs font-bold text-muted-foreground mt-1">اشتراكات</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-2xl">
              <p className="text-2xl font-black text-foreground">{detail._count?.lessonProgress || 0}</p>
              <p className="text-xs font-bold text-muted-foreground mt-1">دروس مكتملة</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-2xl">
              <p className="text-sm font-black text-foreground">{new Date(detail.createdAt).toLocaleDateString('ar')}</p>
              <p className="text-xs font-bold text-muted-foreground mt-1">تاريخ الانضمام</p>
            </div>
          </div>
        </div>

        <h3 className="text-sm font-black text-foreground mb-3">الدورات المسجلة</h3>
        <div className="space-y-3">
          {detail.enrollments.map((e) => (
            <div key={e.id} className="card-bold p-4 flex items-center justify-between border-2">
              <div className="flex items-center gap-3">
                <LevelBadge level={e.course.level} />
                <div>
                  <p className="text-sm font-bold text-foreground">{fieldOf(e.course as any, 'title', locale)}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>البدء: {new Date(e.activatedAt).toLocaleDateString('ar')}</span>
                    <span>•</span>
                    <span>الانتهاء: {e.expiresAt ? new Date(e.expiresAt).toLocaleDateString('ar') : 'غير محدد (مفتوح)'}</span>
                  </div>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${e.isActive ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>
                {e.isActive ? 'فعال' : 'منتهي الصلاحية'}
              </span>
            </div>
          ))}
          {detail.enrollments.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">لا توجد اشتراكات</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="الطلاب" subtitle="قائمة الطلاب المسجلين واشتراكاتهم" action={
        <span className="text-sm font-bold text-muted-foreground bg-brand-orange/10 px-3 py-1.5 rounded-xl">{students.length} طالب</span>
      } />

      {listLoading ? <ListLoading /> : students.length === 0 ? (
        <EmptyState icon={Users} text="لا يوجد طلاب بعد" />
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s.id} className="card-bold p-5 flex items-center justify-between gap-4 border-2 hover:border-brand-orange/30 transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red text-white flex items-center justify-center text-sm font-black shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">{s._count?.enrollments || 0} دورة</span>
                <button onClick={() => handleView(s)} className="p-2.5 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/5 transition-all" title="عرض"><Eye className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
        </div>
      )}

      <ConfirmDialog open={!!deleteId} message="هل أنت متأكد من حذف هذا الطالب؟" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleting} />
    </div>
  );
}
