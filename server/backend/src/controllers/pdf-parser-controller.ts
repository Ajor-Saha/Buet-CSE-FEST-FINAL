

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

    // Create chunks for RAG system
    const chunks: any[] = [];
    
    // Chunk by pages (can be made more sophisticated)
    for (let i = 0; i < textPages.length; i++) {
      const textPage = textPages[i];
      const mdPage = markdownPages[i];
      const pageInfo = pageData.find(p => p.page_number === textPage.page_number);

      // Create text chunk
      if (textPage.text && textPage.text.trim().length > 0) {
        chunks.push({
          chunk_type: 'text',
          page_number: textPage.page_number,
          content: textPage.text,
          markdown_content: mdPage?.markdown || null,
          metadata: {
            has_tables: pageInfo?.tables?.length > 0 || false,
            table_count: pageInfo?.tables?.length || 0,
          },
        });
      }

      // Create separate chunks for tables
      if (pageInfo?.tables) {
        for (const table of pageInfo.tables) {
          chunks.push({
            chunk_type: 'table',
            page_number: textPage.page_number,
            content: JSON.stringify(table.content),
            metadata: {
              rows: table.rows,
              columns: table.columns,
              bbox: table.bbox,
            },
          });
        }
      }
    }

    // Store chunks in database for RAG
    console.log('💾 Storing chunks in database...');
    
    const insertedChunks = await db
      .insert(materialChunksTable)
      .values(
        chunks.map((chunk, index) => ({
          material_id: material_id,
          chunk_text: chunk.content, // Use chunk_text field from schema
          chunk_order: index, // Use chunk_order field from schema
          chunk_type: chunk.chunk_type,
          page_number: chunk.page_number,
          is_code: chunk.chunk_type === 'code',
        }))
      )
      .returning();

    console.log(`✅ Stored ${insertedChunks.length} chunks`);

    // Generate embeddings and store in Pinecone
    let embeddingsGenerated = 0;
    let pineconeVectorsStored = 0;

    if (process.env.OPENAI_API_KEY && process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
      try {
        console.log('🔢 Generating embeddings with 20% overlap chunking...');

        // Combine all text for overlap chunking
        const allText = textPages.map((page: any) => page.text).join('\n\n');

        // Create overlapping chunks
        const overlappingChunks = chunkTextWithOverlap(allText, 1000, 20);

        console.log(`📦 Created ${overlappingChunks.length} chunks with 20% overlap`);

        // Create documents with metadata for Pinecone
        const documents: Document[] = overlappingChunks.map((chunk, index) => {
          return new Document({
            pageContent: chunk,
            metadata: {
              material_id: material_id,
              course_id: material.course_id,
              material_title: material.title,
              material_category: material.category,
              chunk_index: index,
              total_chunks: overlappingChunks.length,
              chunk_type: 'text',
              overlap_percentage: 20,
            },
          });
        });

        // Get Pinecone index
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

        // Store in Pinecone with embeddings
        console.log('☁️  Storing embeddings in Pinecone...');
        await PineconeStore.fromDocuments(documents, embeddings, {
          pineconeIndex,
          namespace: `course_${material.course_id}`,
        });

        embeddingsGenerated = overlappingChunks.length;
        pineconeVectorsStored = overlappingChunks.length;

        console.log(`✅ Generated ${embeddingsGenerated} embeddings and stored in Pinecone`);
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
            embeddings_generated: embeddingsGenerated,
            pinecone_vectors_stored: pineconeVectorsStored,
          },
          chunks_stored: insertedChunks.length,
          embeddings_generated: embeddingsGenerated,
          pinecone_vectors_stored: pineconeVectorsStored,
          content: {
            text_pages: textPages,
            markdown_pages: markdownPages,
            tables: tables,
            images: images,
            structured_items: pageData,
          },
        },
        embeddingsGenerated > 0 
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
