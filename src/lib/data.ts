// This system now uses Google Apps Script (Spreadsheet) as a serverless database
// to support Vercel's read-only and ephemeral filesystem.

export interface Idea {
  id: number;
  title: string;
  prompt: string;
  isUsed: boolean;
  url: string;      // The final published URL
  draftUrl: string; // The URL of the drafted Google Doc
  createdAt: string;
  updatedAt: string; // Tracks the last modification time
}

// Helper to get the GAS URL safely
function getGasUrl() {
  const url = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL;
  if (!url) {
    console.warn("NEXT_PUBLIC_GAS_WEB_APP_URL is not set.");
  }
  return url || "";
}

export async function getIdeas(): Promise<Idea[]> {
  const gasUrl = getGasUrl();
  if (!gasUrl) return [];

  try {
    const res = await fetch(gasUrl, { cache: 'no-store' }); // Always fetch fresh data
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data as Idea[];
    }
    console.error('GAS GET Error:', json.error);
    return [];
  } catch (err) {
    console.error('Error fetching ideas from GAS:', err);
    return [];
  }
}

export async function addIdea(title: string, prompt: string = ""): Promise<Idea> {
  const gasUrl = getGasUrl();
  const now = new Date().toISOString();
  const fallbackIdea: Idea = { id: Date.now(), title, prompt, isUsed: false, url: "", draftUrl: "", createdAt: now, updatedAt: now };
  
  if (!gasUrl) return fallbackIdea;

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_idea", title, prompt }),
      cache: 'no-store'
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as Idea;
    }
    console.error('GAS POST (add) Error:', json.error);
  } catch (err) {
    console.error('Error adding idea to GAS:', err);
  }
  return fallbackIdea;
}

export async function toggleIdeaUsed(id: number): Promise<void> {
  const gasUrl = getGasUrl();
  if (!gasUrl) return;

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_used", id }),
      cache: 'no-store'
    });
    const json = await res.json();
    if (!json.success) {
      console.error('GAS POST (toggle) Error:', json.error);
    }
  } catch (err) {
    console.error('Error toggling idea in GAS:', err);
  }
}
