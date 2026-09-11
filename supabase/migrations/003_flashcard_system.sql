-- ========================================================
-- Migration 003: Flashcard System + Word Lists
-- Platform: Deutsch mit Omar
-- Apply via Supabase Dashboard > SQL Editor
-- ========================================================

-- 1. Create word_lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS "word_lists" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "level" TEXT NOT NULL DEFAULT 'A1',
  "titleAr" TEXT NOT NULL,
  "titleDe" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  "isPublished" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create words table if it doesn't exist
CREATE TABLE IF NOT EXISTS "words" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "listId" TEXT NOT NULL REFERENCES "word_lists"("id") ON DELETE CASCADE,
  "wordDe" TEXT NOT NULL,
  "wordAr" TEXT NOT NULL,
  "wordEn" TEXT NOT NULL,
  "exampleDe" TEXT,
  "exampleAr" TEXT,
  "exampleEn" TEXT,
  "audio_url" TEXT,
  "imageUrl" TEXT,
  "order" INTEGER DEFAULT 0,
  "published" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create word_progress table for spaced repetition
CREATE TABLE IF NOT EXISTS "word_progress" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "wordId" TEXT NOT NULL REFERENCES "words"("id") ON DELETE CASCADE,
  "due" TIMESTAMPTZ DEFAULT NOW(),
  "interval" INTEGER DEFAULT 1,
  "easeFactor" FLOAT DEFAULT 2.5,
  "repetitions" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "wordId")
);

-- 4. Enable RLS
ALTER TABLE "word_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "words" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "word_progress" ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies (allow_all via service_role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'word_lists' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON "word_lists" FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'words' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON "words" FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'word_progress' AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON "word_progress" FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_words_listId ON "words"("listId");
CREATE INDEX IF NOT EXISTS idx_words_published ON "words"("published");
CREATE INDEX IF NOT EXISTS idx_words_listId_order ON "words"("listId", "order");
CREATE INDEX IF NOT EXISTS idx_word_progress_userId ON "word_progress"("userId");
CREATE INDEX IF NOT EXISTS idx_word_progress_userId_due ON "word_progress"("userId", "due");
CREATE INDEX IF NOT EXISTS idx_word_lists_order ON "word_lists"("order");

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
