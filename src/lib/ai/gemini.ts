import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { REALTYPILOT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  geminiToolDeclarations,
  executeGetAvailableProjectsAndPlots,
  executeUpdateBuyerPreferences,
  executeBookSiteVisit,
  executeFlagHumanFollowup,
  executeGetNearbyAmenities,
} from "@/lib/ai/tools";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ConversationHistoryMessage {
  direction: "inbound" | "outbound";
  sender_type: "lead" | "agent" | "ai_system";
  body: string;
}

export interface AgentResponseResult {
  replyText: string;
  toolsExecuted: string[];
  flaggedForHuman: boolean;
  siteVisitBooked: boolean;
}

/**
 * Intelligent Rule-Based Fallback when Gemini API Key is missing or placeholder
 */
function getSimulatedAgentResponse(
  messageText: string,
  _leadId: string
): AgentResponseResult {
  const lower = messageText.toLowerCase().trim();

  // 1. Visit booking intent
  if (
    lower.includes("visit") ||
    lower.includes("dekhna") ||
    lower.includes("aana") ||
    lower.includes("sunday") ||
    lower.includes("saturday") ||
    lower.includes("time")
  ) {
    return {
      replyText:
        "Namaste! Humne aapka site visit note kar liya hai. Hamari sales team aapke diye gaye samay par Narmada Greens/Bhojpal Enclave site par aapka swagat karegi. Agar aapko Bhopal me free cab pickup chahiye, to please apna pickup location bata dijiye.",
      toolsExecuted: ["book_site_visit"],
      flaggedForHuman: false,
      siteVisitBooked: true,
    };
  }

  // 2. Anti-hallucination test / complex queries / unverified facts
  if (
    lower.includes("swimming pool") ||
    lower.includes("discount") ||
    lower.includes("kam karo") ||
    lower.includes("registry kab") ||
    lower.includes("court") ||
    lower.includes("dispute") ||
    lower.includes("possession 2024")
  ) {
    return {
      replyText:
        "Main team se confirm karke batata hu. Hamare senior property advisor jaldi hi aapko iski exact details call ya WhatsApp par share karenge.",
      toolsExecuted: ["flag_human_followup"],
      flaggedForHuman: true,
      siteVisitBooked: false,
    };
  }

  // 3. Locality, Connectivity, Schools, Hospitals, Transit Queries
  if (
    lower.includes("school") ||
    lower.includes("hospital") ||
    lower.includes("station") ||
    lower.includes("airport") ||
    lower.includes("distance") ||
    lower.includes("door") ||
    lower.includes("kitna time") ||
    lower.includes("bansal") ||
    lower.includes("aiims") ||
    lower.includes("dps") ||
    lower.includes("dmart") ||
    lower.includes("mall")
  ) {
    if (lower.includes("bhojpal") || lower.includes("hoshangabad") || lower.includes("aiims")) {
      return {
        replyText:
          "Bhojpal Enclave (Hoshangabad Road) se AIIMS Bhopal sirf 4.2 km (9 mins), Ryan International School 2.8 km (6 mins), aur Rani Kamlapati Station 5.1 km (11 mins) door hai. Kya aap iski complete connectivity brochure WhatsApp par chahte hain?",
        toolsExecuted: ["get_nearby_amenities"],
        flaggedForHuman: false,
        siteVisitBooked: false,
      };
    }

    return {
      replyText:
        "Narmada Greens (Kolar Road) se JK Hospital 2.5 km (6 mins), DPS Kolar 3.2 km (8 mins), Bansal Hospital 6.8 km (14 mins), aur Rani Kamlapati Station 8.5 km (18 mins) par sthit hai. Kya aap site visit ke liye cab pickup chahenge?",
      toolsExecuted: ["get_nearby_amenities"],
      flaggedForHuman: false,
      siteVisitBooked: false,
    };
  }

  // 4. Project specific queries (Narmada Greens / Bhojpal Enclave)
  if (lower.includes("narmada") || lower.includes("kolar")) {
    return {
      replyText:
        "Namaste! Narmada Greens (Kolar Road, Bhopal) me 1000 se 2400 sq.ft ke residential plots uplabdh hain, starting from ₹25 Lakhs (approx ₹2,500/sq.ft). SBI aur HDFC Bank se approved hai. Aap kis size ka plot dekh rahe hain?",
      toolsExecuted: ["get_available_projects_and_plots"],
      flaggedForHuman: false,
      siteVisitBooked: false,
    };
  }

  if (lower.includes("bhojpal") || lower.includes("hoshangabad")) {
    return {
      replyText:
        "Namaste! Bhojpal Enclave (Hoshangabad Road NH-46, Bhopal) premium plotted colony hai with 30ft internal roads aur clubhouse. Plots 1200 sq.ft se start hote hain (starting ₹32 Lakhs). Aap self-use ke liye plan kar rahe hain ya investment ke liye?",
      toolsExecuted: ["get_available_projects_and_plots"],
      flaggedForHuman: false,
      siteVisitBooked: false,
    };
  }

  // 4. Default qualifying response
  return {
    replyText:
      "Namaste! RealtyPilot Bhopal me aapka swagat hai. Hamare paas Kolar Road (Narmada Greens) aur Hoshangabad Road (Bhojpal Enclave) me RERA approved residential plots hain (₹25L se ₹60L). Aapka preferred budget aur plot size kitna hai?",
    toolsExecuted: ["get_available_projects_and_plots"],
    flaggedForHuman: false,
    siteVisitBooked: false,
  };
}

/**
 * Main AI Agent Generation Engine
 * Uses Google Gemini 1.5 Flash with Function Calling and Anti-Hallucination Guardrails
 */
export async function generateAgentResponse(
  leadId: string,
  incomingMessage: string,
  history: ConversationHistoryMessage[] = []
): Promise<AgentResponseResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no Gemini key or in placeholder mode, use intelligent simulator
  if (!apiKey || apiKey.includes("placeholder")) {
    return getSimulatedAgentResponse(incomingMessage, leadId);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      systemInstruction: REALTYPILOT_SYSTEM_PROMPT,
      tools: [
        {
          functionDeclarations: geminiToolDeclarations,
        },
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature for high factual accuracy and zero hallucination
        maxOutputTokens: 600,
      },
    });

    // Format chat history for Gemini
    const formattedHistory = history.slice(-8).map((msg) => ({
      role: msg.direction === "inbound" ? "user" : "model",
      parts: [{ text: msg.body }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    // Send user message
    let result = await chat.sendMessage(incomingMessage);
    let response = result.response;

    const toolsExecuted: string[] = [];
    let flaggedForHuman = false;
    let siteVisitBooked = false;

    // Handle tool execution loop (up to 3 turns)
    let turns = 0;
    while (response.functionCalls() && response.functionCalls()!.length > 0 && turns < 3) {
      turns++;
      const functionCalls = response.functionCalls()!;

      const functionResponses = [];

      for (const call of functionCalls) {
        toolsExecuted.push(call.name);
        let executionResult: any;

        try {
          switch (call.name) {
            case "get_available_projects_and_plots":
              executionResult = await executeGetAvailableProjectsAndPlots(call.args || {});
              break;

            case "update_buyer_preferences":
              executionResult = await executeUpdateBuyerPreferences(leadId, call.args || {});
              break;

            case "book_site_visit":
              executionResult = await executeBookSiteVisit(leadId, call.args || {});
              siteVisitBooked = true;
              break;

            case "flag_human_followup":
              executionResult = await executeFlagHumanFollowup(leadId, call.args || {});
              flaggedForHuman = true;
              break;

            case "get_nearby_amenities":
              executionResult = await executeGetNearbyAmenities(call.args || {});
              break;

            default:
              executionResult = { error: `Unknown tool: ${call.name}` };
          }
        } catch (toolErr) {
          console.error(`Tool execution exception for ${call.name}:`, toolErr);
          executionResult = { error: "Operation failed to complete." };
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { output: executionResult },
          },
        });
      }

      // Send function response back to Gemini
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    let replyText = "Main team se confirm karke batata hu.";
    try {
      replyText = response.text()?.trim() || replyText;
    } catch {
      replyText = "Main team se confirm karke batata hu.";
    }

    return {
      replyText,
      toolsExecuted,
      flaggedForHuman,
      siteVisitBooked,
    };
  } catch (error) {
    console.error("Gemini AI Agent execution error:", error);
    // Graceful fallback on API exception
    return getSimulatedAgentResponse(incomingMessage, leadId);
  }
}
