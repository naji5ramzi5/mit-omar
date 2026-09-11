-- ========================================================
-- Migration 004: Course Levels Hierarchy (Course -> Level -> Lesson)
-- Platform: Deutsch mit Omar
-- Apply via Supabase Dashboard > SQL Editor
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create course_levels table
CREATE TABLE IF NOT EXISTS "course_levels" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  "courseId" TEXT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,           -- e.g. 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  "titleAr" TEXT NOT NULL,        -- e.g. 'المستوى A1'
  "titleDe" TEXT NOT NULL,        -- e.g. 'Stufe A1'
  "titleEn" TEXT NOT NULL,        -- e.g. 'Level A1'
  "descriptionAr" TEXT DEFAULT '',
  "descriptionDe" TEXT DEFAULT '',
  "descriptionEn" TEXT DEFAULT '',
  "imageUrl" TEXT,
  "introVideoUrl" TEXT,           -- Optional level introductory video
  "order" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add levelId column to lessons table if it doesn't already exist
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "levelId" TEXT REFERENCES "course_levels"("id") ON DELETE CASCADE;

-- 3. Create indexes for maximum performance and fast joins
CREATE INDEX IF NOT EXISTS "idx_course_levels_courseId" ON "course_levels"("courseId");
CREATE INDEX IF NOT EXISTS "idx_course_levels_order" ON "course_levels"("order");
CREATE INDEX IF NOT EXISTS "idx_lessons_levelId" ON "lessons"("levelId");
CREATE INDEX IF NOT EXISTS "idx_lessons_course_level" ON "lessons"("courseId", "levelId");
CREATE INDEX IF NOT EXISTS "idx_lessons_order" ON "lessons"("order");

-- 4. Enable Row Level Security (RLS)
ALTER TABLE "course_levels" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Allow public read, allow service_role full control
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'course_levels' AND policyname = 'Allow public read course_levels'
  ) THEN
    CREATE POLICY "Allow public read course_levels" ON "course_levels" 
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'course_levels' AND policyname = 'Allow service_role all course_levels'
  ) THEN
    CREATE POLICY "Allow service_role all course_levels" ON "course_levels" 
      FOR ALL USING (true);
  END IF;
END $$;

-- 6. Safe Auto-Migration:
-- For existing courses, automatically create a corresponding default level in course_levels
-- and link any existing unassigned lessons to that level so no lessons are orphaned!
DO $$
DECLARE
  r RECORD;
  new_level_id TEXT;
BEGIN
  FOR r IN SELECT * FROM "courses" LOOP
    -- Check if a level already exists for this course
    SELECT id INTO new_level_id FROM "course_levels" WHERE "courseId" = r.id LIMIT 1;
    
    IF new_level_id IS NULL THEN
      -- Create initial level based on course level or title
      INSERT INTO "course_levels" (
        "id",
        "courseId",
        "name",
        "titleAr",
        "titleDe",
        "titleEn",
        "descriptionAr",
        "descriptionDe",
        "descriptionEn",
        "imageUrl",
        "order",
        "isActive"
      ) VALUES (
        uuid_generate_v4()::text,
        r.id,
        COALESCE(r.level, 'A1'),
        COALESCE('المستوى ' || r.level, r."titleAr"),
        COALESCE('Stufe ' || r.level, r."titleDe"),
        COALESCE('Level ' || r.level, r."titleEn"),
        r."descriptionAr",
        r."descriptionDe",
        r."descriptionEn",
        r."imageUrl",
        0,
        r."isActive"
      )
      RETURNING id INTO new_level_id;
    END IF;

    -- Link any lessons for this course that don't have levelId set yet
    UPDATE "lessons"
    SET "levelId" = new_level_id
    WHERE "courseId" = r.id AND "levelId" IS NULL;
  END LOOP;
END $$;
