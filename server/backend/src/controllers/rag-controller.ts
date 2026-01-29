import { Request, Response } from 'express';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize OpenAI Embeddings - Using large model for better accuracy
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  dimensions: 1024,
});

/**
 * RAG Chatbot - Semantic search + AI answer generation
 * @route POST /api/rag/chat
 * 
 * Workflow:
 * 1. User asks a question
 * 2. Perform semantic search in Pinecone vector DB
 * 3. Retrieve top N relevant chunks
 * 4. Generate AI answer based on retrieved context
 */
export const ragChat = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { question, course_id, material_id, category, week_number, top_k = 8 } = req.body;

    if (!question) {
      return res.status(400).json(new ApiResponse(400, {}, 'Question is required'));
    }

    // Validate API keys
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(new ApiResponse(500, {}, 'OpenAI API key not configured'));
    }
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return res.status(500).json(new ApiResponse(500, {}, 'Pinecone not configured'));
    }

    console.log('💬 User question:', question);
    console.log('🔍 Filters - Course:', course_id, '| Material:', material_id, '| Category:', category, '| Week:', week_number);

    // Step 1: Enhanced semantic search with metadata filtering
    console.log('🔍 Performing semantic search with filters...');

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: course_id ? `course_${course_id}` : undefined,
    });

    // Build metadata filter
    const metadataFilter: any = {};
    if (material_id) metadataFilter.material_id = { $eq: material_id };
    if (category) metadataFilter.category = { $eq: category };
    if (week_number) metadataFilter.week_number = { $eq: week_number };

    // Perform similarity search with filters
    const relevantDocs = await vectorStore.similaritySearch(
      question,
      top_k,
      Object.keys(metadataFilter).length > 0 ? metadataFilter : undefined
    );

    if (relevantDocs.length === 0) {
      return res.status(404).json(
        new ApiResponse(
          404,
          {
            debug_info: {
              course_id,
              material_id,
              category,
              week_number,
              namespace: course_id ? `course_${course_id}` : 'default',
              filters_applied: metadataFilter,
            },
          },
          'No relevant content found. The material may not be indexed yet.'
        )
      );
    }

    console.log(`📚 Found ${relevantDocs.length} relevant chunks`);

    // Step 2: Build rich context from retrieved chunks
    const context = relevantDocs
      .map((doc: any, idx: number) => {
        const meta = doc.metadata;
        let header = `### Source ${idx + 1}: ${meta.material_title || 'Material'}`;
        if (meta.page_number) header += ` (Page ${meta.page_number})`;
        if (meta.category) header += ` [${meta.category.toUpperCase()}]`;
        if (meta.is_code) header += ` [CODE${meta.language ? ` - ${meta.language}` : ''}]`;
        return `${header}\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');

    console.log('🤖 Generating AI answer...');

    // Step 3: Improved prompt engineering with Theory/Lab awareness
    const isLabMaterial = relevantDocs.some((doc: any) => doc.metadata.category === 'lab' || doc.metadata.is_code);
    
    const systemPrompt = `You are an expert AI tutor helping students understand their course materials.

**INSTRUCTIONS:**
1. Answer ONLY using the provided context from course materials
2. Be clear, detailed, and pedagogical in your explanations
3. ${isLabMaterial ? 'For code examples, explain the logic step-by-step with proper formatting' : 'Focus on theoretical concepts and explanations'}
4. If the context contains tables, format them clearly
5. Cite sources by referencing "Source 1", "Source 2", etc.
6. If the context doesn't contain enough information, say so honestly - don't make up information
7. Use examples from the materials when explaining concepts
8. For complex topics, break down your explanation into simple steps

**AVAILABLE CONTEXT:**
${context}

Now answer the student's question based ONLY on this context. Be helpful and educational.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.5, // Lower temperature for more focused answers
      max_tokens: 2000,
    });

    const answer = completion.choices[0].message.content;

    // Enhanced response with debug info
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          question,
          answer,
          sources: relevantDocs.map((doc: any, idx: number) => ({
            source_number: idx + 1,
            material: doc.metadata.material_title || 'Unknown',
            category: doc.metadata.category,
            page: doc.metadata.page_number,
            chunk_type: doc.metadata.chunk_type,
            is_code: doc.metadata.is_code,
            language: doc.metadata.language,
            topic: doc.metadata.topic,
            week: doc.metadata.week_number,
            excerpt: doc.pageContent.substring(0, 300) + '...',
          })),
          metadata: {
            chunks_found: relevantDocs.length,
            tokens_used: completion.usage?.total_tokens,
            course_id,
            material_id,
            category,
            filters_applied: Object.keys(metadataFilter).length,
            is_lab_content: isLabMaterial,
          },
        },
        'Answer generated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error in RAG chat:', error);
    return res.status(500).json(
      new ApiResponse(500, { error: error.message }, 'Chat failed')
    );
  }
});
