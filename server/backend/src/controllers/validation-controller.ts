import { Request, Response } from 'express';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/api-response';

// Initialize Gemini AI
const ai = new GoogleGenAI({});

// Language mapping for Piston API
const LANGUAGE_MAP: Record<string, string> = {
  'cpp': 'c++',
  'c++': 'c++',
  'c': 'c',
  'python': 'python',
  'py': 'python',
  'python3': 'python',
  'java': 'java',
  'javascript': 'javascript',
  'js': 'javascript',
  'typescript': 'typescript',
  'ts': 'typescript',
  'go': 'go',
  'rust': 'rust',
  'php': 'php',
  'ruby': 'ruby',
  'swift': 'swift',
  'kotlin': 'kotlin',
};

// JSON Schema for AI code evaluation
const codeEvaluationSchema = {
  type: "object" as const,
  properties: {
    confidence_score: {
      type: "number" as const,
      description: "Overall confidence score out of 10 (0-10)"
    },
    code_quality_score: {
      type: "number" as const,
      description: "Code quality and best practices score out of 10"
    },
    explanation: {
      type: "string" as const,
      description: "Detailed explanation of the evaluation covering strengths and weaknesses"
    },
    strengths: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "List of positive aspects found in the code"
    },
    weaknesses: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "List of issues or areas for improvement"
    },
    suggestions: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Specific suggestions to improve the code"
    }
  },
  required: ["confidence_score", "code_quality_score", "explanation", "strengths", "weaknesses", "suggestions"] as const
};

// JSON Schema for text content evaluation
const textEvaluationSchema = {
  type: "object" as const,
  properties: {
    confidence_score: {
      type: "number" as const,
      description: "Overall confidence score out of 10 (0-10)"
    },
    accuracy_score: {
      type: "number" as const,
      description: "Factual accuracy and correctness score out of 10"
    },
    clarity_score: {
      type: "number" as const,
      description: "Clarity and comprehensibility score out of 10"
    },
    explanation: {
      type: "string" as const,
      description: "Detailed explanation of the evaluation"
    },
    strengths: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Positive aspects of the content"
    },
    weaknesses: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Issues or areas for improvement"
    },
    suggestions: {
      type: "array" as const,
      items: {
        type: "string" as const
      },
      description: "Specific suggestions to improve the content"
    }
  },
  required: ["confidence_score", "accuracy_score", "clarity_score", "explanation", "strengths", "weaknesses", "suggestions"] as const
};

/**
 * Check code compilation and execution using Piston API
 */
async function checkCodeExecution(code: string, language: string) {
  const pistonLanguage = LANGUAGE_MAP[language.toLowerCase()];
  
  if (!pistonLanguage) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const response = await axios.post(
      'https://emkc.org/api/v2/piston/execute',
      {
        language: pistonLanguage,
        version: '*',
        files: [{ content: code }]
      },
      { timeout: 10000 }
    );

    const result = response.data;
    const hasCompileError = result.compile && result.compile.code !== 0;
    const hasRuntimeError = result.run.code !== 0 && !hasCompileError;

    return {
      success: result.run.code === 0 && !hasCompileError,
      hasCompilationError: hasCompileError,
      hasRuntimeError: hasRuntimeError,
      output: result.run.output,
      stderr: result.run.stderr,
      compileOutput: result.compile?.output || null,
      exitCode: result.run.code,
      language: result.language,
      version: result.version
    };
  } catch (error: any) {
    throw new Error(`Code execution failed: ${error.message}`);
  }
}

/**
 * AI evaluation of code with compilation results
 */
async function evaluateCodeWithAI(code: string, language: string, compilationResult: any) {
  const prompt = `You are an expert code reviewer and educator. Evaluate the following ${language} code thoroughly.

CODE:
\`\`\`${language}
${code}
\`\`\`

COMPILATION/EXECUTION RESULTS:
- Success: ${compilationResult.success}
- Has Compilation Error: ${compilationResult.hasCompilationError}
- Has Runtime Error: ${compilationResult.hasRuntimeError}
${compilationResult.compileOutput ? `- Compilation Output: ${compilationResult.compileOutput}` : ''}
${compilationResult.stderr ? `- Error Output: ${compilationResult.stderr}` : ''}
${compilationResult.output ? `- Program Output: ${compilationResult.output}` : ''}

EVALUATION CRITERIA:
1. **Code Correctness** (based on compilation/execution results)
2. **Code Quality** (readability, structure, best practices)
3. **Error Handling** (proper error management)
4. **Efficiency** (algorithm efficiency, resource usage)
5. **Security** (potential vulnerabilities)
6. **Maintainability** (code organization, comments)

Provide:
1. **confidence_score** (0-10): Overall quality considering compilation success and code quality
2. **code_quality_score** (0-10): Code quality independent of compilation
3. **explanation**: Comprehensive evaluation (2-3 paragraphs)
4. **strengths**: Array of positive aspects
5. **weaknesses**: Array of issues found
6. **suggestions**: Array of specific improvements

Be constructive and educational in your feedback.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: codeEvaluationSchema,
    },
  });

  return JSON.parse(response.text ?? '{}');
}

/**
 * AI evaluation of text content
 */
async function evaluateTextWithAI(content: string, context?: string) {
  const prompt = `You are an expert educational content reviewer. Evaluate the following educational content thoroughly.

CONTENT:
${content}

${context ? `CONTEXT:\n${context}` : ''}

EVALUATION CRITERIA:
1. **Factual Accuracy** (correctness of information)
2. **Clarity** (how well-explained and understandable)
3. **Completeness** (coverage of the topic)
4. **Educational Value** (usefulness for learning)
5. **Structure** (organization and flow)
6. **Examples** (quality and relevance of examples)

Provide:
1. **confidence_score** (0-10): Overall quality of the content
2. **accuracy_score** (0-10): Factual correctness
3. **clarity_score** (0-10): How clear and understandable
4. **explanation**: Detailed evaluation (2-3 paragraphs)
5. **strengths**: Array of positive aspects
6. **weaknesses**: Array of issues or gaps
7. **suggestions**: Array of specific improvements

Be constructive and educational in your feedback.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: textEvaluationSchema,
    },
  });

  return JSON.parse(response.text ?? '{}');
}

/**
 * API: Validate Code Content
 * @route POST /api/validation/validate-code
 * 
 * Validates AI-generated code by:
 * 1. Compiling/executing with Piston API
 * 2. AI-driven quality evaluation
 * 3. Confidence scoring
 */
export const validateCode = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json(new ApiResponse(400, {}, 'Code and language are required'));
    }

    console.log(`🔍 Validating ${language} code...`);

    // Step 1: Check compilation/execution
    console.log('⚙️  Step 1: Compiling and executing code with Piston API...');
    const compilationResult = await checkCodeExecution(code, language);

    console.log(`✅ Compilation result: ${compilationResult.success ? 'Success' : 'Failed'}`);

    // Step 2: AI evaluation
    console.log('🤖 Step 2: AI evaluating code quality...');
    const aiEvaluation = await evaluateCodeWithAI(code, language, compilationResult);

    console.log(`📊 Confidence Score: ${aiEvaluation.confidence_score}/10`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          content_type: 'code',
          language,
          compilation: compilationResult,
          evaluation: aiEvaluation,
          overall_confidence: aiEvaluation.confidence_score,
          metadata: {
            compiled_successfully: compilationResult.success,
            has_errors: compilationResult.hasCompilationError || compilationResult.hasRuntimeError,
            evaluated_at: new Date().toISOString(),
          },
        },
        'Code validated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error validating code:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Code validation failed'));
  }
});

/**
 * API: Validate Text Content
 * @route POST /api/validation/validate-text
 * 
 * Validates AI-generated text content by:
 * 1. AI-driven quality evaluation
 * 2. Confidence scoring
 */
export const validateText = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, {}, 'Not authenticated'));
    }

    const { content, context } = req.body;

    if (!content) {
      return res.status(400).json(new ApiResponse(400, {}, 'Content is required'));
    }

    console.log('🔍 Validating text content...');

    // AI evaluation
    console.log('🤖 AI evaluating content quality...');
    const aiEvaluation = await evaluateTextWithAI(content, context);

    console.log(`📊 Confidence Score: ${aiEvaluation.confidence_score}/10`);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          content_type: 'text',
          evaluation: aiEvaluation,
          overall_confidence: aiEvaluation.confidence_score,
          metadata: {
            content_length: content.length,
            evaluated_at: new Date().toISOString(),
          },
        },
        'Text content validated successfully'
      )
    );
  } catch (error: any) {
    console.error('❌ Error validating text:', error);
    return res.status(500).json(new ApiResponse(500, {}, error.message || 'Text validation failed'));
  }
});
