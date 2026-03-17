import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { ventureName, tagline, description, problemStatement, solution, industry, stage, founderName } = await req.json();

    const candidateContext = [
      `Venture: ${ventureName || "Unknown"}`,
      `Tagline: ${tagline || "N/A"}`,
      `Description: ${description || "N/A"}`,
      `Problem: ${problemStatement || "N/A"}`,
      `Solution: ${solution || "N/A"}`,
      `Industry: ${Array.isArray(industry) ? industry.join(", ") : "N/A"}`,
      `Stage: ${stage || "N/A"}`,
      `Founder: ${founderName || "N/A"}`,
    ].join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an HR talent analyst reviewing startup founders and their ventures for an accelerator program. You must return a JSON response with exactly these fields:
- "summary": A concise 2-3 sentence TL;DR of the candidate's venture and strengths (max 200 chars)
- "logic_score": An integer from 1-10 rating the clarity and soundness of their technical/business logic
- "strengths": A brief list of 2-3 key strengths
- "concerns": A brief list of 1-2 potential concerns or areas to probe in interview

Return ONLY valid JSON, no markdown.`,
          },
          {
            role: "user",
            content: `Review this candidate:\n\n${candidateContext}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "review_candidate",
              description: "Return structured review of a candidate",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-3 sentence TL;DR (max 200 chars)" },
                  logic_score: { type: "integer", description: "1-10 technical logic clarity score" },
                  strengths: { type: "array", items: { type: "string" }, description: "2-3 key strengths" },
                  concerns: { type: "array", items: { type: "string" }, description: "1-2 concerns" },
                },
                required: ["summary", "logic_score", "strengths", "concerns"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "review_candidate" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ summary: content, logic_score: 5, strengths: [], concerns: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    throw new Error("No response from AI");
  } catch (e) {
    console.error("ai-review error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
