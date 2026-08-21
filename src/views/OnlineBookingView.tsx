'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, User, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const LEVELS = [
  { value: 'A1', label: 'level_a1' },
  { value: 'A2', label: 'level_a2' },
  { value: 'B1', label: 'level_b1' },
  { value: 'B2', label: 'level_b2' },
  { value: 'C1', label: 'level_c1' },
] as const;

interface BookingFormData {
  studentName: string;
  phoneNumber: string;
  level: string;
  preferredDate: string;
}

export default function OnlineBookingView() {
  const { locale, navigate } = useAppStore();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookingFormData>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { studentName: '', phoneNumber: '', level: '', preferredDate: '' },
  });

  const today = new Date().toISOString().split('T')[0];

  const onSubmit = async (data: BookingFormData) => {
    try {
      const res = await fetch('/api/online-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Booking failed');
      }

      setSuccess(true);
      toast.success(t(locale, 'booking_success_title'), {
        description: t(locale, 'booking_success_message'),
      });

      // Reset form after success
      setTimeout(() => {
        setSuccess(false);
        navigate('home');
      }, 2000);
    } catch (error) {
      toast.error(t(locale, 'booking_error'));
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[80vh] flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md relative z-10">
          <div className="card-bold p-8 relative overflow-hidden text-center">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />
            <div className="relative z-10">
              <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-2xl font-black text-foreground mb-2">{t(locale, 'booking_success_title')}</h1>
              <p className="text-sm text-muted-foreground mb-8">{t(locale, 'booking_success_message')}</p>
              <Button
                onClick={() => { navigate('home'); }}
                className="btn-bold-primary w-full"
              >
                {t(locale, 'nav_home')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 start-1/4 w-64 h-64 bg-brand-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 end-1/4 w-64 h-64 bg-brand-red/5 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="card-bold p-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-orange via-brand-red to-brand-orange" />

          <div className="text-center mb-8">
            <button
              onClick={() => navigate('home')}
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-black text-foreground">{t(locale, 'booking_title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t(locale, 'booking_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">
                  {t(locale, 'booking_student_name')} <span className="text-brand-red">*</span>
                </label>
                <Input
                  type="text"
                  {...register('studentName', { required: t(locale, 'booking_validation_name') || 'Required' })}
                  className={`input-bold ${errors.studentName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  placeholder={t(locale, 'booking_student_name')}
                  disabled={isSubmitting}
                />
                {errors.studentName && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.studentName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">
                  {t(locale, 'booking_phone')} <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    {...register('phoneNumber', {
                      required: t(locale, 'booking_validation_phone') || 'Required',
                      pattern: { value: /^\+?[0-9\s-]{8,}$/, message: t(locale, 'booking_error') || 'Invalid phone' },
                    })}
                    className={`input-bold pl-10 ${errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    placeholder={t(locale, 'booking_phone')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-1.5">
                {t(locale, 'booking_level')} <span className="text-brand-red">*</span>
              </label>
              <Select
                value={watch('level')}
                onValueChange={(value) => setValue('level', value, { shouldValidate: true })}
                disabled={isSubmitting}
              >
                <SelectTrigger className={`w-full ${errors.level ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                  <SelectValue placeholder={t(locale, 'booking_select_level')} />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {t(locale, level.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.level.message}
                </p>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-foreground mb-1.5">
                {t(locale, 'booking_preferred_date')} <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  {...register('preferredDate', { required: t(locale, 'booking_error') || 'Required' })}
                  min={today}
                  className={`input-bold pl-10 ${errors.preferredDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.preferredDate && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.preferredDate.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="btn-bold-primary w-full"
            >
              {isSubmitting ? t(locale, 'booking_submitting') : t(locale, 'booking_submit')}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}