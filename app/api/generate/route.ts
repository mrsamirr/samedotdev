import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canUserPerformAction, consumeCredits } from '@/lib/subscription'

export const runtime = "nodejs";

interface GenerationRequest {
  context: string;
  useCase: "wireframes" | "hifi";
  screenType: "desktop" | "mobile" | "tablet";
  deepDesign: boolean;
  autoflow: boolean;
  baseHtml?: string;
  prevPrompt?: string;
}

function cleanGeneratedHtml(html: string): string {
  let cleaned = html;
  cleaned = cleaned
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  cleaned = cleaned.replace(/^Here's[\s\S]*?:/i, "");
  cleaned = cleaned.replace(/^This is[\s\S]*?:/i, "");
  cleaned = cleaned.replace(/^I've created[\s\S]*?:/i, "");
  cleaned = cleaned.replace(/^Below is[\s\S]*?:/i, "");
  cleaned = cleaned.replace(/^I'll create[\s\S]*?:/i, "");
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
  const htmlStart = cleaned.search(/<!DOCTYPE|<html/i);
  if (htmlStart > 0) cleaned = cleaned.substring(htmlStart);
  return cleaned.trim();
}

function wrapWithTailwind(html: string) {
  if (/<\s*!doctype\s+html/i.test(html) || /<\s*html[\s>]/i.test(html)) {
    const headTagRegex = /<\s*head(\s*[^>]*)>/i;
    if (headTagRegex.test(html)) {
      return html.replace(
        headTagRegex,
        `<head$1>\n<script src="https://cdn.tailwindcss.com"></script>`
      );
    } else {
      return html.replace(
        /<\s*html(\s*[^>]*)>/i,
        `<html$1>\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>`
      );
    }
  }
  return `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-gray-50\">\n  ${html}\n</body>\n</html>`;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Generate API called");

    // Auth + credits check
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = (await request.json()) as GenerationRequest;
    const {
      context,
      useCase,
      screenType,
      deepDesign,
      autoflow,
      baseHtml,
      prevPrompt,
    } = body;

    console.log("📋 Request data:", {
      contextLength: context?.length,
      useCase,
      screenType,
      deepDesign,
      autoflow,
      hasBaseHtml: !!baseHtml,
      hasPrevPrompt: !!prevPrompt,
    });

    // Enhanced validation
    if (!context || context.trim().length < 5) {
      console.error("❌ Invalid context:", context);
      return NextResponse.json(
        { error: "Context must be at least 5 characters long" },
        { status: 400 }
      );
    }

    if (!useCase || !["wireframes", "hifi"].includes(useCase)) {
      console.error("❌ Invalid useCase:", useCase);
      return NextResponse.json(
        { error: 'Invalid useCase. Must be "wireframes" or "hifi"' },
        { status: 400 }
      );
    }

    if (!screenType || !["desktop", "mobile", "tablet"].includes(screenType)) {
      console.error("❌ Invalid screenType:", screenType);
      return NextResponse.json(
        {
          error: 'Invalid screenType. Must be "desktop", "mobile", or "tablet"',
        },
        { status: 400 }
      );
    }

    // Credits check for generation (6 credits)
    const creditsRequired = 6
    const can = await canUserPerformAction(userId, 'generate_design', creditsRequired)
    if (!can.allowed) {
      return NextResponse.json({ error: can.reason || 'Insufficient credits', ...(can.creditsRemaining !== undefined ? { creditsRemaining: can.creditsRemaining } : {}) }, { status: 403 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("❌ Missing ANTHROPIC_API_KEY");
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY environment variable" },
        { status: 500 }
      );
    }

    console.log("🔑 API key found, creating client...");
    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert UI/UX designer and frontend engineer. Generate a single, production-ready HTML document using Tailwind CSS.

Begin with a concise checklist (3-7 bullets) of your planned steps for translating requirements into a responsive and accessible HTML document.

CRITICAL OUTPUT RULES:
- Output ONLY the complete HTML document. No code fences, commentary, or explanations.
- The document must begin with <!DOCTYPE html> or <html>.
- Style exclusively with Tailwind CSS classes. Do not use external CSS/JS frameworks or inline styles, except as necessary for images.
- In the <head>, include the Tailwind CSS CDN, <meta charset="utf-8">, and <meta name="viewport">.
- Use semantic HTML elements (header, nav, main, section, aside, footer).
- Ensure the design is responsive and accessible (provide alt text, labels, aria-*, focus states, tab order, sufficient contrast).
- Respect CSS prefers-reduced-motion where appropriate.

DESIGN DIRECTIVES:
- ${useCase === 'wireframes' ? 'Use a wireframe-style layout with placeholders.' : 'Create a high-fidelity, polished UI.'}
- Optimize the design for ${screenType} screens first; ensure graceful scaling to other breakpoints.
- ${deepDesign ? 'Include refined visual hierarchy and micro-interactions.' : 'Focus on clean layout and visual hierarchy.'}
- ${autoflow ? 'Design with multiple connected states or sections.' : 'Create a single, focused screen.'}

FINAL REQUIREMENT:
- Return only the complete HTML document ready for immediate use in modern browsers.`

const updatePrefix = baseHtml
  ? `You are updating an existing design. Apply the provided user changes while preserving the core structure and enhancing quality. Retain primary navigation and main sections.

After applying changes to the HTML, validate in 1-2 lines if requirements and accessibility are met; if not, perform minimal self-correction before returning the HTML.

Previous Prompt: ${prevPrompt ?? 'N/A'}

Current HTML:
${baseHtml}

User changes:`
  : `Create a new design with these requirements:`

const userPrompt = `${updatePrefix} ${context}

Screen Type: ${screenType}
Deep Design: ${deepDesign ? 'Yes' : 'No'}
Autoflow: ${autoflow ? 'Yes' : 'No'}

Return only the complete HTML document using Tailwind CSS. Do not include explanations or comments.`;

    console.log("🤖 Calling Anthropic API...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    console.log("✅ Anthropic API response received");
    let generatedHtml = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    console.log(" Cleaning generated HTML...");
    generatedHtml = cleanGeneratedHtml(generatedHtml);
    const hasTailwind = /tailwindcss\.com|cdn\.tailwindcss\.com/i.test(
      generatedHtml
    );
    const finalHtml = hasTailwind
      ? generatedHtml
      : wrapWithTailwind(generatedHtml);

    // Consume credits after successful generation
    await consumeCredits(userId, creditsRequired, 'generate_design')

    console.log("🎉 Generation completed, HTML length:", finalHtml.length);
    return NextResponse.json({
      success: true,
      html: finalHtml,
      css: "",
      elements: [],
    });
  } catch (error) {
    console.error("💥 Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate design" },
      { status: 500 }
    );
  }
}
