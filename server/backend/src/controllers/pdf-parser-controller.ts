

import LlamaCloud from '@llamaindex/llama-cloud';
import { Request, Response } from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';
import { db } from '../db';
import { materialsTable, materialChunksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

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
 * Helper: Chunk text with overlap, optimized for RAG
 */
function chunkTextWithOverlap(text: string, chunkSize: number = 800, overlapPercentage: number = 25): string[] {
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
 * Helper: Detect if text contains code
 */
function isCodeContent(text: string): { isCode: boolean; language?: string } {
  // Code patterns
  const codePatterns = [
    /^(import|from|include|using|package)\s+/m,
    /\bfunction\s+\w+\s*\(/,
    /\bclass\s+\w+/,
    /\bdef\s+\w+\s*\(/,
    /\bpublic\s+(class|interface|static)/,
    /^\s*(const|let|var)\s+\w+\s*=/m,
    /\w+\s*\(\s*\)\s*{/,
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\bif\s*\(/,
  ];
  
  const hasCodePattern = codePatterns.some(pattern => pattern.test(text));
  
  // Language detection
  let language: string | undefined;
  if (hasCodePattern) {
    if (/(import|from)\s+\w+/.test(text) && /def\s+/.test(text)) language = 'python';
    else if (/(const|let|var|function)/.test(text)) language = 'javascript';
    else if (/(public|private|class)\s+/.test(text) && /;$/.test(text.trim())) language = 'java';
    else if (/#include/.test(text)) language = 'cpp';
    else language = 'code';
  }
  
  return { isCode: hasCodePattern, language };
}

/**
 * Parse material from URL and prepare for RAG system
 * @route POST /api/pdf-parser/parse-from-url
 */


export const parseFromUrl = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { material_id, file_url } = req.body;

    // Validate required fields
    if (!material_id || !file_url) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Material ID and file URL are required')
      );
    }

    // Validate LlamaCloud API key
    if (!process.env.LLAMA_CLOUD_API_KEY) {
      return res.status(500).json(
        new ApiResponse(500, {}, 'LlamaCloud API key not configured')
      );
    }

    console.log('📥 Downloading file from URL:', file_url);

    // Fetch material from database
    const [material] = await db
      .select()
      .from(materialsTable)
      .where(eq(materialsTable.material_id, material_id))
      .limit(1);

    if (!material) {
      return res.status(404).json(new ApiResponse(404, {}, 'Material not found'));
    }

    // Download file from URL
    const response = await fetch(file_url);
    if (!response.ok) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'Failed to download file from URL')
      );
    }

    // Get file extension from material or URL
    const fileExtension = material.file_name 
      ? path.extname(material.file_name) 
      : path.extname(new URL(file_url).pathname) || '.pdf';

    // Create temporary file with proper extension
    const tempDir = '/tmp';
    const tempFileName = `${material_id}-${Date.now()}${fileExtension}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Save file to temp location
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(tempFilePath, buffer);

    console.log('📄 Processing material:', material.title);
    console.log('📦 File size:', buffer.length, 'bytes');

    // Initialize LlamaCloud client
    const client = new LlamaCloud({ 
      apiKey: process.env.LLAMA_CLOUD_API_KEY 
    });

    console.log('☁️ Uploading to LlamaCloud...');

    // Use stream for upload
    const fileStream = fsSync.createReadStream(tempFilePath);

    // Upload file to LlamaCloud
    const fileObj = await client.files.create({
      file: fileStream,
      purpose: 'parse',
    });

    console.log('🔍 Parsing document with LlamaCloud...');

    // Parse the document
    const result = await client.parsing.parse({
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

    // Extract tables
    const tables: any[] = [];
    const pageData: any[] = [];

    if (result.items?.pages) {
      for (const page of result.items.pages) {
        // Type guard: Only process StructuredResultPage, skip FailedStructuredPage
        if (!('items' in page)) {
          console.warn(`⚠️  Skipping failed page ${page.page_number}`);
          continue;
        }

        const pageInfo = {
          page_number: page.page_number,
          items: [] as any[],
          tables: [] as any[],
        };

        for (const item of page.items) {
          if (item.type === 'table') {
            const tableData = {
              page: page.page_number,
              rows: item.rows?.length || 0,
              columns: Array.isArray(item.rows?.[0]) ? item.rows[0].length : 0,
              bbox: item.bbox,
              content: item.rows || [],
            };
            tables.push(tableData);
            pageInfo.tables.push(tableData);
          }
          pageInfo.items.push(item);
        }
        pageData.push(pageInfo);
      }
    }

    // Extract text and markdown per page
    const textPages = result.text?.pages?.map((page: any) => ({
      page_number: page.page_number,
      text: page.text,
    })) || [];

    const markdownPages = result.markdown?.pages?.map((page: any) => ({
      page_number: page.page_number,
      markdown: page.markdown,
    })) || [];

    // Extract images
    const images = result.images_content_metadata?.images?.map((image: any) => ({
      filename: image.filename,
      size_bytes: image.size_bytes,
      page_number: image.page_number,
      bbox: image.bbox,
      presigned_url: image.presigned_url,
      type: image.type,
    })) || [];

    // Create unified chunks for both DB and Pinecone (CRITICAL FIX)
    console.log('✂️  Creating intelligent chunks with 25% overlap...');
    
    const chunksForDB: any[] = [];
    const documentsForPinecone: Document[] = [];
    let chunkOrderCounter = 0;

    // Process each page
    for (let i = 0; i < textPages.length; i++) {
      const textPage = textPages[i];
      const mdPage = markdownPages[i];
      const pageInfo = pageData.find(p => p.page_number === textPage.page_number);

      if (!textPage.text || textPage.text.trim().length === 0) continue;

      // Detect if this page contains code
      const codeAnalysis = isCodeContent(textPage.text);

      // Split page text into smaller chunks with overlap
      const pageChunks = chunkTextWithOverlap(textPage.text, 800, 25);

      for (let chunkIdx = 0; chunkIdx < pageChunks.length; chunkIdx++) {
        const chunkText = pageChunks[chunkIdx];
        
        // Enhanced context header for better retrieval
        const contextHeader = `[${material.title} - ${material.category.toUpperCase()} - Page ${textPage.page_number}]\n`;
        const fullChunkText = contextHeader + chunkText;

        // Prepare rich metadata
        const chunkMetadata = {
          material_title: material.title,
          category: material.category,
          material_type: material.material_type,
          topic: material.topic,
          week_number: material.week_number,
          tags: material.tags,
          page_number: textPage.page_number,
          chunk_index: chunkIdx,
          total_page_chunks: pageChunks.length,
          has_tables: pageInfo?.tables?.length > 0 || false,
          is_code: codeAnalysis.isCode,
          language: codeAnalysis.language,
          created_at: new Date().toISOString(),
        };

        // Store in DB
        chunksForDB.push({
          material_id: material_id,
          chunk_text: chunkText,
          chunk_order: chunkOrderCounter++,
          chunk_type: codeAnalysis.isCode ? 'code' : 'text',
          page_number: textPage.page_number,
          language: codeAnalysis.language,
          is_code: codeAnalysis.isCode,
          chunk_metadata: chunkMetadata,
        });

        // Store in Pinecone with rich metadata
        documentsForPinecone.push(
          new Document({
            pageContent: fullChunkText,
            metadata: {
              material_id: material_id,
              course_id: material.course_id,
              ...chunkMetadata,
            },
          })
        );
      }

      // Handle tables separately
      if (pageInfo?.tables) {
        for (const table of pageInfo.tables) {
          const tableText = `[TABLE - ${material.title} - Page ${textPage.page_number}]\n` +
                           `Rows: ${table.rows}, Columns: ${table.columns}\n` +
                           JSON.stringify(table.content, null, 2);

          const tableMetadata = {
            material_title: material.title,
            category: material.category,
            material_type: material.material_type,
            topic: material.topic,
            week_number: material.week_number,
            page_number: textPage.page_number,
            chunk_type: 'table',
            table_rows: table.rows,
            table_columns: table.columns,
            created_at: new Date().toISOString(),
          };

          chunksForDB.push({
            material_id: material_id,
            chunk_text: JSON.stringify(table.content),
            chunk_order: chunkOrderCounter++,
            chunk_type: 'table',
            page_number: textPage.page_number,
            is_code: false,
            chunk_metadata: tableMetadata,
          });

          documentsForPinecone.push(
            new Document({
              pageContent: tableText,
              metadata: {
                material_id: material_id,
                course_id: material.course_id,
                ...tableMetadata,
              },
            })
          );
        }
      }
    }

    // Store chunks in database
    console.log('💾 Storing chunks in database...');
    
    const insertedChunks = await db
      .insert(materialChunksTable)
      .values(chunksForDB)
      .returning();

    console.log(`✅ Stored ${insertedChunks.length} chunks in DB`);

    // Generate embeddings and store in Pinecone
    let pineconeVectorsStored = 0;

    if (process.env.OPENAI_API_KEY && process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
      try {
        console.log('☁️  Storing embeddings in Pinecone...');

        // Get Pinecone index
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

        // Store in Pinecone with embeddings
        await PineconeStore.fromDocuments(documentsForPinecone, embeddings, {
          pineconeIndex,
          namespace: `course_${material.course_id}`,
        });

        pineconeVectorsStored = documentsForPinecone.length;

        console.log(`✅ Stored ${pineconeVectorsStored} vectors in Pinecone`);

        // Update material indexing status
        await db
          .update(materialsTable)
          .set({
            is_indexed: true,
            indexed_at: new Date(),
            vector_count: pineconeVectorsStored,
            chunk_count: insertedChunks.length,
          })
          .where(eq(materialsTable.material_id, material_id));
      } catch (embeddingError: any) {
        console.error('⚠️  Error generating embeddings:', embeddingError.message);
        // Don't fail the entire request if embeddings fail
      }
    } else {
      console.log('⚠️  Skipping embeddings: OpenAI or Pinecone not configured');
    }

    // Clean up temporary file
    await fs.unlink(tempFilePath);

    // Return parsed data
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          material_id: material_id,
          file_info: {
            original_filename: material.file_name,
            file_url: file_url,
          },
          parsing_info: {
            total_pages: textPages.length,
            total_tables: tables.length,
            total_images: images.length,
            total_chunks: insertedChunks.length,
            pinecone_vectors_stored: pineconeVectorsStored,
            chunk_size: 800,
            overlap_percentage: 25,
          },
          chunks_stored: insertedChunks.length,
          pinecone_vectors_stored: pineconeVectorsStored,
          indexed: pineconeVectorsStored > 0,
          content: {
            text_pages: textPages,
            markdown_pages: markdownPages,
            tables: tables,
            images: images,
            structured_items: pageData,
          },
        },
        pineconeVectorsStored > 0 
          ? 'Document parsed, chunked, embedded, and stored successfully'
          : 'Document parsed and chunks stored successfully (embeddings skipped)'
      )
    );
  } catch (error: any) {
    console.error('❌ Error parsing document:', error);
    
    return res.status(500).json(
      new ApiResponse(
        500,
        { error: error.message },
        'Failed to parse document'
      )
    );
  }
});

/**
 * Extract text only (faster, simpler) - keeping for backward compatibility
 * @route POST /api/pdf-parser/extract-text
 */
export const extractTextOnly = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const file = (req as any).file;

    if (!file || !file.filepath) {
      return res.status(400).json(
        new ApiResponse(400, {}, 'No file uploaded')
      );
    }

    if (!process.env.LLAMA_CLOUD_API_KEY) {
      return res.status(500).json(
        new ApiResponse(500, {}, 'LlamaCloud API key not configured')
      );
    }

    console.log('📄 Extracting text from:', file.originalFilename);

    const client = new LlamaCloud({ 
      apiKey: process.env.LLAMA_CLOUD_API_KEY 
    });

    // Use stream instead of buffer
    const fileStream = fsSync.createReadStream(file.filepath);

    const fileObj = await client.files.create({
      file: fileStream,
      purpose: 'parse',
    });

    const result = await client.parsing.parse({
      file_id: fileObj.id,
      tier: 'fast', // Faster tier for simple text extraction
      version: 'latest',
      expand: ['text'],
    });

    // Clean up temporary file
    await fs.unlink(file.filepath);

    // Combine all page text
    const fullText = result.text?.pages?.map((page: any) => page.text).join('\n\n') || '';

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          filename: file.originalFilename,
          total_pages: result.text?.pages?.length || 0,
          full_text: fullText,
          pages: result.text?.pages || [],
        },
        'Text extracted successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error extracting text:', error);
    
    try {
      const file = (req as any).file;
      if (file?.filepath) {
        await fs.unlink(file.filepath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }

    return res.status(500).json(
      new ApiResponse(
        500,
        { error: error.message },
        'Failed to extract text'
      )
    );
  }
});
