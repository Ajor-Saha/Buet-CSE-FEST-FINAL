import { Request, Response } from 'express';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import OpenAI from 'openai';
import LlamaCloud from '@llamaindex/llama-cloud';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import { materialsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize OpenAI Embeddings
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small',
  dimensions: 512,
});

/**
 * Helper: Chunk text with 20% overlap
 */
function chunkTextWithOverlap(text: string, chunkSize: number = 1000, overlapPercentage: number = 20): string[] {
  const overlap = Math.floor(chunkSize * (overlapPercentage / 100));
  const chunks: string[] = [];
  
  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    
    // Move forward by (chunkSize - overlap)
    startIndex += (chunkSize - overlap);
    
    if (endIndex >= text.length) break;
  }
  
  return chunks;
}

/**
 * API 1: Process, parse, chunk (20% overlap), embed, and index in Pinecone
 * @route POST /api/rag/process-and-index
 * 
 * Workflow:
 * 1. Download file from Cloudflare R2 URL
 * 2. Parse file content using LlamaCloud
 * 3. Chunk parsed content with 20% overlap
 * 4. Generate embeddings for chunks
 * 5. Store chunks + embeddings in Pinecone vector DB
 */
export const processAndIndexMaterial = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { material_id, file_url } = req.body;

    if (!material_id || !file_url) {
      return res.status(400).json(new ApiResponse(400, {}, 'Material ID and file URL are required'));
    }

    // Validate API keys
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      return res.status(500).json(new ApiResponse(500, {}, 'LlamaCloud API key not configured'));
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(new ApiResponse(500, {}, 'OpenAI API key not configured'));
    }
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return res.status(500).json(new ApiResponse(500, {}, 'Pinecone not configured'));
    }

    console.log('📥 Step 1: Downloading file from Cloudflare R2...');
    
    // Fetch material metadata
    const [material] = await db
      .select()
      .from(materialsTable)
      .where(eq(materialsTable.material_id, material_id))
      .limit(1);

    if (!material) {
      return res.status(404).json(new ApiResponse(404, {}, 'Material not found'));
    }

    // Download file from R2
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Save to temp file
    const tempFilePath = path.join('/tmp', `${material_id}-${Date.now()}.pdf`);
    await fs.writeFile(tempFilePath, buffer);

    console.log(`📦 File size: ${buffer.length} bytes`);

    // Step 2: Parse file using LlamaCloud
    console.log('☁️  Step 2: Parsing file with LlamaCloud...');
    
    const llamaCloud = new LlamaCloud({
      apiKey: process.env.LLAMA_CLOUD_API_KEY,
    });

    const fileStream = fsSync.createReadStream(tempFilePath);

    // Upload file first
    const fileObj = await llamaCloud.files.create({
      file: fileStream,
      purpose: 'parse',
    });

    // Then parse the uploaded file
    const result = await llamaCloud.parsing.parse({
      file_id: fileObj.id,
      tier: 'agentic',
      version: 'latest',
      input_options: {},
      output_options: {
        markdown: {
          tables: {
            output_tables_as_markdown: false,
          },
        },
        images_to_save: ['screenshot', 'embedded', 'layout'],
      },
      processing_options: {
        ignore: {
          ignore_diagonal_text: true,
        },
        ocr_parameters: {
          languages: ['en'],
        },
      },
      expand: ['text', 'markdown', 'items', 'images_content_metadata'],
    });

    console.log('✅ Parsing complete!');

    // Extract all text content
    const textPages = result.text?.pages || [];
    const markdownPages = result.markdown?.pages || [];
    const allText = textPages.map((page: any) => page.text).join('\n\n');

    console.log(`📄 Extracted ${allText.length} characters from ${textPages.length} pages`);

    // Step 3: Chunk with 20% overlap
    console.log('✂️  Step 3: Chunking content with 20% overlap...');
    
    const chunks = chunkTextWithOverlap(allText, 1000, 20);
    
    console.log(`📦 Created ${chunks.length} chunks with 20% overlap`);

    // Step 4 & 5: Create documents with metadata and store in Pinecone
    console.log('🔢 Step 4: Generating embeddings and storing in Pinecone...');

    const documents: Document[] = chunks.map((chunk, index) => {
      return new Document({
        pageContent: chunk,
        metadata: {
          material_id: material_id,
          course_id: material.course_id,
          material_title: material.title,
          material_category: material.category,
          chunk_index: index,
          total_chunks: chunks.length,
          user_id: req.user!.user_id,
        },
      });
    });

    // Get Pinecone index
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    // Store in Pinecone with embeddings
    await PineconeStore.fromDocuments(documents, embeddings, {
      pineconeIndex,
      namespace: `course_${material.course_id}`, // Separate by course
    });

    console.log('✅ Successfully indexed in Pinecone!');

    // Clean up temp file
    await fs.unlink(tempFilePath);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          material_id,
          material_title: material.title,
          processing_summary: {
            total_pages: textPages.length,
            total_characters: allText.length,
            total_chunks: chunks.length,
            chunk_size: 1000,
            overlap_percentage: 20,
            indexed_in_pinecone: true,
            namespace: `course_${material.course_id}`,
          },
        },
        'Material processed and indexed successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error processing material:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Failed to process material'));
  }
});

/**
 * API 2: RAG Chatbot - Semantic search + LLM answer generation
 * @route POST /api/rag/chat
 * 
 * Workflow:
 * 1. User asks a question
 * 2. System performs semantic search in Pinecone
 * 3. Retrieves top N relevant chunks
 * 4. LLM generates answer based on retrieved context
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

    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return res.status(500).json(new ApiResponse(500, {}, 'Pinecone not configured'));
    }

    console.log('💬 RAG Chat question:', question);

    // Step 1: Semantic search in Pinecone
    console.log('🔍 Step 1: Performing semantic search in Pinecone...');

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    // Create vector store for the specific course namespace
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: course_id ? `course_${course_id}` : undefined,
    });

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearch(question, top_k);

    if (relevantDocs.length === 0) {
      return res.status(404).json(
        new ApiResponse(404, {}, 'No relevant course materials found. Please upload materials first.')
      );
    }

    console.log(`📚 Retrieved ${relevantDocs.length} relevant chunks`);

    // Step 2: Build context from retrieved chunks
    const context = relevantDocs
      .map((doc: any, idx: number) => {
        const metadata = doc.metadata;
        let chunkText = `[Chunk ${idx + 1} - ${metadata.material_title || 'Material'}`;
        if (metadata.chunk_index !== undefined) {
          chunkText += `, Chunk ${metadata.chunk_index + 1}/${metadata.total_chunks}`;
        }
        chunkText += `]\n${doc.pageContent}`;
        return chunkText;
      })
      .join('\n\n---\n\n');

    // Step 3: Generate answer using LLM
    console.log('🤖 Step 2: Generating answer with GPT-4o-mini...');

    const systemPrompt = `You are an intelligent tutoring assistant helping students learn from their course materials.

INSTRUCTIONS:
1. Answer the question using ONLY the provided context from course materials
2. If the context contains code, explain it clearly with proper formatting
3. If the context has tables, format them properly
4. Cite which material you're referencing (e.g., "According to Material X...")
5. If the context doesn't contain enough information, say so honestly
6. Be pedagogical - help students understand, don't just give answers
7. Use clear examples and explanations

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
      max_tokens: 1500,
    });

    const answer = completion.choices[0].message.content;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          question,
          answer,
          sources: relevantDocs.map((doc: any) => ({
            material: doc.metadata.material_title || 'Unknown',
            chunk_index: doc.metadata.chunk_index,
            category: doc.metadata.material_category,
            excerpt: doc.pageContent.substring(0, 200) + '...',
          })),
          tokens_used: completion.usage?.total_tokens,
          model: 'gpt-4o-mini',
        },
        'Answer generated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error in RAG chat:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Chat failed'));
  }
});
