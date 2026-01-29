-- ============================================
-- AI-Powered Supplementary Learning Platform
-- Database Schema for University Courses
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;  -- For RAG-based semantic search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For UUID generation

-- ============================================
-- PART 1: USER MANAGEMENT & AUTHENTICATION
-- ============================================

-- Users table (Admins: instructors/TAs, Students)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 0: DEPARTMENT MANAGEMENT
-- ============================================

-- Departments table (for organizational structure)
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,  -- e.g., 'CSE', 'EEE', 'ME'
    name VARCHAR(255) NOT NULL,  -- e.g., 'Computer Science & Engineering'
    description TEXT,
    head_of_department UUID REFERENCES users(user_id),  -- Faculty head
    established_year INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 1: COURSE MANAGEMENT
-- ============================================

-- Courses table
CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    semester VARCHAR(50),
    year INTEGER,
    created_by UUID REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course enrollments (students enrolled in courses)
CREATE TABLE enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- Course instructors/TAs
CREATE TABLE course_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('instructor', 'ta')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- ============================================
-- PART 1: CONTENT MANAGEMENT SYSTEM (CMS)
-- ============================================

-- Course materials (slides, PDFs, code, notes)
CREATE TABLE materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('theory', 'lab')),
    content_type VARCHAR(50) NOT NULL,  -- 'pdf', 'pptx', 'code', 'markdown', 'docx', 'video'
    file_path VARCHAR(500) NOT NULL,  -- Storage path (S3, R2, local)
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    
    -- Metadata for organization
    week_number INTEGER,
    topic VARCHAR(255),
    tags TEXT[],  -- Array of tags for categorization
    
    -- Programming language (for lab materials)
    programming_language VARCHAR(50),  -- 'python', 'java', 'cpp', 'javascript', etc.
    
    -- Upload tracking
    uploaded_by UUID REFERENCES users(user_id),
    is_public BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Material dependencies (e.g., lab depends on theory)
CREATE TABLE material_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
    depends_on_material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
    dependency_type VARCHAR(50),  -- 'prerequisite', 'reference', 'related'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (material_id != depends_on_material_id)
);

-- ============================================
-- PART 2: INTELLIGENT SEARCH ENGINE (RAG)
-- ============================================

-- Material content chunks (for RAG processing)
CREATE TABLE material_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_type VARCHAR(50),  -- 'paragraph', 'code_block', 'heading', 'list', 'table'
    
    -- Code-specific fields
    code_language VARCHAR(50),  -- For syntax-aware search
    code_context JSONB,  -- Store AST or structure info for code chunks
    
    -- Page/location info
    page_number INTEGER,
    start_position INTEGER,
    end_position INTEGER,
    
    -- Metadata
    metadata JSONB,  -- Flexible storage for additional context
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, chunk_index)
);

-- Vector embeddings for semantic search
CREATE TABLE chunk_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id UUID REFERENCES material_chunks(chunk_id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI ada-002 dimension, adjust as needed
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search query logs (for analytics and improvement)
CREATE TABLE search_queries (
    query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    course_id UUID REFERENCES courses(course_id),
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),  -- 'semantic', 'keyword', 'code', 'hybrid'
    filters JSONB,  -- Store applied filters
    results_count INTEGER,
    clicked_results UUID[],  -- Array of material_ids clicked
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 3: AI-GENERATED LEARNING MATERIALS
-- ============================================

-- Generated content (notes, slides, code, PDFs)
CREATE TABLE generated_content (
    generated_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    user_id UUID REFERENCES users(user_id),
    
    -- Generation input
    prompt TEXT NOT NULL,
    topic VARCHAR(255),
    category VARCHAR(20) NOT NULL CHECK (category IN ('theory', 'lab')),
    content_type VARCHAR(50) NOT NULL,  -- 'notes', 'slides', 'code', 'pdf', 'markdown'
    
    -- Generation output
    content TEXT,  -- Generated text content
    file_path VARCHAR(500),  -- Path if file generated (PDF, PPTX)
    
    -- Theory-specific fields
    has_images BOOLEAN DEFAULT FALSE,
    has_diagrams BOOLEAN DEFAULT FALSE,
    
    -- Lab-specific fields
    programming_language VARCHAR(50),  -- For code generation
    includes_tests BOOLEAN DEFAULT FALSE,
    
    -- Source tracking (which materials were used)
    source_materials UUID[],  -- Array of material_ids used
    external_sources JSONB,  -- Wikipedia, MCP servers, etc.
    
    -- AI model info
    model_used VARCHAR(100),  -- 'gpt-4', 'claude-3', etc.
    model_parameters JSONB,  -- Temperature, tokens, etc.
    
    -- Metadata
    generation_metadata JSONB,  -- Tokens used, cost, etc.
    
    -- Validation status
    is_validated BOOLEAN DEFAULT FALSE,
    validation_score DECIMAL(5,2),  -- Overall score 0-100
    
    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Generated content sections (for structured content)
CREATE TABLE generated_content_sections (
    section_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_id UUID REFERENCES generated_content(generated_id) ON DELETE CASCADE,
    section_order INTEGER NOT NULL,
    section_title VARCHAR(255),
    section_content TEXT,
    section_type VARCHAR(50),  -- 'introduction', 'body', 'code', 'example', 'summary'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 4: CONTENT VALIDATION & EVALUATION
-- ============================================

-- Validation results
CREATE TABLE validation_results (
    validation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_id UUID REFERENCES generated_content(generated_id) ON DELETE CASCADE,
    
    validation_type VARCHAR(50) NOT NULL,  -- 'syntax', 'compilation', 'grounding', 'rubric', 'test_execution'
    passed BOOLEAN NOT NULL,
    score DECIMAL(5,2),  -- Score for this validation type
    
    -- Detailed results
    details JSONB NOT NULL,  -- Error messages, test results, etc.
    errors TEXT[],  -- Array of error messages
    warnings TEXT[],  -- Array of warnings
    
    -- Code validation specific
    compilation_output TEXT,
    test_results JSONB,  -- Test case results
    code_coverage DECIMAL(5,2),
    
    -- Grounding validation
    grounding_sources JSONB,  -- Which materials support the content
    hallucination_score DECIMAL(5,2),  -- Lower is better
    
    -- Rubric evaluation
    rubric_scores JSONB,  -- Scores for different rubric criteria
    
    validator VARCHAR(100),  -- Tool/model used for validation
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Validation rubrics (for consistent evaluation)
CREATE TABLE validation_rubrics (
    rubric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) CHECK (category IN ('theory', 'lab')),
    criteria JSONB NOT NULL,  -- Array of criteria with weights
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test cases for lab code validation
CREATE TABLE test_cases (
    test_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    topic VARCHAR(255) NOT NULL,
    programming_language VARCHAR(50) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_code TEXT NOT NULL,
    expected_output TEXT,
    timeout_seconds INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 5: CONVERSATIONAL CHAT INTERFACE
-- ============================================

-- Chat sessions
CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    course_id UUID REFERENCES courses(course_id),
    title VARCHAR(255),  -- Auto-generated or user-defined
    is_active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Context and grounding
    context_materials UUID[],  -- Materials referenced in response
    grounding_chunks UUID[],  -- Specific chunks used (chunk_ids)
    generated_content_id UUID REFERENCES generated_content(generated_id),  -- If content was generated
    
    -- Actions performed
    action_type VARCHAR(50),  -- 'search', 'generate', 'summarize', 'explain', 'chat'
    action_metadata JSONB,  -- Details about the action
    
    -- Feedback
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- BONUS: HANDWRITTEN NOTES DIGITIZATION
-- ============================================

-- Digitized handwritten notes
CREATE TABLE digitized_notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    user_id UUID REFERENCES users(user_id),
    
    -- Original handwritten image
    original_image_path VARCHAR(500) NOT NULL,
    
    -- Digitized output
    digitized_content TEXT,  -- Markdown, LaTeX, or plain text
    output_format VARCHAR(50),  -- 'markdown', 'latex', 'pdf'
    output_file_path VARCHAR(500),
    
    -- Processing info
    ocr_model VARCHAR(100),
    processing_status VARCHAR(50),  -- 'pending', 'processing', 'completed', 'failed'
    quality_score DECIMAL(5,2),
    
    -- Metadata
    topic VARCHAR(255),
    week_number INTEGER,
    tags TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- ============================================
-- BONUS: CONTENT-TO-VIDEO GENERATION
-- ============================================

-- Generated videos
CREATE TABLE generated_videos (
    video_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    user_id UUID REFERENCES users(user_id),
    
    -- Source content
    source_material_id UUID REFERENCES materials(material_id),
    source_generated_id UUID REFERENCES generated_content(generated_id),
    
    -- Video details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_path VARCHAR(500),
    thumbnail_path VARCHAR(500),
    duration_seconds INTEGER,
    
    -- Generation settings
    voice_type VARCHAR(50),  -- 'male', 'female', 'neutral'
    language VARCHAR(50) DEFAULT 'en',
    include_visuals BOOLEAN DEFAULT TRUE,
    
    -- Processing
    processing_status VARCHAR(50),  -- 'pending', 'processing', 'completed', 'failed'
    video_generation_model VARCHAR(100),
    
    -- Stats
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- ============================================
-- BONUS: COMMUNITY & BOT SUPPORT
-- ============================================

-- Community discussion posts
CREATE TABLE community_posts (
    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    user_id UUID REFERENCES users(user_id),
    parent_post_id UUID REFERENCES community_posts(post_id),  -- For threaded discussions
    
    title VARCHAR(255),
    content TEXT NOT NULL,
    post_type VARCHAR(50),  -- 'question', 'discussion', 'announcement', 'reply'
    
    -- Categorization
    topic VARCHAR(255),
    tags TEXT[],
    category VARCHAR(20) CHECK (category IN ('theory', 'lab', 'general')),
    
    -- Status
    is_resolved BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Engagement
    upvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bot-generated replies
CREATE TABLE bot_replies (
    reply_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(post_id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    
    -- Grounding and sources
    grounding_materials UUID[],  -- Materials used to generate reply
    grounding_chunks UUID[],  -- Specific chunks referenced
    external_sources JSONB,  -- External knowledge sources
    confidence_score DECIMAL(5,2),  -- How confident the bot is
    
    -- Bot info
    bot_model VARCHAR(100),
    generation_metadata JSONB,
    
    -- Feedback
    is_helpful BOOLEAN,
    user_feedback TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User reactions to posts (likes, helpful, etc.)
CREATE TABLE post_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES community_posts(post_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    reaction_type VARCHAR(50),  -- 'upvote', 'helpful', 'insightful', 'thanks'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id, reaction_type)
);

-- ============================================
-- ANALYTICS & REPORTING
-- ============================================

-- User activity logs
CREATE TABLE activity_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    course_id UUID REFERENCES courses(course_id),
    activity_type VARCHAR(100) NOT NULL,  -- 'view_material', 'search', 'generate', 'chat', etc.
    resource_type VARCHAR(50),  -- 'material', 'generated_content', 'chat', etc.
    resource_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course analytics summary
CREATE TABLE course_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id),
    
    -- Material stats
    total_materials INTEGER DEFAULT 0,
    total_theory_materials INTEGER DEFAULT 0,
    total_lab_materials INTEGER DEFAULT 0,
    
    -- Generation stats
    total_generated_content INTEGER DEFAULT 0,
    avg_validation_score DECIMAL(5,2),
    
    -- Engagement stats
    total_searches INTEGER DEFAULT 0,
    total_chat_sessions INTEGER DEFAULT 0,
    total_community_posts INTEGER DEFAULT 0,
    
    active_students INTEGER DEFAULT 0,
    
    -- Date range
    analytics_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_id, analytics_date)
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Department indexes
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_head ON departments(head_of_department);

-- Course indexes
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Material indexes
CREATE INDEX idx_materials_course ON materials(course_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_content_type ON materials(content_type);
CREATE INDEX idx_materials_tags ON materials USING gin(tags);
CREATE INDEX idx_materials_week ON materials(week_number);

-- Chunk and embedding indexes
CREATE INDEX idx_chunks_material ON material_chunks(material_id);
CREATE INDEX idx_embeddings_chunk ON chunk_embeddings(chunk_id);
CREATE INDEX idx_embeddings_vector ON chunk_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Generated content indexes
CREATE INDEX idx_generated_course ON generated_content(course_id);
CREATE INDEX idx_generated_user ON generated_content(user_id);
CREATE INDEX idx_generated_category ON generated_content(category);
CREATE INDEX idx_generated_validated ON generated_content(is_validated);

-- Chat indexes
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_course ON chat_sessions(course_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Community indexes
CREATE INDEX idx_community_posts_course ON community_posts(course_id);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_parent ON community_posts(parent_post_id);
CREATE INDEX idx_community_posts_tags ON community_posts USING gin(tags);

-- Search indexes
CREATE INDEX idx_search_queries_user ON search_queries(user_id);
CREATE INDEX idx_search_queries_course ON search_queries(course_id);
CREATE INDEX idx_search_queries_created ON search_queries(created_at);

-- Activity logs index
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_course ON activity_logs(course_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Material catalog with course info
CREATE VIEW v_material_catalog AS
SELECT
    m.material_id,
    m.title,
    m.description,
    m.category,
    m.content_type,
    m.week_number,
    m.topic,
    m.tags,
    m.programming_language,
    c.code AS course_code,
    c.name AS course_name,
    u.full_name AS uploaded_by_name,
    m.view_count,
    m.download_count,
    m.created_at
FROM materials m
JOIN courses c ON m.course_id = c.course_id
LEFT JOIN users u ON m.uploaded_by = u.user_id;

-- Student course overview
CREATE VIEW v_student_courses AS
SELECT
    e.user_id,
    u.full_name AS student_name,
    c.course_id,
    c.code AS course_code,
    c.name AS course_name,
    c.semester,
    c.year,
    COUNT(DISTINCT m.material_id) AS total_materials,
    e.enrolled_at
FROM enrollments e
JOIN users u ON e.user_id = u.user_id
JOIN courses c ON e.course_id = c.course_id
LEFT JOIN materials m ON c.course_id = m.course_id
GROUP BY e.user_id, u.full_name, c.course_id, c.code, c.name, c.semester, c.year, e.enrolled_at;

-- Generated content summary
CREATE VIEW v_generated_content_summary AS
SELECT
    gc.generated_id,
    gc.topic,
    gc.category,
    gc.content_type,
    gc.programming_language,
    gc.is_validated,
    gc.validation_score,
    c.code AS course_code,
    u.full_name AS generated_by,
    COUNT(DISTINCT vr.validation_id) AS validation_count,
    gc.created_at
FROM generated_content gc
JOIN courses c ON gc.course_id = c.course_id
JOIN users u ON gc.user_id = u.user_id
LEFT JOIN validation_results vr ON gc.generated_id = vr.generated_id
GROUP BY gc.generated_id, gc.topic, gc.category, gc.content_type, gc.programming_language,
         gc.is_validated, gc.validation_score, c.code, u.full_name, gc.created_at;

-- Community activity dashboard
CREATE VIEW v_community_activity AS
SELECT
    cp.post_id,
    cp.title,
    cp.post_type,
    cp.topic,
    cp.tags,
    cp.is_resolved,
    c.code AS course_code,
    u.full_name AS author_name,
    COUNT(DISTINCT br.reply_id) AS bot_reply_count,
    cp.upvotes,
    cp.view_count,
    cp.created_at
FROM community_posts cp
JOIN courses c ON cp.course_id = c.course_id
JOIN users u ON cp.user_id = u.user_id
LEFT JOIN bot_replies br ON cp.post_id = br.post_id
GROUP BY cp.post_id, cp.title, cp.post_type, cp.topic, cp.tags, cp.is_resolved,
         c.code, u.full_name, cp.upvotes, cp.view_count, cp.created_at;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample admin user
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@university.edu', '$2b$10$samplehash', 'Dr. John Smith', 'admin'),
('student@university.edu', '$2b$10$samplehash', 'Jane Doe', 'student');

-- Insert sample departments
INSERT INTO departments (code, name, description, head_of_department, established_year) VALUES
('CSE', 'Computer Science & Engineering', 'Department of Computer Science and Engineering', 
 (SELECT user_id FROM users WHERE email = 'admin@university.edu'), 2000),
('EEE', 'Electrical & Electronics Engineering', 'Department of Electrical and Electronics Engineering', NULL, 1995),
('ME', 'Mechanical Engineering', 'Department of Mechanical Engineering', NULL, 1990);

-- Insert sample course
INSERT INTO courses (code, name, description, department_id, semester, year, created_by) VALUES
('CSE101', 'Introduction to Programming', 'Fundamental programming concepts using Python', 
 (SELECT department_id FROM departments WHERE code = 'CSE'), 'Spring', 2026, 
 (SELECT user_id FROM users WHERE email = 'admin@university.edu'));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_activity_at in chat sessions
CREATE OR REPLACE FUNCTION update_chat_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_activity AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_session_activity();
