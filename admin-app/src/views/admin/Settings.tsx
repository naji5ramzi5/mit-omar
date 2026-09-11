'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from './toast';
import { Save, KeyRound } from 'lucide-react';
import {
  PrimaryButton, SectionHeader, FormRow, LangInput, ImageField, inputClass,
} from './ui';
import { adminFetch } from './api';
import { SettingsMap } from './types';

export default function SettingsSection({
  token, user,
}: {
  token: string;
  user: { id: string; name: string } | null;
}) {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [stats, setStats] = useState({
    stats_students: '500',
    stats_years: '8',
    stats_courses: '20',
    stats_lessons: '1000',
  });
  const [profile, setProfile] = useState({
    teacher_image: '',
    aboutAr: '',
    aboutDe: '',
    aboutEn: '',
  });
  const [saving, setSaving] = useState(false);

  // change password
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await adminFetch<{ settings: SettingsMap }>('/api/admin/settings', token);
      setSettings({ ...res.settings });
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setStats({
      stats_students: settings.stats_students || '500',
      stats_years: settings.stats_years || '8',
      stats_courses: settings.stats_courses || '20',
      stats_lessons: settings.stats_lessons || '1000',
    });
    setProfile({
      teacher_image: settings.teacher_image || '',
      aboutAr: settings.aboutAr || '',
      aboutDe: settings.aboutDe || '',
      aboutEn: settings.aboutEn || '',
    });
  }, [settings]);

  const saveSettings = async (subset: Record<string, string>, after?: () => void) => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', token, { method: 'PUT', body: JSON.stringify({ settings: subset }) });
      toast.success('تم الحفظ');
      after?.();
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pw.current || !pw.next) { toast.error('أدخل كلمة المرور الحالية والجديدة'); return; }
    if (pw.next !== pw.confirm) { toast.error('تأكيد كلمة المرور غير متطابق'); return; }
    setPwSaving(true);
    try {
      await adminFetch('/api/admin/change-password', token, { method: 'POST', body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }) });
      toast.success('تم تغيير كلمة المرور');
      setPw({ current: '', next: '', confirm: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setPwSaving(false); }
  };

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <section className="card-bold p-6 border-2">
        <SectionHeader title="إحصائيات الصفحة الرئيسية" subtitle="الأرقام المعروضة في قسم الإحصائيات" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <FormRow label="عدد الطلاب">
            <input type="number" value={stats.stats_students} onChange={(e) => setStats({ ...stats, stats_students: e.target.value })} className={inputClass} />
          </FormRow>
          <FormRow label="سنوات الخبرة">
            <input type="number" value={stats.stats_years} onChange={(e) => setStats({ ...stats, stats_years: e.target.value })} className={inputClass} />
          </FormRow>
          <FormRow label="عدد الدورات">
            <input type="number" value={stats.stats_courses} onChange={(e) => setStats({ ...stats, stats_courses: e.target.value })} className={inputClass} />
          </FormRow>
          <FormRow label="عدد الدروس">
            <input type="number" value={stats.stats_lessons} onChange={(e) => setStats({ ...stats, stats_lessons: e.target.value })} className={inputClass} />
          </FormRow>
        </div>
        <div className="flex justify-end mt-4">
          <PrimaryButton icon={Save} disabled={saving} onClick={() => saveSettings(stats)}>حفظ الإحصائيات</PrimaryButton>
        </div>
      </section>

      {/* Teacher profile */}
      <section className="card-bold p-6 border-2">
        <SectionHeader title="الملف الشخصي للأستاذ" subtitle="صورة الأستاذ عمر تظهر في الصفحة الرئيسية وصفحة من نحن" />
        <div className="mt-4 space-y-5">
          <FormRow label="صورة الأستاذ (تظهر في الرئيسية وصفحة من نحن)">
            <ImageField
              value={profile.teacher_image}
              onChange={(v) => setProfile({ ...profile, teacher_image: v || '' })}
              placeholder="انقر لرفع صورة الأستاذ عمر من الكمبيوتر أو اسحبها هنا"
              aspectRatio="4/5"
            />
          </FormRow>
          <LangInput label="نبذة عن الأستاذ (صفحة من نحن)" form={profile} field="about" onChange={(f) => setProfile(f as typeof profile)} textarea rows={4} />
          <div className="flex justify-end">
            <PrimaryButton icon={Save} disabled={saving} onClick={() => saveSettings(profile)}>حفظ الملف الشخصي</PrimaryButton>
          </div>
        </div>
      </section>

      {/* Change password */}
      <section className="card-bold p-6 border-2">
        <SectionHeader title="كلمة المرور" subtitle={`تغيير كلمة مرور الأستاذ ${user?.name || 'عمر'}`} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <FormRow label="كلمة المرور الحالية">
            <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={inputClass} />
          </FormRow>
          <FormRow label="كلمة المرور الجديدة">
            <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputClass} />
          </FormRow>
          <FormRow label="تأكيد الجديدة">
            <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={inputClass} />
          </FormRow>
        </div>
        <div className="flex justify-end mt-4">
          <PrimaryButton icon={KeyRound} disabled={pwSaving} onClick={changePassword}>تغيير كلمة المرور</PrimaryButton>
        </div>
      </section>
    </div>
  );
}
