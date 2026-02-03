# 🎓 Intelligent Learning Companion Platform
### BUET CSE Fest 2026 Hackathon (AI & API) - Team CodeOverclock

> An intelligent learning companion that organizes fragmented course materials into a cohesive, accessible knowledge base. It generates validated study materials—notes, code, and downloadable documents—ensuring accuracy through automatic quality checks. Students use a conversational interface to access resources, ask questions, and receive grounded, citation-backed answers, improving learning efficiency.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-green?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)](https://neon.tech/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-purple)](https://www.pinecone.io/)

## 📺 Demonstration Video

<p align="center">
    <a href="https://www.youtube.com/watch?v=GPdAra2zaCQ">
        <img src="ProblemStatement/Thumbnail.png" alt="Watch Demo" width="800" />
    </a>
</p>

## 👥 Team Members
- **Sanjoy Das**
- **Md Ahasanul Haque Sazid**
- **Ajor Saha**

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Architecture & Features](#️-architecture--features)
- [System Architecture](#️-system-architecture-diagram)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Workflows](#-workflows)
- [Demo Walkthrough](#-demo-walkthrough)
- [Why This Solution Stands Out](#-why-this-solution-stands-out)
- [Future Enhancements](#-future-enhancements)
- [Acknowledgments](#-acknowledgments)

---

## 📋 Problem Statement

Develop an **AI-Powered Supplementary Learning Platform for University Courses** that addresses the challenges students face in accessing and understanding course materials. The platform should:

- **Content Management System**: Allow instructors to upload and organize course materials (PDFs, slides, code files)
- **Intelligent Search Engine**: Implement semantic search with RAG to help students find relevant content quickly
- **AI-Generated Learning Materials**: Generate course-specific notes, summaries, and code examples
- **Content Validation & Evaluation**: Ensure accuracy of AI-generated content through grounding checks and automated testing
- **Conversational Interface**: Provide a unified chat interface for students to interact with course materials

For complete problem statement, see: [Problem Statement PDF](ProblemStatement/problem_statement%20AI-API.pdf)

---

## 🎯 Solution Overview

The **Intelligent Learning Companion Platform** is an AI-powered educational system designed to revolutionize how students and educators interact with course materials. The platform brings all course materials into one organized, easy-to-access space, with intelligent features for content generation, validation, and interactive learning.

### Key Innovations

1. **Advanced Multimodal RAG System** - Goes beyond traditional text-based RAG by intelligently preserving document structure
2. **Automated Content Validation** - Comprehensive quality scoring with accuracy, clarity, and confidence metrics
3. **Dual Search Architecture** - Combines semantic vector search with external knowledge sources
4. **Course-Specific AI Assistant** - Context-aware chatbot that answers questions based on actual course materials
5. **Code Execution Validation** - Validates generated code using Piston server for multiple programming languages

---

## 🏗️ Architecture & Features

### 1. Content Management System (Admin)

**Course Creation:**
- Admins can create courses with complete metadata:
  - Course code, name, semester, year
  - Number of weeks
  - Description and learning objectives
  - Course components (Theory, Lab, or Both)

**Material Upload Pipeline:**
- Upload multiple file formats: PDFs, slides, documents, code files
- Metadata tagging: title, material type, topics, week number
- Real-time system logs for upload tracking
- Automatic file processing through dual pipelines

### 2. Advanced RAG Pipeline

Traditional RAG systems simply dump PDFs into text, losing critical structure and context. Our solution implements **LlamaIndex Multimodal Parsing** for intelligent content extraction:

**Dual Pipeline Architecture:**

**Pipeline 1 - Storage:**
- Raw files stored in S3/Auto bucket
- Metadata indexed in PostgreSQL database
- Fast retrieval and download capabilities

**Pipeline 2 - RAG Processing:**
```
Document Upload
    ↓
Multimodal Parsing (LlamaIndex)
    ├── Intelligent extraction of:
    │   ├── Text content
    │   ├── Images and diagrams
    │   ├── Tables and data structures
    │   └── Code blocks with syntax preservation
    ↓
Structured Markdown Conversion
    ↓
Intelligent Chunking (25% overlap)
    ├── Preserves semantic meaning
    └── Maintains context across boundaries
    ↓
Embedding Generation (OpenAI)
    ↓
Vector Database Indexing
```

**Why This Approach is Superior:**
- Preserves document structure and formatting
- Maintains relationships between text and visuals
- Extracts code with proper syntax highlighting
- Enables semantic search across different content types
- Prevents loss of critical information during conversion

### 3. AI-Powered Content Generation

**Enhanced Content Generation:**

Students can generate learning materials by:
- Selecting "Enhanced Content" or "PDF Document" format
- Providing relevant prompts about topics they want to learn
- Receiving AI-generated structured content with sources

**Backend Workflow:**
```
Student Prompt
    ↓
Prompt Enhancement (LLM)
    ↓
Dual Search Process:
    ├── Internal Search:
    │   ├── Embed enhanced prompt
    │   ├── Semantic search in Vector DB
    │   └── Pull top-K course material chunks
    │
    └── External Search:
        ├── Google Search Tool
        └── Relevant external content
    ↓
Content Merging & Deduplication
    ↓
LLM Generation (with source tracking)
    ↓
Structured Content Output
    ├── Main content with headings
    ├── Source attribution
    └── Code snippets (if applicable)
```

**Lab Content Generation:**
- Generates complete lab materials with explanations
- Includes working code examples
- Provides step-by-step instructions
- Links to relevant theory concepts

### 4. Automated Content Validation

**Comprehensive Quality Metrics:**

Every generated content includes:

**Validation Scores:**
- **Accuracy Score** - Factual correctness against source materials
- **Clarity Score** - Readability and comprehension level
- **Confidence Score** - System's certainty in the response
- **Strength Assessment** - What the content does well
- **Weakness Identification** - Areas for improvement

**Code Validation (Piston Server Integration):**
- Automatic syntax checking for generated code
- Support for multiple programming languages
- Runtime validation for executable code
- Error detection and debugging suggestions

**Validation Display:**
```
┌─────────────────────────────────────┐
│ Validation Metrics                  │
├─────────────────────────────────────┤
│ Accuracy:    95% ████████████████░░ │
│ Clarity:     92% ███████████████░░░ │
│ Confidence:  88% ██████████████░░░░ │
├─────────────────────────────────────┤
│ ✓ Strengths                         │
│ • Well-structured explanations      │
│ • Accurate code examples            │
│                                     │
│ ⚠ Areas for Improvement             │
│ • Add more visual examples          │
└─────────────────────────────────────┘
```

### 5. Course-Specific AI Chatbot

**Intelligent Course Assistant:**

**Workflow:**
```
Student Question
    ↓
Query Analysis
    ↓
Semantic Search in Vector DB
    ↓
Retrieve Relevant Chunks
    ├── From course materials
    ├── From lecture slides
    └── From lab documents
    ↓
Context Assembly
    ↓
LLM Response Generation
    ├── Answer grounded in sources
    └── Citation of specific materials
    ↓
Display Answer with Sources
```

**Advanced Capabilities:**
- **Table Understanding** - Can extract and explain data from tables within PDFs
- **Code Explanation** - Analyzes and explains code snippets from labs
- **Cross-Reference** - Links related concepts across different materials
- **Source Attribution** - Always shows which materials were used
- **Context Preservation** - Maintains conversation history

**Verified Accuracy:**
- Successfully answers questions from complex tables in PDFs
- Provides accurate code explanations from lab materials
- Demonstrates proper RAG implementation with source verification

### 6. Export and Download Features

**Multiple Export Formats:**
- **Markdown Export** - Structured markdown format for easy editing
- **PDF Generation** - Professional PDF with validation report
- **Raw Content Download** - Plain text format

**Validation Report Included:**
- All exports include comprehensive validation metrics
- Quality scores visible in generated documents
- Source citations maintained in all formats

### 7. Student Features

**Course Enrollment:**
- Students can browse available courses
- Enroll in courses created by admins
- Access all materials for enrolled courses

**Organized Content Access:**
- Content categorized into Theory and Lab sections
- Filter by week, topic, or material type
- Search across all enrolled courses

**Learning Tools:**
- Generate custom study materials on-demand
- Interactive chatbot for questions
- Download materials for offline study

---

## 🏗️ System Architecture Diagram

```mermaid
graph TB
    Client[Next.js Frontend] --> API[Express Backend]
    API --> DB[(PostgreSQL - Neon)]
    API --> Vector[(Pinecone Vector DB)]
    API --> Storage[R2 Bucket / Cloudinary]
    API --> LLM1[OpenAI GPT-4]
    API --> LLM2[Claude Sonnet 4.5]
    API --> LLM3[Gemini 2.5 Flash]
    API --> Parser[LlamaIndex Cloud]
    API --> Code[Piston API]
    
    style Client fill:#e3f2fd
    style API fill:#fff3e0
    style DB fill:#c8e6c9
    style Vector fill:#f3e5f5
    style Storage fill:#fff9c4
```

---

## 💡 Technical Highlights

### Hybrid Search & Generation
- **Semantic Vector Search** - For course-specific content retrieval
- **External Knowledge Integration** - Google Search for broader context
- **Content Fusion** - Intelligent merging of internal and external sources
- **Source Tracking** - Every piece of information traces back to its origin

### Quality Control Pipeline
- **Automatic Validation** - Runs on every generated content
- **Multi-Dimensional Scoring** - Accuracy, clarity, confidence
- **Code Execution Testing** - Real runtime validation
- **Continuous Improvement** - Identifies weaknesses for refinement

### All-in-One Workflow
```
Upload → Parse → Index → Search → Generate → Validate → Deliver
```
Every step is automated with quality checks at each stage.

---

## 🔧 Technology Stack

**Frontend:**
- **Framework**: Next.js 16.1.5 with React 19.2.3
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Hooks + Context API
- **PDF Generation**: jsPDF
- **Authentication**: JWT with HTTP-only cookies

**Backend:**
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js 4.21
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon - serverless)
- **Vector Database**: Pinecone for embeddings
- **File Upload**: Multer + Formidable
- **Storage**: Cloudflare R2 / Cloudinary

**AI & ML:**
- **Embeddings**: OpenAI text-embedding-3-small (1536D)
- **LLM Models**:
  - **Claude Sonnet 4.5** - Primary chat and content generation
  - **Gemini 2.5 Flash** - Validation and Google Search integration
  - **OpenAI GPT-4** - Fallback and embeddings
- **Document Parsing**: LlamaIndex Cloud (LlamaParse) - Multimodal extraction
- **Orchestration**: LangChain for workflow management
- **Code Validation**: Piston API for multi-language execution

**Infrastructure:**
- Docker & Docker Compose
- RESTful API architecture
- Vector search with semantic similarity

---

## � Prerequisites

Before setting up the project, ensure you have:

- **Node.js**: v20+ ([Download](https://nodejs.org/))
- **pnpm**: v10+ (`npm install -g pnpm`)
- **PostgreSQL**: Database access (Neon recommended for serverless)
- **API Keys** (Required):
  - 🔑 OpenAI API Key - [Get API Key](https://platform.openai.com/api-keys)
  - 🔑 Anthropic API Key (Claude) - [Get API Key](https://console.anthropic.com/)
  - 🔑 Google AI API Key (Gemini) - [Get API Key](https://aistudio.google.com/app/apikey)
  - 🔑 Pinecone API Key - [Get API Key](https://www.pinecone.io/)
  - 🔑 LlamaCloud API Key - [Get API Key](https://cloud.llamaindex.ai/)
  - 🔑 Cloudinary or R2 credentials for file storage

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/Buet-CSE-FEST-FINAL.git
cd Buet-CSE-FEST-FINAL
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server/backend
pnpm install

# Install frontend dependencies
cd ../../client
pnpm install
```

### 3. Environment Configuration

#### Backend `.env` (server/backend/.env)

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Authentication
JWT_SECRET=your-secret-key-minimum-32-characters-long

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=...

# Pinecone Vector Database
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=course-materials

# LlamaCloud (Document Parsing)
LLAMA_CLOUD_API_KEY=llx-...

# Storage - Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OR Storage - Cloudflare R2
BUCKET_NAME=your-bucket
PUBLIC_ACCESS_URL=https://your-bucket-url
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# Piston API (Code Execution)
PISTON_API_URL=https://emkc.org/api/v2/piston

# Server Configuration
PORT=8000
NODE_ENV=development
```

#### Frontend `.env.local` (client/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Database Setup

```bash
cd server/backend

# Generate database schema from Drizzle definitions
pnpm db:generate

# Push schema to your PostgreSQL database
pnpm db:push

# (Optional) Open Drizzle Studio for database management
pnpm db:studio
```

---

## 🎮 Usage

### Development Mode

Start both servers in separate terminals:

```bash
# Terminal 1: Start backend server
cd server/backend
pnpm dev

# Terminal 2: Start frontend
cd client
pnpm dev
```

**Access Points:**
- 🌐 **Frontend**: http://localhost:3000
- ⚡ **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/api/docs

### Production Build

```bash
# Build backend
cd server/backend
pnpm build
pnpm start

# Build frontend
cd client
pnpm build
pnpm start
```

---

## 📚 API Documentation

### 🔐 Authentication Endpoints

```bash
# Sign up new user
POST /api/auth/signup
Content-Type: application/json
Body: {
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe",
  "role": "admin" | "student"
}

# User login
POST /api/auth/login
Content-Type: application/json
Body: {
  "email": "user@example.com",
  "password": "securepassword"
}

# Get current authenticated user
GET /api/auth/me
Headers: Authorization: Bearer <jwt-token>
```

### 📚 Course Management

```bash
# Create new course (Admin only)
POST /api/courses
Headers: Authorization: Bearer <jwt-token>
Body: {
  "name": "Database Systems",
  "code": "CSE-301",
  "description": "Introduction to databases",
  "semester": "Fall",
  "year": 2026,
  "has_theory": true,
  "has_lab": true
}

# Get all courses
GET /api/courses

# Get course by ID with materials
GET /api/courses/:id
```

### 📄 Material Upload & Management

```bash
# Upload course material (Admin)
POST /api/materials/upload
Content-Type: multipart/form-data
Headers: Authorization: Bearer <jwt-token>
Body: {
  file: <File>,
  course_id: "uuid",
  title: "Lecture 1 - Introduction",
  description: "Course overview",
  category: "theory" | "lab",
  content_type: "lecture" | "assignment" | "code",
  week_number: 1,
  topic: "Introduction",
  tags: ["database", "sql"]
}

# Get materials with filters
GET /api/materials?course_id=<uuid>&category=theory&week_number=1

# Trigger parsing for uploaded material
POST /api/materials/parse
Body: {
  "material_id": "uuid",
  "file_url": "https://..."
}
```

### 💬 RAG Chat Interface

```bash
# Send chat message
POST /api/rag/chat
Headers: Authorization: Bearer <jwt-token>
Body: {
  "course_id": "uuid",
  "message": "Explain normalization in databases",
  "conversation_id": "uuid" (optional)
}

Response: {
  "response": "...",
  "sources": [...],
  "conversation_id": "uuid"
}
```

### 🤖 AI Content Generation

```bash
# Generate enhanced learning content
POST /api/content/generate-enhanced
Headers: Authorization: Bearer <jwt-token>
Body: {
  "course_id": "uuid",
  "user_prompt": "Create study notes on SQL joins"
}

Response: {
  "content": "...",
  "validation": {
    "accuracy_score": 9.5,
    "clarity_score": 9.0,
    "confidence_score": 8.5,
    "strengths": [...],
    "weaknesses": [...]
  },
  "sources": [...]
}

# Generate PDF document
POST /api/content/generate-pdf
Body: {
  "course_id": "uuid",
  "user_prompt": "Generate lab manual for SQL queries"
}
```

### ✅ Content Validation

```bash
# Validate generated text content
POST /api/validation/validate-text
Body: {
  "content": "...",
  "context": "..."
}

# Validate code with execution
POST /api/validation/validate-code
Body: {
  "code": "print('Hello World')",
  "language": "python",
  "test_cases": [...]
}
```

---

## 🔄 Workflows

### 📤 Material Upload & Processing Flow

```mermaid
graph LR
    A[Admin Upload File] --> B[Store in R2/Cloudinary]
    B --> C[Save Metadata to PostgreSQL]
    C --> D[Trigger LlamaIndex Parser]
    D --> E[Extract Multi-modal Content]
    E --> F[Convert to Markdown]
    F --> G[Chunk Text - 1000 chars + 25% overlap]
    G --> H[Generate OpenAI Embeddings]
    H --> I[Index in Pinecone Vector DB]
```

### 💬 RAG Chat Query Flow

```mermaid
graph LR
    A[Student Query] --> B[Embed Question - OpenAI]
    B --> C[Semantic Search - Pinecone]
    C --> D[Filter by Course/Week/Topic]
    D --> E[Retrieve Top-K Chunks]
    E --> F[Build Context Prompt]
    F --> G[Claude Sonnet 4.5 Generation]
    G --> H[Response + Source Citations]
```

### 🤖 Enhanced Content Generation Flow

```mermaid
graph TB
    A[User Prompt] --> B{Parallel Search}
    B --> C[Internal: Pinecone RAG]
    B --> D[External: Gemini Google Search]
    C --> E[Merge & Deduplicate Contexts]
    D --> E
    E --> F[Gemini 2.5 Flash Generation]
    F --> G[Auto Validation Module]
    G --> H[Calculate Scores]
    H --> I{Quality Check}
    I -->|Pass| J[Display + Export Options]
    I -->|Low Score| K[Show Warnings + Suggestions]
```

---

## 🎬 Demo Walkthrough

Our demonstration video showcases the complete system in action:

1. **Admin Login & Course Creation** - Creating a new course with all metadata
2. **Material Upload** - Uploading PDFs, slides, and documents with step-by-step system logs
3. **RAG Pipeline Visualization** - See how files are processed through both pipelines
4. **Course Management** - Viewing and organizing uploaded content by Theory/Lab
5. **Content Generation** - Generating enhanced learning materials with validation scores
6. **Quality Metrics** - Live display of accuracy, clarity, and confidence scores
7. **AI Chatbot** - Asking questions and receiving answers with source attribution
8. **Table Extraction** - Querying data from tables within PDFs with accurate responses
9. **Lab Content Generation** - Generating complete lab materials with working code
10. **Student Enrollment** - Student login, course enrollment, and material access

---

## � Project Structure

```
Buet-CSE-FEST-FINAL/
├── client/                     # Next.js Frontend
│   ├── app/                   # App Router Pages
│   │   ├── auth/             # Authentication pages (signin/signup)
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── courses/          # Course pages & detail views
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/            # React Components
│   │   ├── ui/               # shadcn/ui components (40+ components)
│   │   ├── auth/             # Auth provider & forms
│   │   ├── chatbot/          # Chat interface components
│   │   ├── app-sidebar.tsx   # Navigation sidebar
│   │   └── theme-provider.tsx
│   ├── lib/                  # Utilities & API Clients
│   │   ├── api-client.ts     # Axios instance
│   │   ├── auth-api.ts       # Auth endpoints
│   │   ├── courses-api.ts    # Course endpoints
│   │   ├── materials-api.ts  # Material endpoints
│   │   ├── rag-api.ts        # RAG chat endpoints
│   │   └── validation-api.ts # Validation endpoints
│   ├── hooks/                # Custom React hooks
│   └── public/               # Static assets
│
├── server/backend/            # Express Backend
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   │   ├── authController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── materialController.ts
│   │   │   ├── ragController.ts
│   │   │   ├── contentController.ts
│   │   │   └── validationController.ts
│   │   ├── routes/           # API route definitions
│   │   ├── middleware/       # Auth, upload, error handling
│   │   ├── db/              # Drizzle schema definitions
│   │   │   └── schema.ts
│   │   └── utils/           # Helper functions
│   │       ├── llamaparse.ts    # LlamaIndex integration
│   │       ├── pinecone.ts      # Vector DB operations
│   │       ├── claude.ts        # Anthropic Claude client
│   │       ├── gemini.ts        # Google Gemini client
│   │       └── validation.ts    # Validation utilities
│   ├── drizzle/             # Database migrations
│   ├── uploads/             # Temporary file storage
│   └── package.json
│
├── ProblemStatement/          # Documentation
│   ├── problem_statement AI-API.pdf
│   ├── QUICKSTART_GUIDE.md
│   └── Thumbnail.png
│
└── README.md                 # This file
```

---

## 📚 Additional Documentation

For more detailed information, see:
- [Backend API Documentation](server/backend/API_DOCUMENTATION.md)
- [Database Schema](server/backend/DATABASE_SCHEMA.md)
- [RAG System Workflow](server/backend/WORKFLOW_PARSER_RAG.md)
- [Frontend Setup Guide](client/FRONTEND_SETUP.md)
- [Docker Setup](server/DOCKER_SETUP.md)
- [Quick Start Guide](ProblemStatement/QUICKSTART_GUIDE.md)

---

## 🌟 Why This Solution Stands Out

### 1. 🎨 Beyond Traditional RAG
Most RAG systems treat documents as plain text, losing critical structure. Our **LlamaIndex multimodal parsing** preserves:
- Tables with structure
- Images with context
- Code blocks with syntax
- Mathematical formulas
- Document hierarchy

### 2. 🔍 Transparency & Trust
- **Source Attribution**: Every answer cites specific materials
- **Validation Scores**: Accuracy, clarity, confidence metrics for all content
- **Quality Assurance**: Automated checks prevent hallucinations
- **Reproducible**: Students can verify answers against source documents

### 3. 💻 Code That Actually Works
- **Real Execution**: Code validated through Piston API runtime
- **Multi-Language**: Supports Python, JavaScript, Java, C++, and more
- **Test Integration**: Automated test case validation
- **Error Detection**: Syntax and runtime error reporting

### 4. 🌐 Hybrid Knowledge Architecture
- **Internal Search**: Semantic search in course-specific materials
- **External Search**: Gemini Google Search for broader context
- **Smart Fusion**: Intelligently merges and prioritizes sources
- **Context-Aware**: Always grounds responses in course content first

### 5. 🏗️ Production-Ready Design
- **Scalable**: Serverless database, vector DB, cloud storage
- **Modular**: Clean separation of concerns
- **Type-Safe**: Full TypeScript implementation
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Optimized chunking, caching, and parallel processing

---

## 📈 Future Enhancements

- 🌍 **Multi-language Support**: International student accessibility
- 👥 **Collaborative Features**: Study groups with shared annotations
- 📊 **Analytics Dashboard**: Learning progress and engagement metrics
- 🔗 **LMS Integration**: Moodle, Canvas, Blackboard compatibility
- 📱 **Mobile Applications**: iOS and Android native apps
- 🎥 **Video Processing**: Lecture video transcription and summarization
- 🔔 **Smart Notifications**: Personalized learning reminders
- 🎯 **Adaptive Learning**: AI-powered study path recommendations

---

## 📄 License

This project was developed for **BUET CSE Fest 2026 Hackathon (AI & API Segment)** by **Team CodeOverclock**.

Distributed under the ISC License.

---

## 🙏 Acknowledgments

Special thanks to the amazing tools and teams that made this possible:

- 🦙 [**LlamaIndex**](https://www.llamaindex.ai/) - Intelligent multimodal document parsing
- 📌 [**Pinecone**](https://www.pinecone.io/) - High-performance vector database
- 🤖 [**OpenAI**](https://openai.com/) - GPT-4 and embeddings
- 🧠 [**Anthropic**](https://www.anthropic.com/) - Claude Sonnet 4.5
- ✨ [**Google AI**](https://ai.google/) - Gemini 2.5 Flash and Search
- 🎨 [**shadcn/ui**](https://ui.shadcn.com/) - Beautiful React components
- 🐘 [**Neon**](https://neon.tech/) - Serverless PostgreSQL
- ☁️ [**Cloudflare R2**](https://www.cloudflare.com/products/r2/) - Object storage
- 🔧 [**Piston**](https://github.com/engineer-man/piston) - Code execution engine
- 💚 The entire **open-source community** for incredible tools and libraries

---

<p align="center">
  <strong>Built with ❤️ by Team CodeOverclock</strong><br>
  <em>BUET CSE Fest 2026 Hackathon - AI & API Segment</em>
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=GPdAra2zaCQ">
    <img src="https://img.shields.io/badge/Watch-Demo%20Video-red?style=for-the-badge&logo=youtube" alt="Demo Video" />
  </a>
</p>


