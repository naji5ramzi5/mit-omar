-- Migration: Create Course Access Code System
-- ================================================

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    intro_video_url TEXT, -- Public marketing/trailer video
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ON UPDATE NOW()
);

-- Add index for published courses
CREATE INDEX idx_courses_published ON courses(is_published, created_at DESC);

-- 2. Course Lessons Table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    video_url TEXT NOT NULL,
    is_free BOOLEAN NOT NULL DEFAULT FALSE, -- Flag for free preview lessons
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ON UPDATE NOW()
);

-- Add index for course lessons
CREATE INDEX idx_lessons_course ON lessons(course_id, is_free, order_index);

-- 3. Activation Codes Table
-- Create enum type for scope
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'code_scope_enum') THEN
        CREATE TYPE code_scope_enum AS ENUM ('single_course', 'all_courses');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_hash VARCHAR(255) NOT NULL UNIQUE,
    scope code_scope_enum NOT NULL DEFAULT 'single_course',
    target_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    duration_days INT NOT NULL, -- e.g., 7, 14, 30, 90 days
    max_uses INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE, -- Redemption deadline
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ON UPDATE NOW()
);

-- Add indexes for performance
CREATE INDEX idx_activation_codes_scope ON activation_codes(scope);
CREATE INDEX idx_activation_codes_expires ON activation_codes(expires_at);
CREATE INDEX idx_activation_codes_active ON activation_codes(is_active, used_count);
CREATE INDEX idx_activation_codes_target ON activation_codes(target_course_id);

-- 4. User Course Access Table
CREATE TABLE IF NOT EXISTS user_course_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    activation_code_id UUID REFERENCES activation_codes(id),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() ON UPDATE NOW(),
    UNIQUE(user_id, course_id)
);

-- Add indexes for access tracking
CREATE INDEX idx_user_course_access_user ON user_course_access(user_id);
CREATE INDEX idx_user_course_access_course ON user_course_access(course_id);
CREATE INDEX idx_user_course_access_valid ON user_course_access(valid_from, valid_until, is_revoked);
CREATE INDEX idx_user_course_access_revoked ON user_course_access(is_revoked);

-- 5. Redemption Audit Log
CREATE TABLE IF NOT EXISTS code_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activation_code_id UUID NOT NULL REFERENCES activation_codes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for audit tracking
CREATE INDEX idx_code_redemptions_code ON code_redemptions(activation_code_id);
CREATE INDEX idx_code_redemptions_user ON code_redemptions(user_id);
CREATE INDEX idx_code_redemptions_redeemed ON code_redemptions(redeemed_at);

-- 6. Course Lessons View (for easy querying)
CREATE OR REPLACE VIEW course_lessons_view AS
SELECT 
    c.id AS course_id,
    c.title AS course_title,
    l.id AS lesson_id,
    l.title AS lesson_title,
    l.order_index,
    l.is_free,
    l.video_url,
    l.duration_seconds
FROM courses c
JOIN lessons l ON c.id = l.course_id
ORDER BY c.id, l.order_index;

-- Grant permissions (adjust as needed for your setup)
GRANT SELECT ON ALL TABLES TO postgres;
GRANT USAGE ON ALL SEQUENCES TO postgres;

-- ================================================
-- Sample Data Insertion (Optional)
-- ================================================

-- Insert sample courses (comment out if not needed)
-- INSERT INTO courses (title, description, intro_video_url, is_published) VALUES
-- ('JavaScript Mastery', 'Learn JavaScript from scratch', 'https://www.youtube.com/watch?v=y8Yv44WH7j0', true),
-- ('German Basics', 'Introduction to German language', 'https://www.youtube.com/watch?v= example', true);

-- Sample free lesson
-- INSERT INTO lessons (course_id, title, order_index, video_url, is_free, duration_seconds) VALUES
-- ((SELECT id FROM courses WHERE title = 'JavaScript Mastery'), 'Introduction to JS', 0, 'https://www.youtube.com/watch?v=y8Yv44WH7j0', true, 300),
-- ((SELECT id FROM courses WHERE title = 'German Basics'), 'German Alphabet', 0, 'https://www.youtube.com/watch?v=example', true, 300);