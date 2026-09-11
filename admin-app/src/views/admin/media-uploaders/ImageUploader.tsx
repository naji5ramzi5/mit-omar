'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle, X, RefreshCw, ZoomIn, Link2, Loader2 } from 'lucide-react';
import { resolveAdminMediaUrl, formatFileSize } from './media-utils';
import { toast } from '../toast';

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  token?: string;
  label?: string;
  placeholder?: string;
  aspectRatio?: string; // e.g. '16/9', '4/5', '1/1', '9/16'
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export function ImageUploader({
  value,
  onChange,
  token,
  label,
  placeholder = 'انقر لرفع صورة من الكمبيوتر أو اسحبها هنا',
  aspectRatio,
  maxSizeMB = 15,
  className = '',
}: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getAuthToken = () => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      const ls = localStorage.getItem('dmo-token') || localStorage.getItem('token') || '';
      if (ls) return ls;
      const ss = sessionStorage.getItem('dmo-token') || sessionStorage.getItem('token') || '';
      if (ss) return ss;
      const match = document.cookie.match(/(?:dmo[-_]token|token)=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
    }
    return '';
  };

  // Clean up object URLs on unmount or change
  useEffect(() => {
    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'نوع الملف غير مدعوم. الصيغ المدعومة هي: JPG, PNG, WEBP, GIF, SVG';
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `حجم الملف (${formatFileSize(file.size)}) يتجاوز الحد المسموح به (${maxSizeMB} ميجابايت)`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Create immediate local preview
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    // Perform upload
    performUpload(file);
  };

  const performUpload = (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const authToken = getAuthToken();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/r2/upload');
    if (authToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            onChange(data.url);
            toast.success('تم رفع الصورة بنجاح');
          } else {
            throw new Error(data.error || 'استجابة غير صالحة من السيرفر');
          }
        } catch (err: any) {
          const msg = err.message || 'فشل معالجة استجابة السيرفر';
          setError(msg);
          toast.error(msg);
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || `خطأ أثناء الرفع (${xhr.status})`);
          toast.error(data.error || 'فشل رفع الصورة');
        } catch {
          setError(`خطأ أثناء الرفع (${xhr.status})`);
          toast.error('فشل رفع الصورة، يرجى المحاولة ثانية');
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      const msg = 'فشل الاتصال بالخادم، تحقق من اتصال الإنترنت';
      setError(msg);
      toast.error(msg);
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');
    xhr.send(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleRemove = () => {
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine which preview source to show
  const activeImageSrc = localPreview || (value ? resolveAdminMediaUrl(value) : null);
  const isR2Stored = value?.startsWith('r2:');

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          {label}
        </label>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
          e.target.value = '';
        }}
      />

      {/* Upload & Preview Container */}
      {!activeImageSrc ? (
        /* Empty / Dropzone state */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 group
            ${dragOver 
              ? 'border-brand-orange bg-brand-orange/10 scale-[1.01]' 
              : 'border-border hover:border-brand-orange/60 bg-secondary/30 hover:bg-secondary/60'}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-foreground mb-1">
            {placeholder}
          </p>
          <p className="text-xs text-muted-foreground">
            الأنواع المدعومة: JPG, PNG, WEBP, GIF (حتى {maxSizeMB}MB)
          </p>
          <div className="mt-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-orange to-brand-red text-white shadow-md shadow-brand-orange/20 hover:opacity-95 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              رفع من الكمبيوتر
            </button>
          </div>
        </div>
      ) : (
        /* Active Preview & Controls state */
        <div className="relative rounded-2xl border-2 border-border overflow-hidden bg-card shadow-sm">
          <div 
            className="relative w-full bg-secondary/60 flex items-center justify-center overflow-hidden"
            style={{ minHeight: '180px', maxHeight: '280px', aspectRatio: aspectRatio || undefined }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageSrc}
              alt="معاينة الصورة"
              className="w-full h-full object-contain max-h-[280px] transition-transform duration-300"
              onError={(e) => {
                // If failed to load, show subtle fallback
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Uploading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white z-10">
                <Loader2 className="w-8 h-8 animate-spin text-brand-orange mb-3" />
                <p className="text-sm font-bold mb-2">جارٍ رفع الصورة إلى السحابة... {progress}%</p>
                <div className="w-full max-w-xs h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-orange to-brand-red transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Bar Below Image */}
          <div className="p-3 bg-card border-t border-border flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isR2Stored ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  مرفوعة على R2
                </span>
              ) : localPreview && !uploading ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم الرفع بنجاح
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewZoom(true)}
                title="معاينة بالحجم الكامل"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                معاينة
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="استبدال بصورة أخرى"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-brand-orange hover:bg-brand-orange/10 transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                استبدال
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                title="حذف الصورة"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toggle manual URL input */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-bold text-muted-foreground hover:text-brand-orange transition-colors flex items-center gap-1"
        >
          <Link2 className="w-3 h-3" />
          {showUrlInput ? 'إخفاء الرابط اليدوي' : 'أو أدخل رابطاً يدوياً (اختياري)'}
        </button>

        {showUrlInput && (
          <div className="mt-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => {
                setLocalPreview(null);
                onChange(e.target.value || null);
              }}
              placeholder="https://… أو r2:images/…"
              dir="ltr"
              className="w-full px-3.5 py-2 text-xs rounded-xl border-2 border-border bg-background text-foreground focus:border-brand-orange focus:outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {previewZoom && activeImageSrc && (
        <div 
          onClick={() => setPreviewZoom(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewZoom(false)}
              className="absolute -top-10 end-0 text-white hover:text-brand-orange p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImageSrc}
              alt="معاينة كاملة"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
