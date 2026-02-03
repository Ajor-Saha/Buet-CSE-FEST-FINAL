# 🎓 AI-Powered Supplementary Learning Platform

> An intelligent learning companion that organizes fragmented course materials into a cohesive, accessible knowledge base. It generates validated study materials—notes, code, and downloadable documents—ensuring accuracy through automatic quality checks. Students use a conversational interface to access resources, ask questions, and receive grounded, citation-backed answers, improving learning efficiency.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.21-green?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)](https://neon.tech/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Vector_DB-purple)](https://www.pinecone.io/)

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Workflows](#-workflows)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features

#### 1️⃣ **Content Management System (CMS)**
- 📤 **Admin Upload**: Upload course materials (PDF, PPTX, DOCX, code files)
- 🏷️ **Rich Metadata**: Categorize by Theory/Lab, week, topic, tags, programming language
- 📁 **Cloud Storage**: R2 bucket integration for scalable file storage
- 🔍 **Material Browser**: Filter and search by category, week, topic
- 📊 **Analytics**: Track view count, download count, and engagement metrics

#### 2️⃣ **Intelligent Parsing Pipeline**
- 🧠 **LlamaIndex Integration**: Multi-modal content detection
  - 🖼️ Images with captions and alt text
  - 📊 Tables with structure preservation
  - 📐 Mathematical formulas (LaTeX)
  - 📝 Text (headings, paragraphs, code blocks)
  - 📈 Diagrams and flowcharts
- 📄 **Markdown Conversion**: Unified format for all content types
- ✂️ **Intelligent Chunking**: 1000 chars with 25% overlap for context preservation
- 🔢 **Vector Embeddings**: OpenAI text-embedding-3-small (1536D)
- 🗄️ **Vector Storage**: Pinecone indexing with metadata

#### 3️⃣ **RAG-Powered Chat**
- 💬 **Conversational Interface**: Natural language queries
- 🔎 **Semantic Search**: Pinecone vector similarity search
- 🎯 **Context-Aware**: Filters by course, week, topic
- 📚 **Grounded Responses**: Citations from source materials
- 🤖 **Claude Sonnet 4.5**: High-quality LLM responses

#### 4️⃣ **AI Content Generation**
- 📝 **Theory Materials**: Reading notes, study guides, summaries
- 💻 **Lab Materials**: Code snippets, explanations, templates
- 🌐 **Hybrid Context**:
  - **Internal**: RAG search in course materials (Pinecone)
  - **External**: Gemini Google Search integration
- 🎨 **Structured Output**: JSON schema for consistent formatting
- 📥 **Multi-Format Export**: PDF (jsPDF) and Markdown

#### 5️⃣ **Automatic Validation**
- ✅ **Quality Scoring**:
  - Accuracy Score (0-10)
  - Clarity Score (0-10)
  - Confidence Score (0-10)
- 📊 **Detailed Evaluation**:
  - Strengths analysis
  - Weaknesses identification
  - Improvement suggestions
  - Explanation (2-3 paragraphs)
- 🔧 **Code Validation**: Syntax checking via Piston API
- 🧪 **Test Execution**: Automated test case validation

---

## 🏗️ System Architecture

```mermaid
graph TB
    Client[Next.js Frontend] --> API[Express Backend]
    API --> DB[(PostgreSQL)]
    API --> Vector[(Pinecone Vector DB)]
    API --> Storage[R2 Bucket]
    API --> LLM1[OpenAI GPT-4]
    API --> LLM2[Claude Sonnet 4.5]
    API --> LLM3[Gemini 2.5 Flash]
    API --> Parser[LlamaIndex Cloud]
    
    style Client fill:#e3f2fd
    style API fill:#fff3e0
    style DB fill:#c8e6c9
    style Vector fill:#f3e5f5
    style Storage fill:#fff9c4
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.5 (React 19.2.3)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Hooks + Context API
- **PDF Generation**: jsPDF
- **Auth**: JWT with HTTP-only cookies

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.21
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **Vector DB**: Pinecone
- **File Upload**: Multer + Formidable
- **Storage**: Cloudflare R2 / Cloudinary

### AI & ML
- **Embeddings**: OpenAI text-embedding-3-small/large
- **LLMs**:
  - Claude Sonnet 4.5 (chat, generation)
  - Gemini 2.5 Flash (validation, Google Search)
  - OpenAI GPT-4 (fallback)
- **Parsing**: LlamaIndex Cloud (LlamaParse)
- **Orchestration**: LangChain
- **Code Execution**: Piston API

---

## 📦 Prerequisites

- **Node.js**: v20+ 
- **pnpm**: v10+
- **PostgreSQL**: Database (Neon recommended)
- **API Keys**:
  - OpenAI API Key
  - Anthropic API Key (Claude)
  - Google AI API Key (Gemini)
  - Pinecone API Key
  - LlamaCloud API Key
  - Cloudinary/R2 credentials

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd buet-final-round
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

Create `.env` files in both `server/backend` and `client` directories:

#### Backend `.env`

```env
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini
GEMINI_API_KEY=...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=course-materials

# LlamaCloud
LLAMA_CLOUD_API_KEY=llx-...

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OR R2 Bucket
BUCKET_NAME=your-bucket
PUBLIC_ACCESS_URL=https://your-bucket-url
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# Piston API (Code Execution)
PISTON_API_URL=https://emkc.org/api/v2/piston

# Server
PORT=8000
NODE_ENV=development
```

#### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Database Setup

```bash
cd server/backend

# Generate database schema
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Open Drizzle Studio
pnpm db:studio
```

---

## 🎮 Usage

### Development Mode

```bash
# Terminal 1: Start backend
cd server/backend
pnpm dev

# Terminal 2: Start frontend
cd client
pnpm dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

### Production Build

```bash
# Backend
cd server/backend
pnpm build
pnpm start

# Frontend
cd client
pnpm build
pnpm start
```

---

## 📚 API Documentation

### Authentication

```bash
# Sign up
POST /api/auth/signup
Body: { email, password, full_name, role: "admin" | "student" }

# Login
POST /api/auth/login
Body: { email, password }

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Courses

```bash
# Create course (Admin)
POST /api/courses
Body: { name, code, description, semester, year, has_theory, has_lab }

# Get all courses
GET /api/courses

# Get course by ID
GET /api/courses/:id
```

### Materials

```bash
# Upload material (Admin)
POST /api/materials/upload
Content-Type: multipart/form-data
Body: file, course_id, title, description, category, content_type, week_number, topic, tags

# Get materials
GET /api/materials?course_id=&category=theory|lab&week_number=

# Parse material
POST /api/materials/parse
Body: { material_id, file_url }
```

### RAG Chat

```bash
# Send message
POST /api/rag/chat
Body: { course_id, message, conversation_id? }
```

### Content Generation

```bash
# Generate enhanced content
POST /api/content/generate-enhanced
Body: { course_id, user_prompt }

# Generate PDF
POST /api/content/generate-pdf
Body: { course_id, user_prompt }
```

### Validation

```bash
# Validate text
POST /api/validation/validate-text
Body: { content, context }

# Validate code
POST /api/validation/validate-code
Body: { code, language, test_cases? }
```

---

## 🔄 Workflows

### Material Upload & Processing

```mermaid
graph LR
    A[Admin Upload] --> B[Store in R2]
    B --> C[Save Metadata to PostgreSQL]
    C --> D[Trigger Parser]
    D --> E[LlamaIndex Extract]
    E --> F[Convert to Markdown]
    F --> G[Chunk with 25% Overlap]
    G --> H[Generate Embeddings]
    H --> I[Store in Pinecone]
```

### RAG Chat Flow

```mermaid
graph LR
    A[Student Query] --> B[Embed Question]
    B --> C[Search Pinecone]
    C --> D[Filter by Course]
    D --> E[Top 5 Chunks]
    E --> F[Claude Sonnet]
    F --> G[Response + Citations]
```

### Content Generation

```mermaid
graph LR
    A[User Prompt] --> B[Parallel Search]
    B --> C[Internal: Pinecone]
    B --> D[External: Google]
    C --> E[Merge Contexts]
    D --> E
    E --> F[Gemini Generate]
    F --> G[Auto Validation]
    G --> H[Display + Export]
```

---

## 📁 Project Structure

```
buet-final-round/
├── client/                 # Next.js frontend
│   ├── app/               # App router pages
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Main dashboard
│   │   └── courses/      # Course pages
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── auth/         # Auth components
│   │   └── chatbot/      # Chat interface
│   └── lib/              # Utilities & API clients
│
├── server/backend/        # Express backend
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, upload, etc.
│   │   ├── db/          # Database schema
│   │   └── utils/       # Helper functions
│   └── drizzle/         # Database migrations
│
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Team

Built with ❤️ for BUET CSE Fest 2026 Hackathon

---

## 🙏 Acknowledgments

- [LlamaIndex](https://www.llamaindex.ai/) for intelligent parsing
- [Pinecone](https://www.pinecone.io/) for vector database
- [OpenAI](https://openai.com/), [Anthropic](https://www.anthropic.com/), [Google AI](https://ai.google/) for LLM APIs
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Neon](https://neon.tech/) for serverless PostgreSQL

---
