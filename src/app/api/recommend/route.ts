import { NextRequest } from "next/server";
import artworks from "@/data/artworks.json";

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "No API key configured" }, { status: 500 });
    }

    // Build artwork context for Claude
    const artworkContext = artworks
      .map(
        (a) =>
          `ID: ${a.id} | "${a.title}" by ${a.artist} (${a.year}) | Floor ${a.floor}, Gallery ${a.gallery} | Tags: ${a.tags.join(", ")} | Popularity: ${a.popularity}/100 | ${a.description}`
      )
      .join("\n");

    const prompt = `You are a MoMA curator recommending artworks to a visitor. Based on their preferences, pick the 3 best artworks from the collection below.

VISITOR PROFILE:
- First time at MoMA: ${answers.firstTime ?? "unknown"}
- Here for Starry Night: ${answers.starryNight ?? "unknown"}
- Mood: ${answers.mood ?? "unknown"}
- Drawn to: ${answers.preference ?? "unknown"}
- Time available: ${answers.timeAvailable ?? "unknown"}

COLLECTION (pick from these only):
${artworkContext}

RULES:
- Pick 3 artworks that best match this visitor's mood and preferences
- Favor lesser-known works (lower popularity) over the most famous ones, unless they specifically came for Starry Night
- If they came for Starry Night, include it as #1 but make #2 and #3 surprising discoveries
- Spread recommendations across different floors when possible for a good museum route
- Each recommendation needs a short, compelling "hook" (one line, why they'll love it) and a curated "blurb" (2-3 sentences, conversational tone matching their mood)

Respond ONLY with valid JSON, no markdown:
[
  { "artworkId": "id-here", "hook": "one-line hook", "blurb": "2-3 sentence description" },
  { "artworkId": "id-here", "hook": "one-line hook", "blurb": "2-3 sentence description" },
  { "artworkId": "id-here", "hook": "one-line hook", "blurb": "2-3 sentence description" }
]`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return Response.json({ error: "AI recommendation failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse JSON from response
    const recommendations = JSON.parse(text);

    // Validate artwork IDs exist
    const validIds = new Set(artworks.map((a) => a.id));
    const validated = recommendations.filter(
      (r: { artworkId: string }) => validIds.has(r.artworkId)
    );

    return Response.json({ recommendations: validated });
  } catch (error) {
    console.error("Recommend API error:", error);
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
