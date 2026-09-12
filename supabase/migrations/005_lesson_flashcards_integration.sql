-- ========================================================
-- Migration 005: Lesson Flashcards Integration
-- Platform: Deutsch mit Omar
-- Hierarchy: Course -> Level -> Lesson -> Video -> Flashcards
-- Apply via Supabase Dashboard > SQL Editor
-- ========================================================

-- 1. Make listId nullable so words can belong directly to a lesson
ALTER TABLE IF EXISTS "words" ALTER COLUMN "listId" DROP NOT NULL;

-- 2. Add lessonId to link flashcards directly to lessons
ALTER TABLE IF EXISTS "words" 
  ADD COLUMN IF NOT EXISTS "lessonId" TEXT REFERENCES "lessons"("id") ON DELETE CASCADE;

-- 3. Add imageUrl for visual card reinforcement
ALTER TABLE IF EXISTS "words" 
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- 4. Add updatedAt timestamp if not exists
ALTER TABLE IF EXISTS "words" 
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_words_lessonId ON "words"("lessonId");
CREATE INDEX IF NOT EXISTS idx_words_lessonId_order ON "words"("lessonId", "order");
CREATE INDEX IF NOT EXISTS idx_words_listId ON "words"("listId");

-- 6. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
