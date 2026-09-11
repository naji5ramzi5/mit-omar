'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, KeyRound, CheckCircle, AlertCircle, BookOpen, Bell, LogOut, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { t } from '@/lib/i18n';

export default function ProfileView() {
  const { locale, navigate, goBack } = useAppStore();
  const { user, token, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isRtl = locale === 'ar';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const ui =
    locale === 'ar'
      ? {
          title: 'الملف الشخصي',
          subtitle: 'إدارة حسابك وبيانات الأمان',
          accountInfo: 'معلومات الحساب',
          name: 'الاسم',
          email: 'البريد الإلكتروني',
          role: 'نوع الحساب',
          student: 'طالب',
          admin: 'مدير الموقع',
          security: 'أمان الحساب',
          changePassword: 'تغيير كلمة المرور',
          currentPass: 'كلمة المرور الحالية',
          newPass: 'كلمة المرور الجديدة',
          confirmPass: 'تأكيد كلمة المرور الجديدة',
          savePass: 'حفظ كلمة المرور الجديدة',
          saving: 'جارٍ الحفظ...',
          passMismatch: 'كلمة المرور غير متطابقة',
          passSuccess: 'تم تغيير كلمة المرور بنجاح!',
          quickNav: 'روابط سريعة',
          myCourses: 'دوراتي التعليمية',
          notifications: 'الإشعارات',
          logout: 'تسجيل الخروج',
          back: 'رجوع',
        }
      : locale === 'de'
      ? {
          title: 'Mein Profil',
          subtitle: 'Konto und Sicherheitseinstellungen verwalten',
          accountInfo: 'Kontoinformationen',
          name: 'Name',
          email: 'E-Mail',
          role: 'Kontotyp',
          student: 'Schüler',
          admin: 'Administrator',
          security: 'Sicherheit',
          changePassword: 'Passwort ändern',
          currentPass: 'Aktuelles Passwort',
          newPass: 'Neues Passwort',
          confirmPass: 'Neues Passwort bestätigen',
          savePass: 'Neues Passwort speichern',
          saving: 'Wird gespeichert...',
          passMismatch: 'Passwörter stimmen nicht überein',
          passSuccess: 'Passwort erfolgreich geändert!',
          quickNav: 'Schnellzugriff',
          myCourses: 'Meine Kurse',
          notifications: 'Benachrichtigungen',
          logout: 'Abmelden',
          back: 'Zurück',
        }
      : {
          title: 'My Profile',
          subtitle: 'Manage your account and security settings',
          accountInfo: 'Account Information',
          name: 'Name',
          email: 'Email',
          role: 'Account Type',
          student: 'Student',
          admin: 'Administrator',
          security: 'Security',
          changePassword: 'Change Password',
          currentPass: 'Current Password',
          newPass: 'New Password',
          confirmPass: 'Confirm New Password',
          savePass: 'Save New Password',
          saving: 'Saving...',
          passMismatch: 'Passwords do not match',
          passSuccess: 'Password changed successfully!',
          quickNav: 'Quick Navigation',
          myCourses: 'My Courses',
          notifications: 'Notifications',
          logout: 'Log Out',
          back: 'Back',
        };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError(ui.passMismatch);
      return;
    }

    if (newPassword.length < 6) {
      setError(locale === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 أحرف' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t(locale, 'common_error'));
        return;
      }

      setSuccess(ui.passSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError(t(locale, 'common_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="card-bold p-8 max-w-md w-full text-center">
          <p className="text-muted-foreground mb-4">{t(locale, 'login_no_account')}</p>
          <button onClick={() => navigate('login')} className="btn-bold-primary">
            {t(locale, 'login_button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-20 container-bold max-w-4xl">
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand-orange mb-6 transition-colors"
      >
        <BackArrow className="w-4 h-4" />
        <span>{ui.back}</span>
      </button>

      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">{ui.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{ui.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Account Details & Navigation */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card-bold p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-orange/25">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
              {ui.student}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-bold p-5 space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">{ui.quickNav}</p>
            <button
              onClick={() => navigate('student')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-orange/5 text-sm font-semibold text-foreground hover:text-brand-orange transition-all text-start"
            >
              <BookOpen className="w-4 h-4 text-brand-orange" />
              <span>{ui.myCourses}</span>
            </button>
            <button
              onClick={() => navigate('notifications')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-orange/5 text-sm font-semibold text-foreground hover:text-brand-orange transition-all text-start"
            >
              <Bell className="w-4 h-4 text-brand-orange" />
              <span>{ui.notifications}</span>
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold text-red-600 transition-all text-start"
            >
              <LogOut className="w-4 h-4" />
              <span>{ui.logout}</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: Security & Change Password */}
        <div className="md:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-bold p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{ui.changePassword}</h3>
                <p className="text-xs text-muted-foreground">{ui.security}</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-5 p-3.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-900/50 flex items-center gap-2.5 font-medium">
                <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{ui.currentPass}</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-bold"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{ui.newPass}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-bold"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">{ui.confirmPass}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-bold"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="btn-bold-primary w-full sm:w-auto px-8">
                  {loading ? ui.saving : ui.savePass}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
