import asyncio
import json
import os
from typing import List, Optional
import requests
import tempfile
from urllib.parse import urlparse

from fastapi import APIRouter, UploadFile, HTTPException, File, Request, Body
import time

from ..services import pdf_processor, embedding_service, qdrant_client
from ..services.chunking import chunk_sentences
from ..models.db import save_paper_meta, save_query_history, list_recent_queries, get_popular_topics, check_paper_exists

router = APIRouter(prefix="/api")

UPLOAD_DIR = "temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/papers/upload")
async def upload_papers(
    request: Request,
    files: List[UploadFile] = File(default=[]),
    file: List[UploadFile] = File(default=[]),
):
    """
    Upload papers from file upload or URLs.
    
    Supports two modes:
    1. File upload: POST with multipart/form-data and files
    2. URL upload: POST with JSON body: {"urls": ["https://example.com/paper.pdf", ...]}
    """
    try:
        upload_files = []
        pdf_urls = []
        
        # Check if request is JSON (URL mode)
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" in content_type:
            try:
                body = await request.json()
                pdf_urls = body.get("urls", [])
                if not isinstance(pdf_urls, list):
                    raise HTTPException(status_code=422, detail="Field 'urls' must be an array of strings")
                if not pdf_urls:
                    raise HTTPException(status_code=422, detail="Field 'urls' is required and must contain at least one URL")
                
                print(f"[DEBUG] Received {len(pdf_urls)} URL(s): {pdf_urls}")
            except json.JSONDecodeError:
                raise HTTPException(status_code=422, detail="Invalid JSON body")
        else:
            # File upload mode
            if files:
                upload_files.extend(files)
            
            if file:
                # Handle both single file and multiple files sent with same "file" key
                if isinstance(file, list):
                    upload_files.extend(file)
                else:
                    upload_files.append(file)
            
            if not upload_files:
                raise HTTPException(status_code=422, detail="Field 'files' (array) or 'file' (single/multiple) is required, or send JSON with 'urls' array")
            
            print(f"[DEBUG] Received {len(upload_files)} file(s): {[f.filename for f in upload_files]}")

        # Validate file types: PDF only (for file uploads)
        if upload_files:
            invalid = []
            for f in upload_files:
                fname = (f.filename or "").lower()
                ctype = (f.content_type or "").lower()
                if not (fname.endswith(".pdf") or ctype == "application/pdf"):
                    invalid.append(f.filename)
                    break
            if invalid:
                raise HTTPException(
                    status_code=422,
                    detail=f"Only PDF files are accepted. Invalid files: {invalid}. Please upload .pdf files only."
                )

            # Check for duplicate filenames in database
            duplicates = []
            for f in upload_files:
                existing_id = check_paper_exists(f.filename)
                if existing_id:
                    duplicates.append(f"{f.filename} (already exists with ID: {existing_id})")
                    break
            
            if duplicates:
                raise HTTPException(
                    status_code=409,
                    detail=f"Duplicate files detected. Papers with these filenames already exist: {duplicates}. Please delete the existing papers first or rename the files."
                )

        # Validate URLs
        if pdf_urls:
            invalid_urls = []
            for url in pdf_urls:
                if not isinstance(url, str) or not url.strip():
                    invalid_urls.append(url)
                    continue
                try:
                    parsed = urlparse(url)
                    if not parsed.scheme in ['http', 'https']:
                        invalid_urls.append(url)
                    if not parsed.path.lower().endswith('.pdf'):
                        invalid_urls.append(url)
                except Exception:
                    invalid_urls.append(url)
            
            if invalid_urls:
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid URLs or non-PDF URLs detected: {invalid_urls}. Only HTTP(S) URLs ending with .pdf are supported."
                )

        # Ensure temp directory exists (recreate if deleted)
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Ensure Qdrant collection is ready based on model dimension(384)
        qdrant_client.ensure_collection(embedding_service.get_model_dim())

        async def process_one_file(file: UploadFile):
            try:
                # file_path = "temp/paper_1.pdf"
                file_path = os.path.join(UPLOAD_DIR, file.filename) 
                # This opens a new file(pdf) for writing in binary mode.
                with open(file_path, "wb") as f:
                    # the file is physically saved to my  temp/ folder.
                    f.write(await file.read())

                print(f"[INFO] Processing {file.filename}...")
                
                # Extract text and metadata from PDF
                meta, sentences = pdf_processor.extract_sections_and_sentences(file_path)
                print(f"[INFO] {file.filename}: Extracted {len(sentences)} sentences from {meta.get('pages', 0)} pages")

                # Chunking
                chunks = chunk_sentences(sentences)
                texts = [c["text"] for c in chunks] # extract all test from 'test' section
                print(f"[INFO] {file.filename}: Created {len(chunks)} chunks")
                
                if len(chunks) == 0:
                    raise ValueError(f"No chunks were created from {file.filename}. The PDF might be empty or contain only images.")

                # Embeddings (batched)
                vectors = embedding_service.get_embeddings(texts) # Converts all chunk texts into numerical embeddings
                print(f"[INFO] {file.filename}: Generated {len(vectors)} embeddings") 

                # Save paper metadata ONLY AFTER successful chunking and embedding
                # Unique ID for all papers
                paper_id = save_paper_meta(
                    title=meta.get("title"),
                    authors=meta.get("authors"),
                    year=meta.get("year"),
                    filename=file.filename,
                    pages=meta.get("pages"), # return the number of pages
                )
                print(f"[INFO] {file.filename}: Saved metadata with paper_id={paper_id}")

                # Build payloads with metadata
                payloads = []
                for c in chunks:
                    # payload = id + metadata + chunk
                    payloads.append(
                        {
                            "paper_id": paper_id,
                            "paper_title": meta.get("title"),
                            "section": c["section"],
                            "page_start": c["page_start"],
                            "page_end": c["page_end"],
                            "chunk_index": c["chunk_index"],
                            "text": c["text"],
                        }
                    )

                # Store vectors in Qdrant
                qdrant_client.upsert_vectors(vectors, payloads)
                print(f"[INFO] {file.filename}: Uploaded {len(vectors)} vectors to Qdrant")

                # Save chunks to temp as JSON for inspection / offline use
                chunks_out = {
                    "paper_id": paper_id,
                    "filename": file.filename,
                    "metadata": meta,
                    "chunks": chunks,
                }
                chunks_file = os.path.join(UPLOAD_DIR, f"{os.path.splitext(file.filename)[0]}_chunks.json")
                with open(chunks_file, "w", encoding="utf-8") as jf:
                    json.dump(chunks_out, jf, ensure_ascii=False, indent=2)

                print(f"[SUCCESS] {file.filename}: Processing complete!")
                return {
                    "filename": file.filename,
                    "paper_id": paper_id,
                    "metadata": meta,
                    "chunks": len(chunks),
                    "chunks_file": chunks_file,
                    "status": "success"
                }
            
            except Exception as e:
                error_msg = f"Failed to process {file.filename}: {str(e)}"
                print(f"[ERROR] {error_msg}")
                import traceback
                traceback.print_exc()
                return {
                    "filename": file.filename,
                    "status": "failed",
                    "error": str(e)
                }

        async def process_one_url(url: str):
            try:
                # Extract filename from URL
                parsed_url = urlparse(url)
                filename = os.path.basename(parsed_url.path)
                
                # Check for duplicate
                existing_id = check_paper_exists(filename)
                if existing_id:
                    return {
                        "url": url,
                        "filename": filename,
                        "status": "failed",
                        "error": f"Paper already exists with ID: {existing_id}"
                    }
                
                print(f"[INFO] Downloading {filename} from URL...")
                
                # Download PDF from URL with timeout
                response = requests.get(url, timeout=60, stream=True)
                response.raise_for_status()
                
                # Verify content type
                content_type = response.headers.get('content-type', '').lower()
                if 'pdf' not in content_type and not filename.lower().endswith('.pdf'):
                    return {
                        "url": url,
                        "filename": filename,
                        "status": "failed",
                        "error": f"URL does not return a PDF file (content-type: {content_type})"
                    }
                
                # Save to temp file
                file_path = os.path.join(UPLOAD_DIR, filename)
                with open(file_path, "wb") as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                print(f"[INFO] Processing {filename}...")
                
                # Extract text and metadata from PDF
                meta, sentences = pdf_processor.extract_sections_and_sentences(file_path)
                print(f"[INFO] {filename}: Extracted {len(sentences)} sentences from {meta.get('pages', 0)} pages")

                # Chunking
                chunks = chunk_sentences(sentences)
                texts = [c["text"] for c in chunks]
                print(f"[INFO] {filename}: Created {len(chunks)} chunks")
                
                if len(chunks) == 0:
                    raise ValueError(f"No chunks were created from {filename}. The PDF might be empty or contain only images.")

                # Embeddings (batched)
                vectors = embedding_service.get_embeddings(texts)
                print(f"[INFO] {filename}: Generated {len(vectors)} embeddings")

                # Save paper metadata
                paper_id = save_paper_meta(
                    title=meta.get("title"),
                    authors=meta.get("authors"),
                    year=meta.get("year"),
                    filename=filename,
                    pages=meta.get("pages"),
                )
                print(f"[INFO] {filename}: Saved metadata with paper_id={paper_id}")

                # Build payloads with metadata
                payloads = []
                for c in chunks:
                    payloads.append(
                        {
                            "paper_id": paper_id,
                            "paper_title": meta.get("title"),
                            "section": c["section"],
                            "page_start": c["page_start"],
                            "page_end": c["page_end"],
                            "chunk_index": c["chunk_index"],
                            "text": c["text"],
                        }
                    )

                # Store vectors in Qdrant
                qdrant_client.upsert_vectors(vectors, payloads)
                print(f"[INFO] {filename}: Uploaded {len(vectors)} vectors to Qdrant")

                # Save chunks to temp as JSON
                chunks_out = {
                    "paper_id": paper_id,
                    "filename": filename,
                    "metadata": meta,
                    "chunks": chunks,
                }
                chunks_file = os.path.join(UPLOAD_DIR, f"{os.path.splitext(filename)[0]}_chunks.json")
                with open(chunks_file, "w", encoding="utf-8") as jf:
                    json.dump(chunks_out, jf, ensure_ascii=False, indent=2)

                print(f"[SUCCESS] {filename}: Processing complete!")
                return {
                    "url": url,
                    "filename": filename,
                    "paper_id": paper_id,
                    "metadata": meta,
                    "chunks": len(chunks),
                    "chunks_file": chunks_file,
                    "status": "success"
                }
            
            except Exception as e:
                error_msg = f"Failed to process URL {url}: {str(e)}"
                print(f"[ERROR] {error_msg}")
                import traceback
                traceback.print_exc()
                return {
                    "url": url,
                    "filename": filename if 'filename' in locals() else 'unknown',
                    "status": "failed",
                    "error": str(e)
                }

        # Limit concurrency to avoid CPU thrash; process up to 3 at a time
        semaphore = asyncio.Semaphore(3)

        async def sem_task_file(f: UploadFile):
            async with semaphore:
                return await process_one_file(f)

        async def sem_task_url(url: str):
            async with semaphore:
                return await process_one_url(url)

        # Process all files/URLs
        results = []
        if upload_files:
            results.extend(await asyncio.gather(*[sem_task_file(f) for f in upload_files], return_exceptions=False))
        if pdf_urls:
            results.extend(await asyncio.gather(*[sem_task_url(url) for url in pdf_urls], return_exceptions=False))
        
        # Separate successes from failures
        successes = [r for r in results if r.get("status") == "success"]
        failures = [r for r in results if r.get("status") == "failed"]
        
        response = {
            "processed": results,
            "summary": {
                "total": len(upload_files) + len(pdf_urls),
                "successful": len(successes),
                "failed": len(failures)
            }
        }
        
        if failures:
            response["warning"] = f"{len(failures)} file(s) failed to process. Check the 'processed' array for details."
        
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query")
async def query_papers(
    request: Request
):
    """
    Intelligent Query System - Answer questions using RAG pipeline.
    
    Request body:
    {
      "question": "What methodology was used in the transformer paper?",
      "top_k": 5,
      "paper_ids": [1, 3]  // optional: limit to specific papers
      "model": "llama3"     // optional: LLM model to use
    }
    
    Returns JSON response with answer, citations, sources, and confidence score.
    """
    import json
    
    try:
        start_time = time.time()
        
        # Parse JSON body
        try:
            body = await request.json()
            if not isinstance(body, dict):
                raise HTTPException(status_code=422, detail="Request body must be a JSON object")
            
            question = body.get("question")
            top_k = int(body.get("top_k", 5))
            paper_ids = body.get("paper_ids")
            model = body.get("model", "llama3")
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=f"Invalid parameter format: {str(ve)}")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Invalid request body: {str(e)}")

        if not question or not str(question).strip():
            raise HTTPException(status_code=422, detail="Field 'question' is required and cannot be empty")
        
        # Validate top_k
        if top_k < 1 or top_k > 50:
            raise HTTPException(status_code=422, detail="Field 'top_k' must be between 1 and 50")
        
        # Import required modules
        from ..services import rag_pipeline
        
        # Use the RAG pipeline to generate answer
        result = rag_pipeline.answer(question, model=model, top_k=top_k, paper_ids=paper_ids)
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Save query history
        try:
            save_query_history(
                question=question,
                paper_ids=result.get("paper_ids_used", []),
                response_time_ms=response_time_ms,
                confidence=result.get("confidence"),
                rating=None,
            )
        except Exception as hist_err:
            print(f"[WARNING] Failed to save query history: {hist_err}")
        
        # Return JSON response matching Task Instructions format
        return {
            "answer": result["answer"],
            "citations": result["citations"],
            "sources_used": result["sources_used"],
            "confidence": result["confidence"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] Query failed: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")


@router.post("/query/stream")
async def query_papers_stream(
    request: Request
):
    """
    Streaming Query System - Answer questions using RAG pipeline with SSE streaming.
    
    This is a bonus feature for the web UI to provide real-time streaming responses.
    For API testing, use the standard POST /api/query endpoint which returns JSON.
    
    Request body:
    {
      "question": "What methodology was used in the transformer paper?",
      "top_k": 5,
      "paper_ids": [1, 3]  // optional: limit to specific papers
      "model": "llama3"     // optional: LLM model to use
    }
    
    Returns Server-Sent Events (SSE) stream with word-by-word response.
    """
    from fastapi.responses import StreamingResponse
    import json
    import asyncio
    
    try:
        # Parse JSON body
        try:
            body = await request.json()
            if not isinstance(body, dict):
                raise HTTPException(status_code=422, detail="Request body must be a JSON object")
            
            question = body.get("question")
            top_k = int(body.get("top_k", 5))
            paper_ids = body.get("paper_ids")
            model = body.get("model", "llama3")
        except ValueError as ve:
            raise HTTPException(status_code=422, detail=f"Invalid parameter format: {str(ve)}")
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Invalid request body: {str(e)}")

        if not question or not str(question).strip():
            raise HTTPException(status_code=422, detail="Field 'question' is required and cannot be empty")
        
        # Validate top_k
        if top_k < 1 or top_k > 50:
            raise HTTPException(status_code=422, detail="Field 'top_k' must be between 1 and 50")
        
        # Import required modules
        from ..services import rag_pipeline
        from ..services.ollama_client import generate_text_stream

        async def generate_stream():
            try:
                # Send an initial SSE comment to open the stream promptly
                yield ":\n\n"
                await asyncio.sleep(0)

                # Retrieve contexts with re-ranking
                import os
                retrieval_multiplier = int(os.getenv("RERANK_RETRIEVAL_MULTIPLIER", "2"))
                initial_top_k = top_k * retrieval_multiplier
                contexts = rag_pipeline.retrieve_context(question, top_k=initial_top_k, paper_ids=paper_ids)
                
                # Re-rank for better relevance
                if contexts:
                    contexts = rag_pipeline.rerank_contexts(question, contexts, top_k=top_k)

                if not contexts:
                    yield f"data: {json.dumps({'type': 'token', 'content': 'No relevant information found in the database.'})}\n\n"
                    yield f"data: {json.dumps({'type': 'metadata', 'citations': [], 'sources_used': [], 'confidence': 0.0})}\n\n"
                    yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return

                # Assemble prompt
                prompt = rag_pipeline.assemble_prompt(question, contexts)

                # Stream the LLM response
                full_answer = ""
                for chunk in generate_text_stream(prompt, model=model, max_tokens=512, temperature=0.0):
                    full_answer += chunk
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                    await asyncio.sleep(0)

                # Extract citations and calculate confidence
                citations = rag_pipeline.extract_citations_from_answer(full_answer, contexts)
                sources_used = list(set(c.get("paper_filename") for c in contexts if c.get("paper_filename")))
                paper_ids_used = list({c.get("paper_id") for c in contexts if c.get("paper_id") is not None})
                confidence = rag_pipeline.calculate_confidence(contexts, full_answer)

                # Send metadata
                metadata = {
                    'type': 'metadata',
                    'citations': citations,
                    'sources_used': sources_used,
                    'confidence': confidence,
                    'paper_ids_used': paper_ids_used
                }
                yield f"data: {json.dumps(metadata)}\n\n"
                await asyncio.sleep(0)

                # Save query history
                try:
                    save_query_history(
                        question=question,
                        paper_ids=paper_ids_used,
                        response_time_ms=0,
                        confidence=confidence,
                        rating=None,
                    )
                except Exception as hist_err:
                    print(f"[WARNING] Failed to save query history: {hist_err}")

                # Send done signal
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                await asyncio.sleep(0)

            except Exception as e:
                import traceback
                print(f"[ERROR] Streaming query failed: {e}")
                print(traceback.format_exc())
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream; charset=utf-8",
                "X-Accel-Buffering": "no"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] Query stream setup failed: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Query streaming failed: {str(e)}")


# ============================================================================
# Query History & Analytics Endpoints
# ============================================================================

@router.get("/queries/history")
async def get_query_history(limit: int = 20):
    """Return recent queries with referenced papers and metadata."""
    try:
        limit = max(1, min(limit, 100))
        items = list_recent_queries(limit=limit)
        return {"queries": items, "total": len(items)}
    except Exception as e:
        print(f"[ERROR] Get query history failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve query history")


@router.get("/analytics/popular")
async def get_popular_analytics(limit: int = 10):
    """Return most queried topics from recent queries (naive keyword frequency)."""
    try:
        limit = max(1, min(limit, 50))
        topics = get_popular_topics(limit=limit)
        return {"popular_topics": topics}
    except Exception as e:
        print(f"[ERROR] Get analytics popular failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute analytics")


# ============================================================================
# Paper Management Endpoints
# ============================================================================

@router.get("/papers")
async def list_papers():
    """
    List all papers in the database.
    
    Returns:
    {
      "papers": [
        {
          "id": 1,
          "title": "Sustainability in Blockchain",
          "authors": "Hani Alshahrani, ...",
          "year": "2023",
          "filename": "paper_1.pdf",
          "pages": 24,
          "created_at": "2025-10-30T12:00:00"
        }
      ],
      "total": 1
    }
    """
    try:
        from ..models.db import SessionLocal, Paper
        
        with SessionLocal() as session:
            papers = session.query(Paper).order_by(Paper.created_at.desc()).all()
            
            result = []
            for paper in papers:
                result.append({
                    "id": paper.id,
                    "title": paper.title,
                    "authors": paper.authors,
                    "year": paper.year,
                    "filename": paper.filename,
                    "pages": paper.pages,
                    "created_at": paper.created_at.isoformat() if paper.created_at else None
                })
            
            return {"papers": result, "total": len(result)}
    
    except Exception as e:
        import traceback
        print(f"[ERROR] List papers failed: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to list papers: {str(e)}")


@router.get("/papers/{paper_id}")
async def get_paper(paper_id: int):
    """
    Get details of a specific paper by ID.
    
    Returns:
    {
      "id": 1,
      "title": "Sustainability in Blockchain",
      "authors": "Hani Alshahrani, ...",
      "year": "2023",
      "filename": "paper_1.pdf",
      "pages": 24,
      "created_at": "2025-10-30T12:00:00"
    }
    """
    try:
        from ..models.db import SessionLocal, Paper
        
        with SessionLocal() as session:
            paper = session.query(Paper).filter(Paper.id == paper_id).first()
            
            if not paper:
                raise HTTPException(status_code=404, detail=f"Paper with ID {paper_id} not found")
            
            return {
                "id": paper.id,
                "title": paper.title,
                "authors": paper.authors,
                "year": paper.year,
                "filename": paper.filename,
                "pages": paper.pages,
                "created_at": paper.created_at.isoformat() if paper.created_at else None
            }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] Get paper failed: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get paper: {str(e)}")


@router.delete("/papers/{paper_id}")
async def delete_paper(paper_id: int):
    """
    Delete a paper from the database and remove its vectors from Qdrant.
    
    Returns:
    {
      "message": "Paper deleted successfully",
      "paper_id": 1,
      "vectors_deleted": 119
    }
    """
    try:
        from ..models.db import SessionLocal, Paper
        from qdrant_client.http import models as qdrant_models
        
        with SessionLocal() as session:
            paper = session.query(Paper).filter(Paper.id == paper_id).first()
            
            if not paper:
                raise HTTPException(status_code=404, detail=f"Paper with ID {paper_id} not found")
            
            paper_title = paper.title or paper.filename
            
            # Delete vectors from Qdrant
            try:
                # Delete all points where paper_id matches
                qdrant_client.client.delete(
                    collection_name=qdrant_client.COLLECTION_NAME,
                    points_selector=qdrant_models.FilterSelector(
                        filter=qdrant_models.Filter(
                            must=[
                                qdrant_models.FieldCondition(
                                    key="paper_id",
                                    match=qdrant_models.MatchValue(value=paper_id)
                                )
                            ]
                        )
                    )
                )
                vectors_deleted = True
            except Exception as e:
                print(f"[WARNING] Failed to delete vectors from Qdrant: {e}")
                vectors_deleted = False
            
            # Delete paper from database
            session.delete(paper)
            session.commit()
            
            return {
                "message": "Paper deleted successfully",
                "paper_id": paper_id,
                "paper_title": paper_title,
                "vectors_deleted": vectors_deleted
            }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] Delete paper failed: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to delete paper: {str(e)}")


@router.get("/papers/{paper_id}/stats")
async def get_paper_stats(paper_id: int):
    """
    Get statistics for a specific paper.
    
    Returns:
    {
      "paper_id": 1,
      "title": "Sustainability in Blockchain",
      "filename": "paper_1.pdf",
      "pages": 24,
      "total_chunks": 119,
      "sections": {
        "Abstract": 7,
        "Introduction": 35,
        "Methods": 12,
        "Results": 33,
        "Discussion": 1,
        "Conclusion": 4,
        "References": 27
      },
      "avg_chunk_length": 450,
      "created_at": "2025-10-30T12:00:00"
    }
    """
    try:
        from ..models.db import SessionLocal, Paper
        from collections import Counter
        
        with SessionLocal() as session:
            paper = session.query(Paper).filter(Paper.id == paper_id).first()
            
            if not paper:
                raise HTTPException(status_code=404, detail=f"Paper with ID {paper_id} not found")
            
            # Query Qdrant for all chunks of this paper
            try:
                from qdrant_client.http import models as qdrant_models
                
                # Scroll through all points for this paper
                scroll_result = qdrant_client.client.scroll(
                    collection_name=qdrant_client.COLLECTION_NAME,
                    scroll_filter=qdrant_models.Filter(
                        must=[
                            qdrant_models.FieldCondition(
                                key="paper_id",
                                match=qdrant_models.MatchValue(value=paper_id)
                            )
                        ]
                    ),
                    limit=1000,  # Get up to 1000 chunks
                    with_payload=True,
                    with_vectors=False
                )
                
                chunks = scroll_result[0] if scroll_result else []
                
                # Calculate statistics
                sections = Counter()
                chunk_lengths = []
                
                for point in chunks:
                    payload = point.payload or {}
                    section = payload.get("section", "Unknown")
                    text = payload.get("text", "")
                    
                    sections[section] += 1
                    chunk_lengths.append(len(text))
                
                avg_chunk_length = int(sum(chunk_lengths) / len(chunk_lengths)) if chunk_lengths else 0
                
                return {
                    "paper_id": paper.id,
                    "title": paper.title,
                    "filename": paper.filename,
                    "pages": paper.pages,
                    "total_chunks": len(chunks),
                    "sections": dict(sections),
                    "avg_chunk_length": avg_chunk_length,
                    "created_at": paper.created_at.isoformat() if paper.created_at else None
                }
                
            except Exception as e:
                print(f"[WARNING] Failed to get chunk stats from Qdrant: {e}")
                # Return basic stats without chunk information
                return {
                    "paper_id": paper.id,
                    "title": paper.title,
                    "filename": paper.filename,
                    "pages": paper.pages,
                    "total_chunks": 0,
                    "sections": {},
                    "avg_chunk_length": 0,
                    "created_at": paper.created_at.isoformat() if paper.created_at else None,
                    "note": "Chunk statistics unavailable"
                }
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[ERROR] Get paper stats failed: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get paper stats: {str(e)}")