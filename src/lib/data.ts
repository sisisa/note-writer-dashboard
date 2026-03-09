import fs from 'fs';
import path from 'path';

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

const dataDir = path.join(process.cwd(), 'data');
const ideasPath = path.join(dataDir, 'ideas.json');

export async function getIdeas(): Promise<Idea[]> {
  try {
    const data = await fs.promises.readFile(ideasPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading ideas:', err);
    return [];
  }
}

export async function addIdea(title: string, prompt: string = ""): Promise<Idea> {
  const ideas = await getIdeas();
  const newId = ideas.length > 0 ? Math.max(...ideas.map(i => i.id)) + 1 : 1;
  const now = new Date().toISOString();
  const newIdea: Idea = {
    id: newId,
    title,
    prompt,
    isUsed: false,
    url: "",
    draftUrl: "",
    createdAt: now,
    updatedAt: now
  };
  ideas.unshift(newIdea);
  await fs.promises.writeFile(ideasPath, JSON.stringify(ideas, null, 2), 'utf8');
  return newIdea;
}

export async function toggleIdeaUsed(id: number): Promise<void> {
  const ideas = await getIdeas();
  const index = ideas.findIndex(i => i.id === id);
  if (index !== -1) {
    ideas[index].isUsed = !ideas[index].isUsed;
    ideas[index].updatedAt = new Date().toISOString();
    await fs.promises.writeFile(ideasPath, JSON.stringify(ideas, null, 2), 'utf8');
  }
}
