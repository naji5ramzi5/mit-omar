'use client';

import { useState } from 'react';
import { toast } from './toast';
import {
  Mail, Search, Trash2, CheckCircle2, MessageSquare, Phone, Calendar,
  RefreshCw, Check, Clock, User, Reply, ExternalLink
} from 'lucide-react';
import { SectionHeader, EmptyState, ListLoading, ConfirmDialog } from './ui';
import { adminFetch, useAdminData } from './api';

export default function ContactsSection({
  token, locale,
}: {
  token: string;
  locale: string;
}) {
  const { data: items, loading, refresh } = useAdminData<any>('/api/admin/contacts', token, 'messages');
  const messages = items || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const filtered = messages.filter((m: any) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'unread') return matchesSearch && !m.isRead;
    if (filter === 'read') return matchesSearch && m.isRead;
    return matchesSearch;
  });

  const unreadCount = messages.filter((m: any) => !m.isRead).length;

  const handleToggleRead = async (m: any) => {
    setUpdating(true);
    try {
      await adminFetch(`/api/admin/contacts/${m.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({ isRead: !m.isRead }),
      });
      toast.success(m.isRead ? 'تم تعيين الرسالة كغير مقروءة' : 'تم تعيين الرسالة كمقروءة');
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setUpdating(true);
    try {
      await adminFetch(`/api/admin/contacts/${deleteId}`, token, { method: 'DELETE' });
      toast.success('تم حذف الرسالة بنجاح');
      setDeleteId(null);
      if (selectedMessage?.id === deleteId) setSelectedMessage(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="رسائل التواصل"
        subtitle="إدارة الرسائل والاستفسارات الواردة من صفحة التواصل مع إمكانية الرد والمتابعة"
        action={
          <button
            onClick={refresh}
            className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-orange" />
            تحديث
          </button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-bold p-4 border-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">إجمالي الرسائل</span>
            <span className="text-xl font-black text-foreground">{messages.length}</span>
          </div>
        </div>

        <div className="card-bold p-4 border-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">رسائل غير مقروءة</span>
            <span className="text-xl font-black text-amber-600">{unreadCount}</span>
          </div>
        </div>

        <div className="card-bold p-4 border-2 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">رسائل معالجة ومقروءة</span>
            <span className="text-xl font-black text-emerald-600">{messages.length - unreadCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-bold p-4 border-2 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالاسم، البريد الإلكتروني، أو نص الرسالة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 ps-9 pe-4 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-brand-orange text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            الكل ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'unread'
                ? 'bg-amber-500 text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            غير مقروء ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'read'
                ? 'bg-emerald-600 text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            مقروء ({messages.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Messages List & Detail Modal */}
      {loading ? <ListLoading /> : filtered.length === 0 ? (
        <EmptyState icon={Mail} text="لا توجد رسائل تواصل مطابقة" />
      ) : (
        <div className="space-y-3">
          {filtered.map((m: any) => {
            const dateStr = m.createdAt
              ? new Date(m.createdAt).toLocaleDateString('ar-EG', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              : '-';

            return (
              <div
                key={m.id}
                className={`card-bold p-5 border-2 transition-all cursor-pointer ${
                  !m.isRead
                    ? 'border-brand-orange/40 bg-brand-orange/5'
                    : 'border-border hover:border-brand-orange/30'
                }`}
                onClick={() => setSelectedMessage(m)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      !m.isRead ? 'bg-brand-orange text-white font-bold' : 'bg-secondary text-muted-foreground'
                    }`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground">{m.name}</h4>
                        {m.email && <span className="text-xs text-muted-foreground">({m.email})</span>}
                        {!m.isRead && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-orange text-white">
                            جديد
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        الموضوع: {m.subject}
                      </p>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {m.message}
                      </p>

                      <span className="text-[11px] text-muted-foreground/80 block pt-1 font-mono">
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleRead(m)}
                      title={m.isRead ? 'تعيين كغير مقروء' : 'تعيين كمقروء'}
                      className="p-2 text-muted-foreground hover:text-brand-orange rounded-xl hover:bg-brand-orange/10 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    {m.email && (
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`رد من الأستاذ عمر: ${m.subject}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="الرد بالبريد"
                        className="p-2 text-muted-foreground hover:text-blue-500 rounded-xl hover:bg-blue-500/10 transition-all"
                      >
                        <Reply className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteId(m.id)}
                      title="حذف"
                      className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Reader Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-background rounded-3xl p-6 sm:p-7 border-2 border-border shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">{selectedMessage.name}</h3>
                  <span className="text-xs text-muted-foreground">{selectedMessage.email || 'بدون بريد'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border">
                <span className="font-bold text-muted-foreground block text-[11px] mb-0.5">الموضوع:</span>
                <p className="font-bold text-sm text-foreground">{selectedMessage.subject}</p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-2">
                <span className="font-bold text-muted-foreground block text-[11px]">محتوى الرسالة:</span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                <span>تاريخ الإرسال:</span>
                <span>{new Date(selectedMessage.createdAt).toLocaleString('ar-EG')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleRead(selectedMessage);
                    setSelectedMessage((prev: any) => ({ ...prev, isRead: !prev.isRead }));
                  }}
                  className="py-2 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs"
                >
                  {selectedMessage.isRead ? 'تعيين كغير مقروء' : 'تعيين كمقروء ✓'}
                </button>

                {selectedMessage.email && (
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`رد على: ${selectedMessage.subject}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    الرد بالبريد
                  </a>
                )}
              </div>

              <button
                onClick={() => setDeleteId(selectedMessage.id)}
                className="p-2 text-muted-foreground hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                title="حذف الرسالة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        message="هل أنت متأكد من حذف رسالة التواصل هذه؟"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={updating}
      />
    </div>
  );
}
