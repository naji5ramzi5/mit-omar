-- ============================================
-- !!! DESTRUCTIVE: DROPs and recreates ALL tables.
-- Only use on a FRESH project or when you want to erase all data.
-- Prefer applying isolated migrations instead.
-- ============================================
-- ============================================
-- Deutsch mit Omar - Supabase Schema (FIXED)
-- All identifiers DOUBLE-QUOTED to preserve camelCase
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DROP existing (cascade to handle FKs)
DROP TABLE IF EXISTS "quizAttempts" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "quizzes" CASCADE;
DROP TABLE IF EXISTS "postLikes" CASCADE;
DROP TABLE IF EXISTS "postComments" CASCADE;
DROP TABLE IF EXISTS "posts" CASCADE;
DROP TABLE IF EXISTS "banners" CASCADE;
DROP TABLE IF EXISTS "lessonProgress" CASCADE;
DROP TABLE IF EXISTS "enrollments" CASCADE;
DROP TABLE IF EXISTS "lessons" CASCADE;
DROP TABLE IF EXISTS "courses" CASCADE;
DROP TABLE IF EXISTS "activationCodes" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "subscribers" CASCADE;
DROP TABLE IF EXISTS "testimonials" CASCADE;
DROP TABLE IF EXISTS "siteSettings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 1. USERS
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "password" TEXT NOT NULL,
  "role" TEXT DEFAULT 'student',
  "locale" TEXT DEFAULT 'ar',
  "avatar" TEXT,
  "passwordResetToken" TEXT,
  "passwordResetExpires" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COURSES
CREATE TABLE "courses" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionAr" TEXT DEFAULT '',
  "descriptionDe" TEXT DEFAULT '',
  "descriptionEn" TEXT DEFAULT '',
  "level" TEXT NOT NULL,
  "imageUrl" TEXT,
  "order" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LESSONS
CREATE TABLE "lessons" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionAr" TEXT,
  "descriptionDe" TEXT,
  "descriptionEn" TEXT,
  "videoUrl" TEXT,
  "videoId" TEXT,
  "duration" INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  "isFree" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENROLLMENTS
CREATE TABLE "enrollments" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "code" TEXT,
  "activatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "expiresAt" TIMESTAMPTZ,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "courseId")
);

-- 5. LESSON PROGRESS
CREATE TABLE "lessonProgress" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "lessonId" TEXT NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
  "completed" BOOLEAN DEFAULT false,
  "watchedSeconds" INTEGER DEFAULT 0,
  "lastWatchedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "lessonId")
);

-- 6. POSTS
CREATE TABLE "posts" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "contentAr" TEXT,
  "contentDe" TEXT,
  "contentEn" TEXT,
  "excerptAr" TEXT,
  "excerptDe" TEXT,
  "excerptEn" TEXT,
  "category" TEXT,
  "imageUrl" TEXT,
  "images" JSONB DEFAULT '[]',
  "isPublished" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. POST COMMENTS
CREATE TABLE "postComments" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "postId" TEXT NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. POST LIKES
CREATE TABLE "postLikes" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "postId" TEXT NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("postId", "userId")
);

-- 9. BANNERS
CREATE TABLE "banners" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionAr" TEXT,
  "descriptionDe" TEXT,
  "descriptionEn" TEXT,
  "contentAr" TEXT,
  "contentDe" TEXT,
  "contentEn" TEXT,
  "imageUrl" TEXT,
  "link" TEXT,
  "pageSlug" TEXT,
  "labelAr" TEXT,
  "labelDe" TEXT,
  "labelEn" TEXT,
  "order" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 10. QUIZZES
CREATE TABLE "quizzes" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "level" TEXT NOT NULL,
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "descriptionAr" TEXT,
  "descriptionDe" TEXT,
  "descriptionEn" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 11. QUESTIONS
CREATE TABLE "questions" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "textAr" TEXT NOT NULL,
  "textDe" TEXT NOT NULL,
  "textEn" TEXT NOT NULL,
  "imageUrl" TEXT,
  "option1Ar" TEXT NOT NULL,
  "option1De" TEXT NOT NULL,
  "option1En" TEXT NOT NULL,
  "option2Ar" TEXT NOT NULL,
  "option2De" TEXT NOT NULL,
  "option2En" TEXT NOT NULL,
  "option3Ar" TEXT NOT NULL,
  "option3De" TEXT NOT NULL,
  "option3En" TEXT NOT NULL,
  "option4Ar" TEXT NOT NULL,
  "option4De" TEXT NOT NULL,
  "option4En" TEXT NOT NULL,
  "correctOption" INTEGER NOT NULL,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 12. QUIZ ATTEMPTS
CREATE TABLE "quizAttempts" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "quizId" TEXT NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "score" INTEGER NOT NULL,
  "totalQuestions" INTEGER NOT NULL,
  "answers" JSONB,
  "completedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TESTIMONIALS
CREATE TABLE "testimonials" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "nameAr" TEXT NOT NULL,
  "nameDe" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "roleAr" TEXT,
  "roleDe" TEXT,
  "roleEn" TEXT,
  "textAr" TEXT NOT NULL,
  "textDe" TEXT NOT NULL,
  "textEn" TEXT NOT NULL,
  "level" TEXT,
  "rating" INTEGER DEFAULT 5,
  "avatar" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 14. SUBSCRIBERS
CREATE TABLE "subscribers" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "email" TEXT UNIQUE NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 15. NOTIFICATIONS
CREATE TABLE "notifications" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "messageAr" TEXT,
  "messageDe" TEXT,
  "messageEn" TEXT,
  "type" TEXT DEFAULT 'info',
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SITE SETTINGS
CREATE TABLE "siteSettings" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "key" TEXT UNIQUE NOT NULL,
  "value" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ACTIVATION CODES
CREATE TABLE "activationCodes" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "code" TEXT UNIQUE NOT NULL,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "isUsed" BOOLEAN DEFAULT false,
  "usedBy" TEXT REFERENCES "users"("id"),
  "usedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX "idx_lessons_courseId" ON "lessons"("courseId");
CREATE INDEX "idx_enrollments_userId" ON "enrollments"("userId");
CREATE INDEX "idx_enrollments_courseId" ON "enrollments"("courseId");
CREATE INDEX "idx_lessonProgress_userId" ON "lessonProgress"("userId");
CREATE INDEX "idx_lessonProgress_lessonId" ON "lessonProgress"("lessonId");
CREATE INDEX "idx_postComments_postId" ON "postComments"("postId");
CREATE INDEX "idx_postLikes_postId" ON "postLikes"("postId");
CREATE INDEX "idx_questions_quizId" ON "questions"("quizId");
CREATE INDEX "idx_quizAttempts_userId" ON "quizAttempts"("userId");
CREATE INDEX "idx_notifications_userId" ON "notifications"("userId");
CREATE INDEX "idx_activationCodes_code" ON "activationCodes"("code");

-- RLS
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lessonProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "postComments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "postLikes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "banners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quizAttempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "testimonials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscribers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "siteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activationCodes" ENABLE ROW LEVEL SECURITY;

-- Allow all for service_role (admin key)
CREATE POLICY "allow_all" ON "users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "courses" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "lessons" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "enrollments" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "lessonProgress" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "posts" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "postComments" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "postLikes" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "banners" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "quizzes" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "questions" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "quizAttempts" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "testimonials" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "subscribers" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "notifications" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "siteSettings" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "activationCodes" FOR ALL USING (true) WITH CHECK (true);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

