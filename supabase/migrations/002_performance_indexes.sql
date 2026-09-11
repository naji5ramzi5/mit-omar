-- ============================================================
-- Migration 002: Performance Indexes
-- Deutsch mit Omar Platform
-- Apply via Supabase Dashboard > SQL Editor
-- ============================================================

-- Words table indexes (for flashcard queries)
CREATE INDEX IF NOT EXISTS idx_words_listId ON "words"("listId");
CREATE INDEX IF NOT EXISTS idx_words_published ON "words"("published");
CREATE INDEX IF NOT EXISTS idx_words_order ON "words"("listId", "order");

-- Word progress indexes (for spaced repetition)
CREATE INDEX IF NOT EXISTS idx_word_progress_userId ON "word_progress"("userId");
CREATE INDEX IF NOT EXISTS idx_word_progress_due ON "word_progress"("userId", "due");

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_isPublished ON "posts"("isPublished");
CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON "posts"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_created ON "posts"("isPublished", "createdAt" DESC);

-- Notifications indexes (for unread count queries)
CREATE INDEX IF NOT EXISTS idx_notifications_userId_isRead ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_userId_created ON "notifications"("userId", "createdAt" DESC);

-- Lesson progress indexes
CREATE INDEX IF NOT EXISTS idx_lessonProgress_userId_lessonId ON "lessonProgress"("userId", "lessonId");

-- Activation codes (for code lookup during activation)
CREATE INDEX IF NOT EXISTS idx_activationCodes_isUsed ON "activationCodes"("isUsed");

-- Banners (for active banners ordered query)
CREATE INDEX IF NOT EXISTS idx_banners_isActive_order ON "banners"("isActive", "order");

-- Courses (for active ordered query)
CREATE INDEX IF NOT EXISTS idx_courses_isActive_order ON "courses"("isActive", "order");

-- Testimonials (for active ordered query)
CREATE INDEX IF NOT EXISTS idx_testimonials_isActive_order ON "testimonials"("isActive", "order");

-- Site settings (for key lookup - already has UNIQUE but explicit index helps)
-- Already indexed by unique constraint on "key" column

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
