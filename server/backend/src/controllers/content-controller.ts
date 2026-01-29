import { Request, Response } from 'express';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import PDFDocument from 'pdfkit';
import { GoogleGenAI } from '@google/genai';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Gemini AI
const ai = new GoogleGenAI({});

// Initialize Pinecone
const pinecone = new PineconeClient({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize OpenAI Embeddings
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  dimensions: 1024,
});

// JSON Schema for enhanced content generation
const enhancedContentSchema = {
  type: "object" as const,
  properties: {
    title: {
      type: "string" as const,
      description: "Clear, descriptive title for the educational content"
    },
    description: {
      type: "string" as const,
      description: "Comprehensive description (2-4 paragraphs) that synthesizes course materials with educational insights"
    }
  },
  required: ["title", "description"] as const
};

// JSON Schema for PDF content generation
const pdfContentSchema = {
  type: "object" as const,
  properties: {
    title: {
      type: "string" as const,
      description: "Document title"
    },
    introduction: {
      type: "string" as const,
      description: "Introduction text (1-2 paragraphs)"
    },
    main_content: {
      type: "string" as const,
      description: "Main content with markdown formatting"
    },
    summary: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Key takeaway points"
    },
    references: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "List of source materials used"
    }
  },
  required: ["title", "introduction", "main_content", "summary", "references"] as const
};

/**
 * API 1: Enhanced Content Generation with Online Research
 * @route POST /api/content/generate-enhanced
 * 
 * Workflow:
 * 1. Semantic search course materials in Pinecone
 * 2. AI analyzes context and searches online for relevant content
 * 3. Returns structured output with title and description
 */
export const generateEnhancedContent = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { course_id, user_prompt } = req.body;

    if (!course_id || !user_prompt) {
      return res.status(400).json(new ApiResponse(400, {}, 'Course ID and user prompt are required'));
    }

    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return res.status(500).json(new ApiResponse(500, {}, 'API keys not configured'));
    }

    console.log('🔍 Step 1: Searching course materials...');

    // Semantic search in Pinecone
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: `course_${course_id}`,
    });

    const relevantDocs = await vectorStore.similaritySearch(user_prompt, 10);

    console.log(`📚 Found ${relevantDocs.length} relevant chunks from course materials`);

    // Build context from course materials
    const courseContext = relevantDocs
      .map((doc: any, idx: number) => {
        const meta = doc.metadata;
        return `[Material ${idx + 1}: ${meta.material_title || 'Unknown'} - Page ${meta.page_number || 'N/A'}]\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');

    console.log('🤖 Step 2: AI analyzing and generating enhanced content...');

    // Build enhanced prompt with course context
    const prompt = `You are an expert educational content creator with access to course materials and general knowledge.

TASK: Create comprehensive educational content based on:
1. The provided course materials (your primary source)
2. Your general knowledge to enhance and expand the content
3. The user's specific request

COURSE MATERIALS CONTEXT:
${courseContext}

USER REQUEST: ${user_prompt}

INSTRUCTIONS:
1. Analyze the course materials thoroughly
2. Combine insights from materials with your general knowledge
3. Create well-structured, educational content
4. Provide a clear title and detailed description
5. Make content engaging and pedagogical
6. Cite course materials when using them directly
7. Enhance with additional relevant information from your knowledge base

Provide structured output with title and description fields.`;

    // Use Gemini API with structured outputs
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: enhancedContentSchema,
      },
    });

    const generatedContent = JSON.parse(response.text ?? '{}');

    console.log('✅ Content generated successfully');

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          title: generatedContent.title,
          description: generatedContent.description,
          metadata: {
            course_id,
            user_prompt,
            sources_used: relevantDocs.length,
            source_materials: relevantDocs.map((doc: any) => ({
              material: doc.metadata.material_title,
              page: doc.metadata.page_number,
              category: doc.metadata.category,
            })),
            model: 'gemini-2.5-flash',
          },
        },
        'Enhanced content generated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error generating enhanced content:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Content generation failed'));
  }
});

/**
 * API 2: Generate PDF from Course Materials and Prompt
 * @route POST /api/content/generate-pdf
 * 
 * Workflow:
 * 1. Semantic search course materials
 * 2. AI generates comprehensive content
 * 3. Creates formatted PDF document
 * 4. Returns PDF file
 */
export const generatePDF = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { course_id, user_prompt } = req.body;

    if (!course_id || !user_prompt) {
      return res.status(400).json(new ApiResponse(400, {}, 'Course ID and user prompt are required'));
    }

    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return res.status(500).json(new ApiResponse(500, {}, 'API keys not configured'));
    }

    console.log('🔍 Searching course materials for PDF generation...');

    // Semantic search in Pinecone
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: `course_${course_id}`,
    });

    const relevantDocs = await vectorStore.similaritySearch(user_prompt, 15);

    console.log(`📚 Found ${relevantDocs.length} relevant chunks`);

    // Build context
    const courseContext = relevantDocs
      .map((doc: any, idx: number) => {
        const meta = doc.metadata;
        return `[Source ${idx + 1}: ${meta.material_title || 'Material'} - Page ${meta.page_number || 'N/A'}]\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');

    console.log('🤖 Generating comprehensive content for PDF...');

    // Build prompt for PDF content generation
    const prompt = `You are an expert educational content writer creating study materials.

COURSE MATERIALS:
${courseContext}

USER REQUEST: ${user_prompt}

TASK: Create a comprehensive educational document with the following structure:

1. TITLE: Clear, descriptive title
2. INTRODUCTION: Brief overview (1-2 paragraphs)
3. MAIN CONTENT: Detailed explanation with:
   - Key concepts and definitions
   - Examples from course materials
   - Step-by-step explanations
   - Important formulas or code (if applicable)
4. SUMMARY: Key takeaways (bullet points as array of strings)
5. REFERENCES: List source materials used (as array of strings)

Make content clear, well-organized, and educational. Use markdown formatting for structure.

Provide structured output with all required fields.`;

    // Use Gemini API with structured outputs
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: pdfContentSchema,
      },
    });

    const content = JSON.parse(response.text ?? '{}');

    console.log('📄 Creating PDF document...');

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="course-material-${Date.now()}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add title
    doc.fontSize(24).font('Helvetica-Bold').text(content.title || 'Course Material', {
      align: 'center',
    });
    doc.moveDown(2);

    // Add metadata
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.text(`Course ID: ${course_id}`, { align: 'right' });
    doc.moveDown(1);
    doc.fillColor('#000000');

    // Add horizontal line
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Add introduction
    if (content.introduction) {
      doc.fontSize(16).font('Helvetica-Bold').text('Introduction', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').text(content.introduction, {
        align: 'justify',
        lineGap: 4,
      });
      doc.moveDown(1.5);
    }

    // Add main content
    if (content.main_content) {
      doc.fontSize(16).font('Helvetica-Bold').text('Content', { underline: true });
      doc.moveDown(0.5);
      
      // Parse markdown-like formatting
      const paragraphs = content.main_content.split('\n\n');
      for (const paragraph of paragraphs) {
        if (paragraph.startsWith('##')) {
          // Subheading
          doc.fontSize(14).font('Helvetica-Bold')
            .text(paragraph.replace('##', '').trim(), { lineGap: 4 });
          doc.moveDown(0.5);
        } else if (paragraph.startsWith('-') || paragraph.startsWith('*')) {
          // Bullet points
          doc.fontSize(11).font('Helvetica')
            .text(`• ${paragraph.replace(/^[-*]\s*/, '').trim()}`, {
              indent: 20,
              lineGap: 3,
            });
        } else if (paragraph.startsWith('```')) {
          // Code block
          const code = paragraph.replace(/```/g, '').trim();
          doc.fontSize(9).font('Courier')
            .fillColor('#333333')
            .text(code, {
              indent: 20,
              lineGap: 2,
            });
          doc.fillColor('#000000');
          doc.moveDown(0.5);
        } else {
          // Regular paragraph
          doc.fontSize(11).font('Helvetica').text(paragraph, {
            align: 'justify',
            lineGap: 4,
          });
          doc.moveDown(0.5);
        }
      }
      doc.moveDown(1);
    }

    // Add summary
    if (content.summary && content.summary.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Key Takeaways', { underline: true });
      doc.moveDown(0.5);
      content.summary.forEach((point: string) => {
        doc.fontSize(11).font('Helvetica')
          .text(`• ${point}`, { indent: 20, lineGap: 3 });
      });
      doc.moveDown(1.5);
    }

    // Add references
    if (content.references && content.references.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('References', { underline: true });
      doc.moveDown(0.5);
      content.references.forEach((ref: string, idx: number) => {
        doc.fontSize(10).font('Helvetica')
          .text(`[${idx + 1}] ${ref}`, { lineGap: 2 });
      });
    }

    // Add footer
    doc.fontSize(8).fillColor('#999999')
      .text('Generated by AI-Powered Learning Platform', 50, doc.page.height - 30, {
        align: 'center',
      });

    // Finalize PDF
    doc.end();

    console.log('✅ PDF generated and sent');
  } catch (error: any) {
    console.error('❌ Error generating PDF:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'PDF generation failed'));
  }
});