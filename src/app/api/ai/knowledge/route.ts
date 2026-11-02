import { NextRequest, NextResponse } from "next/server";
import { aiKnowledgeService } from "@/lib/ai/ai-knowledge-service";

export async function POST(request: NextRequest) {
  try {
    const { question, context } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Find answer from knowledge base
    const result = await aiKnowledgeService.findAnswer(question, context);

    if (result.found && result.answer) {
      return NextResponse.json({
        success: true,
        answer: result.answer,
        confidence: result.confidence,
        source: result.source,
        found: true
      });
    } else {
      // Handle unknown question
      const researchedAnswer = await aiKnowledgeService.handleUnknownQuestion(question, context);
      
      if (researchedAnswer) {
        return NextResponse.json({
          success: true,
          answer: researchedAnswer,
          confidence: 70,
          source: "researched",
          found: false
        });
      }

      return NextResponse.json({
        success: true,
        answer: "I need to check that with our team. Could you please wait for a moment while I get the correct information for you?",
        confidence: 0,
        source: "fallback",
        found: false
      });
    }
  } catch (error) {
    console.error("Error in AI knowledge API:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        answer: "I'm experiencing some technical difficulties. Please try again in a moment."
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "AI Knowledge API is running",
    endpoints: {
      "POST /api/ai/knowledge": "Ask a question to AI knowledge base",
      parameters: {
        question: "string (required)",
        context: "object (optional)"
      }
    }
  });
}
