-- ============================================
-- AI-Powered Supplementary Learning Platform
-- MINIMAL HACKATHON SCHEMA (5 Core Parts Only)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE: USER & DEPARTMENT MANAGEMENT
-- ============================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    department_id UUID,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add foreign key after departments table exists
ALTER TABLE users ADD FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL;

-- ============================================
-- CORE: COURSE MANAGEMENT
-- ============================================

CREATE TABLE courses (
    course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,
    semester VARCHAR(50),
    year INTEGER,
    -- Theory/Lab structure
    has_theory BOOLEAN DEFAULT TRUE,
    has_lab BOOLEAN DEFAULT FALSE,
    total_weeks INTEGER DEFAULT 16,
    created_by UUID REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

-- ============================================
-- PART 1: CONTENT MANAGEMENT SYSTEM (CMS)
-- ============================================

CREATE TABLE materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    -- Theory or Lab categorization
    category VARCHAR(20) NOT NULL CHECK (category IN ('theory', 'lab')),
    material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('slides', 'pdf', 'code', 'notes', 'video', 'other')),
    
    -- Metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topic VARCHAR(255),
    week_number INTEGER CHECK (week_number > 0 AND week_number <= 52),
    tags TEXT[],
    
    -- File info
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    uploaded_by UUID REFERENCES users(user_id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_course ON materials(course_id);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_week ON materials(week_number);
CREATE INDEX idx_materials_tags ON materials USING GIN(tags);

-- ============================================
-- PART 2: INTELLIGENT SEARCH ENGINE (RAG)
-- ============================================

-- Chunked content for RAG
CREATE TABLE material_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES materials(material_id) ON DELETE CASCADE,
    
    -- Chunk content
    chunk_text TEXT NOT NULL,
    chunk_order INTEGER NOT NULL,
    chunk_type VARCHAR(50),  -- 'text', 'code', 'equation', etc.
    
    -- Context metadata
    page_number INTEGER,
    line_start INTEGER,
    line_end INTEGER,
    
    -- For code chunks
    language VARCHAR(50),
    is_code BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vector embeddings for semantic search
CREATE TABLE chunk_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id UUID REFERENCES material_chunks(chunk_id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI ada-002 dimension
    model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chunk_embeddings_vector ON chunk_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- PART 3: AI-GENERATED LEARNING MATERIALS
-- ============================================

CREATE TABLE generated_content (
    content_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(course_id) ON DELETE CASCADE,
    
    -- Generated content details
    category VARCHAR(20) NOT NULL CHECK (category IN ('theory', 'lab')),
    content_type VARCHAR(50) NOT NULL,  -- 'notes', 'slides', 'code', 'summary', etc.
    title VARCHAR(255) NOT NULL,
    
    -- Content
    content TEXT NOT NULL,
    formatted_content JSONB,  -- For structured output (slides, etc.)
    
    -- Generation context
    prompt TEXT,
    source_material_ids UUID[],  -- Materials used for generation
    external_sources TEXT[],  -- MCP sources (Wikipedia, etc.)
    ai_model VARCHAR(100),
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'published', 'rejected')),
    
    generated_by UUID REFERENCES users(user_id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_generated_content_course ON generated_content(course_id);
CREATE INDEX idx_generated_content_category ON generated_content(category);
CREATE INDEX idx_generated_content_status ON generated_content(status);

-- ============================================
-- PART 4: CONTENT VALIDATION & EVALUATION
-- ============================================

CREATE TABLE validation_results (
    validation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES generated_content(content_id) ON DELETE CASCADE,
    
    -- Validation type
    validation_type VARCHAR(50) NOT NULL,  -- 'syntax', 'grounding', 'rubric', 'automated_test'
    
    -- Results
    is_valid BOOLEAN NOT NULL,
    score NUMERIC(5,2),  -- 0-100
    
    -- Details
    findings JSONB,  -- Detailed results, errors, suggestions
    explanation TEXT,
    
    -- For code validation
    syntax_errors JSONB,
    test_results JSONB,
    
    validated_by UUID REFERENCES users(user_id),  -- NULL for automated validation
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_validation_content ON validation_results(content_id);
CREATE INDEX idx_validation_type ON validation_results(validation_type);

-- ============================================
-- PART 5: CONVERSATIONAL CHAT INTERFACE
-- ============================================

CREATE TABLE chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(course_id) ON DELETE SET NULL,
    title VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    
    -- Message details
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- AI context tracking
    retrieved_chunks UUID[],  -- Chunks used for RAG
    generated_content_id UUID REFERENCES generated_content(content_id),
    model VARCHAR(100),
    
    -- Message metadata
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);

-- ============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

CREATE OR REPLACE FUNCTION update_chat_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions 
    SET last_activity = CURRENT_TIMESTAMP 
    WHERE session_id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_activity
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_activity();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Course materials with category breakdown
CREATE VIEW v_course_materials_summary AS
SELECT 
    c.course_id,
    c.code AS course_code,
    c.name AS course_name,
    c.has_theory,
    c.has_lab,
    COUNT(CASE WHEN m.category = 'theory' THEN 1 END) AS theory_materials_count,
    COUNT(CASE WHEN m.category = 'lab' THEN 1 END) AS lab_materials_count,
    COUNT(m.material_id) AS total_materials
FROM courses c
LEFT JOIN materials m ON c.course_id = m.course_id
GROUP BY c.course_id, c.code, c.name, c.has_theory, c.has_lab;

-- View: Generated content with validation status
CREATE VIEW v_generated_content_status AS
SELECT 
    gc.content_id,
    gc.title,
    gc.category,
    gc.content_type,
    gc.status,
    gc.generated_at,
    COUNT(vr.validation_id) AS validation_count,
    AVG(vr.score) AS avg_validation_score,
    BOOL_AND(vr.is_valid) AS all_validations_passed
FROM generated_content gc
LEFT JOIN validation_results vr ON gc.content_id = vr.content_id
GROUP BY gc.content_id, gc.title, gc.category, gc.content_type, gc.status, gc.generated_at;

-- ============================================
-- PERFORMANCE OPTIMIZATIONS
-- ============================================

-- Additional indexes for common queries
CREATE INDEX idx_materials_uploaded_by ON materials(uploaded_by);
CREATE INDEX idx_materials_uploaded_at ON materials(uploaded_at DESC);
CREATE INDEX idx_generated_content_generated_at ON generated_content(generated_at DESC);
CREATE INDEX idx_validation_validated_at ON validation_results(validated_at DESC);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE courses IS 'Core table - each course has theory and/or lab components';
COMMENT ON TABLE materials IS 'Part 1: CMS - Materials categorized as theory or lab with rich metadata';
COMMENT ON TABLE material_chunks IS 'Part 2: RAG - Chunked content for semantic search';
COMMENT ON TABLE chunk_embeddings IS 'Part 2: RAG - Vector embeddings for similarity search';
COMMENT ON TABLE generated_content IS 'Part 3: AI-generated learning materials grounded in course content';
COMMENT ON TABLE validation_results IS 'Part 4: Validation results for AI-generated content';
COMMENT ON TABLE chat_sessions IS 'Part 5: Chat interface sessions';
COMMENT ON TABLE chat_messages IS 'Part 5: Chat messages with RAG context tracking';
