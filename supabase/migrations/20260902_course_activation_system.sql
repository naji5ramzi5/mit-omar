-- ========================================================
-- Migration: Course Structure, Intro Video & Activation System
-- Platform: Deutsch mit Omar
-- ========================================================

-- 1. Ensure courses table has intro video columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'introVideoUrl') THEN
        ALTER TABLE "courses" ADD COLUMN "introVideoUrl" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'introVideoDuration') THEN
        ALTER TABLE "courses" ADD COLUMN "introVideoDuration" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'isIntroPublished') THEN
        ALTER TABLE "courses" ADD COLUMN "isIntroPublished" BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Ensure lessons table has isFree column & index
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'isFree') THEN
        ALTER TABLE "lessons" ADD COLUMN "isFree" BOOLEAN DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_lessons_course_free" ON "lessons"("courseId", "isFree");

-- 3. Ensure activationCodes table has duration and policy columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activationCodes' AND column_name = 'durationDays') THEN
        ALTER TABLE "activationCodes" ADD COLUMN "durationDays" INTEGER DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activationCodes' AND column_name = 'maxUses') THEN
        ALTER TABLE "activationCodes" ADD COLUMN "maxUses" INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activationCodes' AND column_name = 'usedCount') THEN
        ALTER TABLE "activationCodes" ADD COLUMN "usedCount" INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activationCodes' AND column_name = 'status') THEN
        ALTER TABLE "activationCodes" ADD COLUMN "status" TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activationCodes' AND column_name = 'codeHash') THEN
        ALTER TABLE "activationCodes" ADD COLUMN "codeHash" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activationCodes' AND column_name = 'notes') THEN
        ALTER TABLE "activationCodes" ADD COLUMN "notes" TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_activationCodes_course_status" ON "activationCodes"("courseId", "status");

-- 4. Ensure enrollments table has activationCodeId and active index
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'activationCodeId') THEN
        ALTER TABLE "enrollments" ADD COLUMN "activationCodeId" TEXT REFERENCES "activationCodes"("id") ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_enrollments_active_expiry" ON "enrollments"("userId", "courseId", "isActive", "expiresAt");
