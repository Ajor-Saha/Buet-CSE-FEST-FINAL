

## Recommended Strategy for the Hackathon

### 1. Decide Scope & Tech Stack Upfront 

- **Backend**:  
  - **Option 1 (Python)**: `FastAPI` (easy for AI/RAG, rich ecosystem).  
  - **Option 2 (JS/TS)**: `Node + Express` or `Next.js` (API routes + frontend together).
- **Frontend**:
  - React (or Next.js pages) with:
    - `Admin` view (upload, tag content).
    - `Student` view (browse, search, chat).
- **Database**:
  - Relational DB: PostgreSQL / MySQL / even SQLite for demo.
  - Tables for: `Courses`, `Materials`, `Chunks`, `Users` (if needed).
- **Vector Search**:
  - Easiest:
    - Use a **hosted/vector solution** (e.g., Qdrant Cloud, Pinecone) if allowed,
    - or **pgvector** inside Postgres,
    - or a simple local vector DB.
- **LLM**:
  - Use whichever hosted LLM you can (OpenAI, local model, etc.) with:
    - **RAG pipeline** using your course chunks.
- **File storage**:
  - For hackathon: store files **locally in a folder** and store only *paths+metadata* in DB.

You **don’t** need to innovate on infra; your innovation is in **workflow + UX + validation**.

---

## 2. Split the Work Into Vertical Slices (By Features)

Instead of “backend team” vs “frontend team”, organize around **features**, so each slice can be demoed independently:

1. **Content Ingestion & Browsing (CMS + student browse)**  
2. **Semantic Search (RAG retrieval)**  
3. **AI Material Generation (notes, code snippets)**  
4. **Validation & Evaluation (grounding, syntax/tests)**  
5. **Chat Interface (unified access layer)**  

Each slice should go *from DB → backend → UI → quick demo* as soon as possible.

---

## 3. Detailed Plan By Competition Parts

### Part 1: Content Management System (CMS)

**Goal:** Admin uploads materials; they become searchable & browsable.

- **Data model (minimum):**
  - `Material`: `id`, `title`, `course`, `week`, `topic`, `type` (`theory`/`lab`), `tags`, `file_path`.
  - `Chunk`: `id`, `material_id`, `chunk_text`, `chunk_type` (`slide_text`, `code`, `pdf_text`), `embedding`.
- **Admin flow:**
  - Simple web form:
    - Upload file.
    - Select: **Theory/Lab**, **Week**, **Topic**, tags.
  - Backend:
    - Save file to disk.
    - Extract text:
      - PDFs/slides: use a standard parser.
      - Code: read as text.
    - Chunk content (e.g., ~500 tokens per chunk).
    - Compute embeddings and store in vector DB linked to `material_id`.
- **Student browse:**
  - Filter by `week`, `topic`, `Theory/Lab`, `file type`.
  - Show list of materials; clicking shows preview or link to file.

**Hackathon advice:**  
Even if extraction is not perfect, ensure:
- Upload works,
- Metadata saved,
- Student can see uploaded list.

---

### Part 2: Intelligent Search Engine (Semantic/RAG Search)

**Goal:** Student asks: “Explain Dijkstra’s algorithm in context of our lab” and gets relevant docs/snippets.

- **Pipeline for a user query:**
  1. Take natural language query.
  2. Compute query **embedding**.
  3. Search vector DB (top‑k chunks).
  4. Return:
     - list of chunks (with highlight),
     - link to original material,
     - type label (`theory` / `lab` / `code`).
- **For the UI:**
  - Search bar.
  - Filter chips: Theory / Lab / Code / Week.
  - Show:
    - **Snippet text**,
    - Material title,
    - Type (Theory/Lab),
    - Link to open full material.

**Bonus (structure-aware code search):**
- Store extra metadata for code chunks:
  - `language`, `function_name`, `file_path`.
- In query → optionally bias search to `chunk_type='code'` for lab queries.

---

### Part 3: AI-Generated Learning Materials

**Goal:** Generate **course-specific** notes, slides, and code helpers using RAG + maybe Wikipedia.

- **Core RAG generation flow:**
  1. User request: “Give me reading notes on Week 3: Binary Search Trees.”
  2. Use **course RAG**:
     - Search top chunks for week/topic.
  3. Build prompt:
     - System: “You are a TA for this course. Only answer using provided context. If something is not covered, say you don’t know.”
     - Context: top chunks (with citation IDs).
     - Instruction: “Generate concise reading notes for a student, structured by headings.”
  4. LLM returns **notes**.
- **External context via MCP server (e.g., Wikipedia):**
  - When the user explicitly asks for background or when your RAG confidence is low:
    - Call Wikipedia tool for the specific term,
    - Inject summary into context *but still prioritize course materials*.
- **Theory outputs:**
  - Text notes.
  - Optionally: generate slide outline (e.g., bullet points per slide).
- **Lab outputs:**
  - Code templates,
  - Example solutions,
  - Step‑by‑step explanations referencing actual lab files.

---

### Part 4: Content Validation & Evaluation

**Goal:** Convince judges you are **not hallucinating randomly**.

#### 4.1 Grounding & Reference Checking (for all answers)

- For each generated answer:
  - Attach **citations** (references to your retrieved chunks).
  - Display: “Based on: Lecture 3 slides, Lab 2 code `sorting.py`”.
- Basic **relevance check**:
  - After generation, run another LLM call:
    - “Given this answer and these retrieved sources, is the answer consistent and fully grounded? If not, explain issues.”
  - If not grounded → either:
    - warn the user (“Some parts may not be fully supported”), or
    - regenerate with stricter prompt (“Don’t invent; if unsure say you don’t know”).

#### 4.2 Code validation

- **Syntax/lint check**:
  - For generated code,
    - Run language-specific syntax check (e.g., `python -m py_compile`, simple `tsc`, `eslint`).
  - If syntax fails:
    - Show error + attempt auto‑fix with a mini LLM repair step.
- **Automated tests (if possible):**
  - Prepare **a few small unit tests** for lab tasks:
    - Example: if lab is about “matrix multiplication”, build a test that checks result equality for sample inputs.
  - When code is generated or uploaded:
    - Run those tests,
    - Show pass/fail as part of validation.

#### 4.3 Rubric-based evaluation (for explanations/notes)

- Design a **simple rubric**:
  - Correctness,
  - Relevance to course,
  - Coverage of key points,
  - Clarity.
- Have the LLM self‑evaluate answer on this rubric with numeric scores (e.g., 1–5) and short justification.
- Display to user:
  - “AI’s own confidence: 4.5/5 correctness; 4/5 coverage.”
- Judges love this type of **self‑auditing**.

---

### Part 5: Conversational Chat Interface

**Goal:** One unified chat where:
- You can search,
- Summarize,
- Generate notes,
- Ask about lab code,
- All with context & history.

**Chat backend logic:**

1. Every incoming message:
   - Classify intent (lightweight heuristic or LLM classification):
     - “search materials”,
     - “summarize content”,
     - “generate notes”,
     - “help with lab code”.
2. For each intent:
   - Use appropriate tools:
     - Intent “search” → run semantic search, summarize results.
     - Intent “notes” → call RAG generation as above.
     - Intent “lab help” → restrict retrieval to `lab` + `code` chunks.
3. Maintain **conversation memory**:
   - Store last N turns (e.g., 10) in DB or session.
   - When answering, include short conversation summary or previous important Q/A in the prompt.
4. UI:
   - Left: message bubbles (user vs AI).
   - Right or bottom:
     - collapsible “Sources” panel showing:
       - Titles of materials used,
       - snippet previews.

---

