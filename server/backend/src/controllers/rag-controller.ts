import { Request, Response } from 'express';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import OpenAI from 'openai';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import { materialChunksTable, chunkEmbeddingsTable, materialsTable } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate embeddings for all chunks of a material
 * @route POST /api/rag/generate-embeddings
 */
export const generateEmbeddings = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { material_id } = req.body;

    if (!material_id) {
      return res.status(400).json(new ApiResponse(400, {}, 'Material ID is required'));
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(new ApiResponse(500, {}, 'OpenAI API key not configured'));
    }

    console.log('📊 Fetching chunks for material:', material_id);

    // Get all chunks for this material
    const chunks = await db
      .select()
      .from(materialChunksTable)
      .where(eq(materialChunksTable.material_id, material_id))
      .orderBy(materialChunksTable.chunk_order);

    if (chunks.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, 'No chunks found for this material'));
    }

    console.log(`🔢 Generating embeddings for ${chunks.length} chunks...`);

    let processedCount = 0;
    const batchSize = 100; // OpenAI allows batching

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(chunk => chunk.chunk_text),
        dimensions: 1536,
      });

      // Store embeddings
      const embeddingsToInsert = batch.map((chunk, idx) => ({
        chunk_id: chunk.chunk_id,
        embedding: JSON.stringify(response.data[idx].embedding), // Store as JSON string for pgvector
        model: 'text-embedding-3-small',
      }));

      await db.insert(chunkEmbeddingsTable).values(embeddingsToInsert);

      processedCount += batch.length;
      console.log(`✅ Processed ${processedCount}/${chunks.length} chunks`);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          material_id,
          total_chunks: chunks.length,
          embeddings_generated: processedCount,
        },
        'Embeddings generated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error generating embeddings:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Failed to generate embeddings'));
  }
});

/**
 * Semantic search across course materials
 * @route POST /api/rag/semantic-search
 */
export const semanticSearch = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { query, course_id, top_k = 5 } = req.body;

    if (!query) {
      return res.status(400).json(new ApiResponse(400, {}, 'Query is required'));
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(new ApiResponse(500, {}, 'OpenAI API key not configured'));
    }

    console.log('🔍 Semantic search query:', query);

    // Generate embedding for query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = response.data[0].embedding;

    // Build SQL for vector similarity search
    let similarityQuery = db
      .select({
        chunk_id: materialChunksTable.chunk_id,
        material_id: materialChunksTable.material_id,
        chunk_text: materialChunksTable.chunk_text,
        chunk_type: materialChunksTable.chunk_type,
        page_number: materialChunksTable.page_number,
        is_code: materialChunksTable.is_code,
        language: materialChunksTable.language,
        material_title: materialsTable.title,
        material_category: materialsTable.category,
        similarity: sql<number>`1 - (${chunkEmbeddingsTable.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
      })
      .from(materialChunksTable)
      .innerJoin(
        chunkEmbeddingsTable,
        eq(materialChunksTable.chunk_id, chunkEmbeddingsTable.chunk_id)
      )
      .innerJoin(
        materialsTable,
        eq(materialChunksTable.material_id, materialsTable.material_id)
      );

    // Filter by course if specified
    if (course_id) {
      similarityQuery = similarityQuery.where(eq(materialsTable.course_id, course_id));
    }

    // Get top-k most similar chunks
    const results = await similarityQuery
      .orderBy(sql`${chunkEmbeddingsTable.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(top_k);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          query,
          results: results.map(r => ({
            chunk_id: r.chunk_id,
            material_id: r.material_id,
            material_title: r.material_title,
            material_category: r.material_category,
            chunk_type: r.chunk_type,
            page_number: r.page_number,
            is_code: r.is_code,
            language: r.language,
            text_excerpt: r.chunk_text.substring(0, 500) + (r.chunk_text.length > 500 ? '...' : ''),
            similarity_score: r.similarity,
          })),
        },
        'Search completed successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error in semantic search:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Search failed'));
  }
});

/**
 * RAG-based chatbot - Answer questions using course materials
 * @route POST /api/rag/chat
 */
export const ragChat = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { question, course_id, top_k = 5 } = req.body;

    if (!question) {
      return res.status(400).json(new ApiResponse(400, {}, 'Question is required'));
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(new ApiResponse(500, {}, 'OpenAI API key not configured'));
    }

    console.log('💬 RAG Chat question:', question);

    // Step 1: Retrieve relevant chunks (same as semantic search)
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
      dimensions: 1536,
    });

    const queryEmbedding = response.data[0].embedding;

    let retrievalQuery = db
      .select({
        chunk_text: materialChunksTable.chunk_text,
        chunk_type: materialChunksTable.chunk_type,
        page_number: materialChunksTable.page_number,
        material_title: materialsTable.title,
        is_code: materialChunksTable.is_code,
        language: materialChunksTable.language,
      })
      .from(materialChunksTable)
      .innerJoin(
        chunkEmbeddingsTable,
        eq(materialChunksTable.chunk_id, chunkEmbeddingsTable.chunk_id)
      )
      .innerJoin(
        materialsTable,
        eq(materialChunksTable.material_id, materialsTable.material_id)
      );

    if (course_id) {
      retrievalQuery = retrievalQuery.where(eq(materialsTable.course_id, course_id));
    }

    const relevantChunks = await retrievalQuery
      .orderBy(sql`${chunkEmbeddingsTable.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(top_k);

    if (relevantChunks.length === 0) {
      return res.status(404).json(
        new ApiResponse(404, {}, 'No relevant course materials found. Please upload materials first.')
      );
    }

    console.log(`📚 Retrieved ${relevantChunks.length} relevant chunks`);

    // Step 2: Build context from retrieved chunks
    const context = relevantChunks
      .map((chunk, idx) => {
        let chunkText = `[Chunk ${idx + 1} - ${chunk.material_title}, Page ${chunk.page_number}`;
        if (chunk.is_code && chunk.language) {
          chunkText += `, Code: ${chunk.language}`;
        }
        chunkText += `]\n${chunk.chunk_text}`;
        return chunkText;
      })
      .join('\n\n---\n\n');

    // Step 3: Generate answer using LLM with context
    const systemPrompt = `You are an intelligent tutoring assistant helping students learn from their course materials.

INSTRUCTIONS:
1. Answer the question using ONLY the provided context from course materials
2. If the context contains code, explain it clearly with syntax highlighting
3. If the context has tables, format them properly
4. Cite which material/page you're referencing
5. If the context doesn't contain enough information, say so honestly
6. Be pedagogical - help students understand, don't just give answers

CONTEXT FROM COURSE MATERIALS:
${context}

Now answer the student's question based on this context.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const answer = completion.choices[0].message.content;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          question,
          answer,
          sources: relevantChunks.map(chunk => ({
            material: chunk.material_title,
            page: chunk.page_number,
            type: chunk.chunk_type,
            is_code: chunk.is_code,
            language: chunk.language,
          })),
          tokens_used: completion.usage?.total_tokens,
        },
        'Answer generated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error in RAG chat:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Chat failed'));
  }
});

/**
 * Syntax-aware code search
 * @route POST /api/rag/code-search
 */
export const codeSearch = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { query, course_id, language, top_k = 5 } = req.body;

    if (!query) {
      return res.status(400).json(new ApiResponse(400, {}, 'Query is required'));
    }

    console.log('💻 Code search query:', query);

    // Generate embedding for query
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    });

    const queryEmbedding = response.data[0].embedding;

    // Search only code chunks
    let codeQuery = db
      .select({
        chunk_id: materialChunksTable.chunk_id,
        chunk_text: materialChunksTable.chunk_text,
        page_number: materialChunksTable.page_number,
        language: materialChunksTable.language,
        material_title: materialsTable.title,
        similarity: sql<number>`1 - (${chunkEmbeddingsTable.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`,
      })
      .from(materialChunksTable)
      .innerJoin(
        chunkEmbeddingsTable,
        eq(materialChunksTable.chunk_id, chunkEmbeddingsTable.chunk_id)
      )
      .innerJoin(
        materialsTable,
        eq(materialChunksTable.material_id, materialsTable.material_id)
      )
      .where(eq(materialChunksTable.is_code, true));

    if (course_id) {
      codeQuery = codeQuery.where(and(
        eq(materialChunksTable.is_code, true),
        eq(materialsTable.course_id, course_id)
      ));
    }

    if (language) {
      codeQuery = codeQuery.where(and(
        eq(materialChunksTable.is_code, true),
        eq(materialChunksTable.language, language)
      ));
    }

    const results = await codeQuery
      .orderBy(sql`${chunkEmbeddingsTable.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(top_k);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          query,
          results: results.map(r => ({
            chunk_id: r.chunk_id,
            material_title: r.material_title,
            page_number: r.page_number,
            language: r.language,
            code: r.chunk_text,
            similarity_score: r.similarity,
          })),
        },
        'Code search completed successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error in code search:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Code search failed'));
  }
});
