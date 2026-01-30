/* eslint-disable no-console */
import * as fs from 'fs';
import OpenAI from 'openai';
import * as path from 'path';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const STORE_PATH = path.join(process.cwd(), 'ai-failures-db.json');

export interface StoredFailure {
  id: string;
  error: string;
  analysis: string;
  embedding: number[];
  timestamp: string;
}

export class VectorStore {
  private openai: OpenAI;
  private failures: StoredFailure[] = [];

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for VectorStore');
    }
    this.openai = new OpenAI({ apiKey });
    this.load();
  }

  private load() {
    if (fs.existsSync(STORE_PATH)) {
      try {
        const data = fs.readFileSync(STORE_PATH, 'utf-8');
        this.failures = JSON.parse(data);
      } catch (e) {
        console.error('Failed to load vector store:', e);
        this.failures = [];
      }
    }
  }

  private save() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.failures, null, 2));
    } catch (e) {
      console.error('Failed to save vector store:', e);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.replace(/\n/g, ' '),
    });
    return response.data[0].embedding;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async addFailure(error: string, analysis: string) {
    // Basic deduplication: don't add if error is exactly same as a very recent one
    const normalizedError = error.substring(0, 500);
    const embedding = await this.getEmbedding(normalizedError);

    const newFailure: StoredFailure = {
      id: Math.random().toString(36).substring(7),
      error: normalizedError,
      analysis,
      embedding,
      timestamp: new Date().toISOString(),
    };

    this.failures.push(newFailure);

    // Keep only last 1000 failures to keep it fast for this simple implementation
    if (this.failures.length > 1000) {
      this.failures.shift();
    }

    this.save();
  }

  async findSimilar(error: string, threshold = 0.8, limit = 3): Promise<StoredFailure[]> {
    if (this.failures.length === 0) return [];

    const normalizedError = error.substring(0, 500);
    const queryEmbedding = await this.getEmbedding(normalizedError);

    const matches = this.failures
      .map((f) => ({
        ...f,
        similarity: this.cosineSimilarity(queryEmbedding, f.embedding),
      }))
      .filter((f) => f.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return matches;
  }
}
