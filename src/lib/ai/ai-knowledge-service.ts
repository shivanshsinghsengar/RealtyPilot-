import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * AI Knowledge Service
 * Handles:
 * 1. Finding answers from knowledge base
 * 2. Learning from unknown questions
 * 3. Generating intelligent responses
 */

interface QuestionContext {
  lead_id?: string;
  lead_budget?: number;
  lead_location?: string;
  lead_timeline?: string;
  conversation_history?: string[];
}

export class AIKnowledgeService {
  private genAI: GoogleGenerativeAI;
  private supabase: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async initialize() {
    this.supabase = await createClient();
  }

  /**
   * Find answer from knowledge base
   */
  async findAnswer(question: string, context: QuestionContext = {}): Promise<{
    found: boolean;
    answer?: string;
    confidence: number;
    source?: string;
  }> {
    await this.initialize();

    // Step 1: Search in property knowledge base
    const { data: knowledgeResults } = await this.supabase
      .from("ai_property_knowledge")
      .select("*")
      .order("confidence_score", { ascending: false })
      .limit(5);

    if (knowledgeResults && knowledgeResults.length > 0) {
      // Use Gemini to match question with knowledge
      const knowledgeText = knowledgeResults
        .map(k => `${k.knowledge_type}: ${k.content}`)
        .join("\n\n");

      const model = this.genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

      const prompt = `Question: "${question}"

Context:
- Budget: ${context.lead_budget || 'Not specified'}
- Location: ${context.lead_location || 'Not specified'}
- Timeline: ${context.lead_timeline || 'Not specified'}

Knowledge Base:
${knowledgeText}

Based on the knowledge above, can you answer the question? If yes, provide:
1. YES/NO
2. Confidence score (0-100)
3. The answer
4. Which knowledge source was used

Format: YES|NO|confidence|answer|source`;

      try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const parts = response.split("|");

        if (parts[0]?.trim().toUpperCase() === "YES" && parseInt(parts[2]) > 70) {
          return {
            found: true,
            answer: parts[3]?.trim(),
            confidence: parseInt(parts[2]),
            source: parts[4]?.trim()
          };
        }
      } catch (error) {
        console.error("Error matching question with knowledge:", error);
      }
    }

    // Step 2: Check response rules
    const { data: rules } = await this.supabase
      .from("ai_response_rules")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (this.matchesRule(question, context, rule)) {
          if (rule.custom_response) {
            return {
              found: true,
              answer: rule.custom_response,
              confidence: 85,
              source: `rule:${rule.rule_name}`
            };
          } else if (rule.response_template_id) {
            const { data: template } = await this.supabase
              .from("ai_message_templates")
              .select("*")
              .eq("id", rule.response_template_id)
              .single();

            if (template) {
              return {
                found: true,
                answer: template.template_text,
                confidence: 80,
                source: `template:${template.name}`
              };
            }
          }
        }
      }
    }

    // No answer found
    return {
      found: false,
      confidence: 0
    };
  }

  /**
   * Handle unknown question - either research or log for learning
   */
  async handleUnknownQuestion(question: string, context: QuestionContext) {
    await this.initialize();

    // Get behavior settings
    const { data: settingsData } = await this.supabase
      .from("ai_behavior_settings")
      .select("*")
      .eq("setting_name", "learning_mode")
      .single();

    const settings = settingsData?.setting_value || { enabled: true, auto_research: true };

    // Log the unknown question
    const { data: log } = await this.supabase
      .from("ai_learning_log")
      .insert({
        lead_id: context.lead_id,
        original_question: question,
        context: context,
        status: 'pending',
        confidence_score: 0
      })
      .select()
      .single();

    // Auto-research if enabled
    if (settings.auto_research && settings.enabled) {
      try {
        const researchedAnswer = await this.researchAnswer(question, context);
        if (researchedAnswer) {
          // Update log with researched answer
          await this.supabase
            .from("ai_learning_log")
            .update({
              ai_response: researchedAnswer,
              status: 'researched'
            })
            .eq("id", log.id);

          // Learn from this (add to knowledge base)
          await this.learnFromResearch(question, researchedAnswer, context);
          
          return researchedAnswer;
        }
      } catch (error) {
        console.error("Error in auto-research:", error);
      }
    }

    return null;
  }

  /**
   * Research answer using Gemini
   */
  private async researchAnswer(question: string, context: QuestionContext): Promise<string | null> {
    const model = this.genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const prompt = `You are a real estate assistant for a company selling residential plots in Bhopal, India.

Context:
- Location: Bhopal, Madhya Pradesh
- Product: Residential plots and duplexes
- Price range: ₹40 Lakh to ₹2 Crore
- Areas: Hoshangabad Road, Airport Road, Narmada, Bhojpal

Question: "${question}"
Additional context: ${JSON.stringify(context, null, 2)}

Please provide a helpful, accurate answer. If you don't know something, be honest and say you'll check with the team.

Answer in a mix of Hindi and English (Hinglish) for customer understanding.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error researching answer:", error);
      return null;
    }
  }

  /**
   * Learn from researched answer and add to knowledge base
   */
  private async learnFromResearch(question: string, answer: string, context: QuestionContext) {
    // Use Gemini to extract key information
    const model = this.genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const prompt = `Extract structured knowledge from this Q&A for a real estate knowledge base.

Question: "${question}"
Answer: "${answer}"

Extract:
1. Knowledge type (basic_info, pricing, amenities, location, faq)
2. Key keywords for search (comma-separated)
3. Confidence score (0-100)
4. Property name (if mentioned)

Format: knowledge_type|keywords|confidence|property_name`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const parts = response.split("|");

      if (parts.length >= 3) {
        await this.supabase
          .from("ai_property_knowledge")
          .insert({
            knowledge_type: parts[0]?.trim() || 'faq',
            keywords: parts[1]?.split(',').map((k: string) => k.trim()),
            confidence_score: parseInt(parts[2]) || 70,
            property_name: parts[3]?.trim() || 'General',
            content: answer,
            source: 'learned'
          });
      }
    } catch (error) {
      console.error("Error learning from research:", error);
    }
  }

  /**
   * Check if question matches a rule
   */
  private matchesRule(question: string, context: QuestionContext, rule: any): boolean {
    const trigger = rule.trigger_value;

    switch (rule.trigger_type) {
      case 'keyword':
        const keywords = trigger.keywords || [];
        const questionLower = question.toLowerCase();
        return keywords.some((kw: string) => questionLower.includes(kw.toLowerCase()));

      case 'budget_range':
        if (!context.lead_budget) return false;
        const minBudget = trigger.min_budget || 0;
        const maxBudget = trigger.max_budget || Infinity;
        return context.lead_budget >= minBudget && context.lead_budget <= maxBudget;

      case 'location':
        if (!context.lead_location) return false;
        const locations = trigger.locations || [];
        return locations.some((loc: string) => 
          context.lead_location?.toLowerCase().includes(loc.toLowerCase())
        );

      default:
        return false;
    }
  }

  /**
   * Generate smart WhatsApp message based on lead profile
   */
  async generateSmartMessage(leadId: string): Promise<string> {
    await this.initialize();

    // Get lead details
    const { data: lead } = await this.supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (!lead) {
      return "Hello! I'm from RealtyPilot. Looking for plots in Bhopal?";
    }

    // Get suitable templates based on lead profile
    const { data: templates } = await this.supabase
      .from("ai_message_templates")
      .select("*")
      .eq("category", "property_intro")
      .eq("is_active", true)
      .order("priority", { ascending: true });

    // Find the best matching template
    let bestMatch = templates?.[0]?.template_text || "";
    let bestScore = 0;

    for (const template of templates || []) {
      let score = 0;
      const conditions = template.conditions || {};

      // Budget match
      if (conditions.min_budget && lead.budget) {
        if (lead.budget >= conditions.min_budget) score += 30;
      }

      // Location match
      if (conditions.location && lead.preferred_locality) {
        if (lead.preferred_locality.toLowerCase().includes(conditions.location.toLowerCase())) {
          score += 40;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template.template_text;
      }
    }

    // Personalize the message
    let message = bestMatch;
    if (lead.name) {
      message = message.replace(/\[Name\]/g, lead.name.split(" ")[0]);
    }
    if (lead.budget) {
      const budgetInLakhs = Math.round(lead.budget / 100000);
      message = message.replace(/\[Budget\]/g, `₹${budgetInLakhs} Lakh`);
    }
    if (lead.preferred_locality) {
      message = message.replace(/\[Location\]/g, lead.preferred_locality);
    }

    return message || "Hi! We have great residential plots in Bhopal. Interested to know more?";
  }
}

export const aiKnowledgeService = new AIKnowledgeService();
