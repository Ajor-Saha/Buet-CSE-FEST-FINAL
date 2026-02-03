# Intelligent Learning Companion Platform
### BUET CSE Fest 2026 Hackathon (AI & API) - Team CodeOverclock

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
- Next.js 14+ with TypeScript
- React with modern hooks
- Tailwind CSS for styling
- Shadcn UI components

**Backend:**
- Node.js + Express/Fastify
- PostgreSQL for relational data
- Vector Database for embeddings
- S3-compatible storage for files

**AI & ML:**
- LlamaIndex for multimodal parsing
- OpenAI for embeddings and generation
- Piston server for code validation
- Google Search API for external content

**Infrastructure:**
- Docker & Docker Compose
- Drizzle ORM for database management
- RESTful API architecture

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Docker & Docker Compose
- OpenAI API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Buet-CSE-FEST-FINAL
   ```

2. **Setup Backend**
   ```bash
   cd server/backend
   npm install
   # Configure environment variables
   docker-compose up -d
   ```

3. **Setup Frontend**
   ```bash
   cd client
   pnpm install
   pnpm dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

For detailed setup instructions, see:
- [Backend Setup](server/backend/readme.md)
- [Frontend Setup](client/FRONTEND_SETUP.md)
- [Docker Setup](server/DOCKER_SETUP.md)

---

## 📚 Documentation

- [API Documentation](server/backend/API_DOCUMENTATION.md)
- [Database Schema](server/backend/DATABASE_SCHEMA.md)
- [RAG System Architecture](server/backend/WORKFLOW_PARSER_RAG.md)
- [Quick Start Guide](ProblemStatement/QUICKSTART_GUIDE.md)

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

## 🌟 Why This Solution Stands Out

### 1. Beyond Traditional RAG
Most RAG systems treat documents as plain text. We preserve structure, images, tables, and code - maintaining the richness of the original materials.

### 2. Transparency & Trust
Every answer comes with sources. Every generated content includes validation scores. Students and educators can verify the quality of AI-generated materials.

### 3. Code That Actually Works
Generated code is validated through actual execution, not just syntax checking. If it passes our validation, it will run.

### 4. Dual Knowledge Sources
We don't rely solely on course materials. When appropriate, we augment with external knowledge while prioritizing course-specific content.

### 5. Production-Ready Architecture
Built with scalability in mind - Docker containers, proper database design, modular architecture, and comprehensive error handling.

---

## 📈 Future Enhancements

- Multi-language support for international students
- Collaborative study groups with shared materials
- Progress tracking and learning analytics
- Integration with learning management systems (LMS)
- Mobile application for on-the-go learning
- Advanced analytics for educators on content usage

---

## 📄 License

This project was developed for CSE Fest 2025 Hackathon - AI Segment by Team Code Over.

---

## 🙏 Acknowledgments

Special thanks to:
- CSE Fest organizers for the opportunity
- OpenAI for powerful language models
- LlamaIndex team for multimodal parsing capabilities
- The open-source community for amazing tools and libraries

---

**Made with ❤️ by Team Code Over**

