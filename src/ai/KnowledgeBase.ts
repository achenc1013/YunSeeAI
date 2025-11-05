/**
 * Knowledge Base - Manages local knowledge storage and retrieval
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface KnowledgeEntry {
  id: string;
  content: string;
  source: string; // 'manual' | 'file' | 'url'
  sourceDetail?: string; // filename or url
  timestamp: number;
  tags?: string[];
}

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number; // relevance score (0-1)
  matchedKeywords: string[];
}

export class KnowledgeBase {
  private knowledgeFilePath: string;
  private knowledge: KnowledgeEntry[] = [];

  constructor(storagePath: string = './data/knowledge.json') {
    this.knowledgeFilePath = path.resolve(process.cwd(), storagePath);
    this.ensureStorageExists();
    this.loadKnowledge();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageExists(): void {
    const dir = path.dirname(this.knowledgeFilePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(this.knowledgeFilePath)) {
      writeFileSync(this.knowledgeFilePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  /**
   * Load knowledge from disk
   */
  private loadKnowledge(): void {
    try {
      const data = readFileSync(this.knowledgeFilePath, 'utf-8');
      this.knowledge = JSON.parse(data);
    } catch (error) {
      console.error(chalk.yellow('⚠ Failed to load knowledge base, starting fresh'));
      this.knowledge = [];
    }
  }

  /**
   * Save knowledge to disk
   */
  private saveKnowledge(): void {
    try {
      writeFileSync(
        this.knowledgeFilePath,
        JSON.stringify(this.knowledge, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error(chalk.red('✗ Failed to save knowledge base:', error));
    }
  }

  /**
   * Add new knowledge entry
   */
  addKnowledge(
    content: string,
    source: string = 'manual',
    sourceDetail?: string,
    tags?: string[]
  ): KnowledgeEntry {
    const entry: KnowledgeEntry = {
      id: this.generateId(),
      content: content.trim(),
      source,
      sourceDetail,
      timestamp: Date.now(),
      tags: tags || [],
    };

    this.knowledge.push(entry);
    this.saveKnowledge();
    
    return entry;
  }

  /**
   * Add knowledge from file
   */
  addFromFile(filePath: string): KnowledgeEntry | null {
    try {
      const resolvedPath = path.resolve(process.cwd(), filePath);
      
      if (!existsSync(resolvedPath)) {
        throw new Error('File not found');
      }

      const content = readFileSync(resolvedPath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // Extract tags from file extension and name
      const ext = path.extname(filePath).substring(1);
      const tags = [ext, fileName.replace(path.extname(fileName), '')];

      return this.addKnowledge(content, 'file', filePath, tags);
    } catch (error) {
      console.error(chalk.red(`✗ Failed to read file: ${error}`));
      return null;
    }
  }

  /**
   * Delete knowledge entry by ID
   */
  deleteKnowledge(id: string): boolean {
    const originalLength = this.knowledge.length;
    this.knowledge = this.knowledge.filter(k => k.id !== id);
    
    if (this.knowledge.length < originalLength) {
      this.saveKnowledge();
      return true;
    }
    
    return false;
  }

  /**
   * Get all knowledge entries
   */
  getAllKnowledge(): KnowledgeEntry[] {
    return [...this.knowledge];
  }

  /**
   * Get knowledge entry by ID
   */
  getKnowledgeById(id: string): KnowledgeEntry | undefined {
    return this.knowledge.find(k => k.id === id);
  }

  /**
   * Search knowledge base with keyword matching
   * This is a simple implementation - can be enhanced with vector embeddings
   */
  search(query: string, limit: number = 5): SearchResult[] {
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(/\s+/).filter(w => w.length > 1);

    const results: SearchResult[] = [];

    for (const entry of this.knowledge) {
      const contentLower = entry.content.toLowerCase();
      let score = 0;
      const matchedKeywords: string[] = [];

      // Calculate relevance score
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          // Exact keyword match
          const occurrences = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
          score += occurrences * 0.3;
          matchedKeywords.push(keyword);
        }
      }

      // Bonus for matching tags
      if (entry.tags) {
        for (const tag of entry.tags) {
          if (queryLower.includes(tag.toLowerCase())) {
            score += 0.2;
          }
        }
      }

      // Bonus for source detail match
      if (entry.sourceDetail && queryLower.includes(entry.sourceDetail.toLowerCase())) {
        score += 0.1;
      }

      if (score > 0) {
        // Normalize score to 0-1 range
        const normalizedScore = Math.min(score / keywords.length, 1);
        results.push({
          entry,
          score: normalizedScore,
          matchedKeywords,
        });
      }
    }

    // Sort by score (descending) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Clear all knowledge
   */
  clearAll(): void {
    this.knowledge = [];
    this.saveKnowledge();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    bySource: { [key: string]: number };
  } {
    const stats = {
      totalEntries: this.knowledge.length,
      totalSize: this.knowledge.reduce((sum, k) => sum + k.content.length, 0),
      bySource: {} as { [key: string]: number },
    };

    for (const entry of this.knowledge) {
      stats.bySource[entry.source] = (stats.bySource[entry.source] || 0) + 1;
    }

    return stats;
  }

  /**
   * Generate unique ID for knowledge entry
   */
  private generateId(): string {
    return `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Build context from search results for AI
   */
  buildContextFromResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return '';
    }

    let context = '【知识库相关内容】\n\n';
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      context += `知识${i + 1} (相关度: ${(result.score * 100).toFixed(0)}%):\n`;
      context += `${result.entry.content}\n\n`;
    }

    context += '【以上内容来自本地知识库】\n';
    
    return context;
  }
}


