/**
 * Knowledge Base - Manages local knowledge storage and retrieval
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { SemanticMatcher } from './SemanticMatcher.js';

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
  private semanticMatcher: SemanticMatcher;
  private useSemanticSearch: boolean = true;

  constructor(storagePath: string = './data/knowledge.json') {
    this.knowledgeFilePath = path.resolve(process.cwd(), storagePath);
    this.semanticMatcher = new SemanticMatcher();
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
   * Add knowledge from file (Enhanced)
   */
  addFromFile(filePath: string): KnowledgeEntry | null {
    try {
      // 支持相对路径和绝对路径
      let resolvedPath: string;
      
      // 如果是绝对路径，直接使用
      if (path.isAbsolute(filePath)) {
        resolvedPath = filePath;
      } else {
        // 相对路径，相对于当前工作目录
        resolvedPath = path.resolve(process.cwd(), filePath);
      }

      // 检查文件是否存在
      if (!existsSync(resolvedPath)) {
        console.error(chalk.red(`✗ 文件不存在: ${resolvedPath}`));
        console.error(chalk.yellow(`   提示: 请检查路径是否正确`));
        return null;
      }

      // 检查是否是文件（而非目录）
      const stats = statSync(resolvedPath);
      if (!stats.isFile()) {
        console.error(chalk.red(`✗ 指定的路径不是文件: ${resolvedPath}`));
        return null;
      }

      // 检查文件大小
      const fileSizeInBytes = stats.size;
      const fileSizeInKB = fileSizeInBytes / 1024;
      const maxSizeKB = 1024; // 1MB

      if (fileSizeInKB > maxSizeKB) {
        console.error(chalk.red(`✗ 文件过大 (${fileSizeInKB.toFixed(2)} KB)`));
        console.error(chalk.yellow(`   最大支持: ${maxSizeKB} KB`));
        return null;
      }

      // 读取文件内容
      console.log(chalk.gray(`   正在读取文件: ${resolvedPath}`));
      console.log(chalk.gray(`   文件大小: ${fileSizeInKB.toFixed(2)} KB`));

      const content = readFileSync(resolvedPath, 'utf-8');
      
      // 验证内容不为空
      if (!content || content.trim().length === 0) {
        console.error(chalk.red(`✗ 文件内容为空`));
        return null;
      }

      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).substring(1);
      
      // 根据文件类型解析内容
      const parsedContent = this.parseFileContent(content, ext);
      
      // Extract tags from file extension and name
      const tags = [
        ext, 
        fileName.replace(path.extname(fileName), ''),
        ...this.extractKeywordsFromContent(parsedContent, 5)
      ];

      console.log(chalk.gray(`   提取的标签: ${tags.slice(0, 5).join(', ')}`));

      return this.addKnowledge(parsedContent, 'file', filePath, tags);
    } catch (error: any) {
      console.error(chalk.red(`✗ 读取文件失败: ${error.message}`));
      if (error.code === 'ENOENT') {
        console.error(chalk.yellow(`   文件不存在，请检查路径`));
      } else if (error.code === 'EACCES') {
        console.error(chalk.yellow(`   没有权限读取文件`));
      } else if (error.code === 'EISDIR') {
        console.error(chalk.yellow(`   这是一个目录，不是文件`));
      }
      return null;
    }
  }

  /**
   * Parse file content based on file type
   */
  private parseFileContent(content: string, extension: string): string {
    switch (extension.toLowerCase()) {
      case 'md':
      case 'markdown':
        // 移除Markdown格式符号，但保留内容结构
        return content
          .replace(/^#{1,6}\s+/gm, '') // 移除标题符号
          .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
          .replace(/\*(.*?)\*/g, '$1') // 移除斜体
          .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 保留链接文字
          .replace(/```[\s\S]*?```/g, '') // 移除代码块
          .replace(/`(.*?)`/g, '$1'); // 移除行内代码符号

      case 'txt':
      case 'log':
        return content;

      case 'json':
        try {
          // 格式化JSON为可读文本
          const obj = JSON.parse(content);
          return JSON.stringify(obj, null, 2);
        } catch {
          return content;
        }

      default:
        return content;
    }
  }

  /**
   * Extract keywords from content for tags
   */
  private extractKeywordsFromContent(content: string, limit: number = 5): string[] {
    // 简单的关键词提取：找出出现频率高的词
    const words = content
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const freq = new Map<string, number>();
    words.forEach(w => {
      freq.set(w, (freq.get(w) || 0) + 1);
    });

    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
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
   * Search knowledge base with semantic understanding (Upgraded)
   */
  search(query: string, limit: number = 5): SearchResult[] {
    if (this.useSemanticSearch) {
      return this.semanticSearch(query, limit);
    } else {
      return this.keywordSearch(query, limit);
    }
  }

  /**
   * Semantic search - understands meaning, not just keywords
   */
  private semanticSearch(query: string, limit: number = 5): SearchResult[] {
    const results: SearchResult[] = [];

    for (const entry of this.knowledge) {
      // 使用语义匹配器计算相似度
      const semanticResult = this.semanticMatcher.calculateSimilarity(
        query,
        entry.content
      );

      // 提高阈值：只返回高相关度的结果（50%以上）
      // 避免低质量匹配，精选答案而非全盘托出
      if (semanticResult.score >= 0.5) {
        results.push({
          entry,
          score: semanticResult.score,
          matchedKeywords: semanticResult.matchedConcepts,
        });
      }
    }

    // Sort by score (descending) and limit results
    // 只返回TOP 2最相关的，避免信息过载
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(limit, 2));
  }

  /**
   * Keyword search (Legacy method, kept for compatibility)
   */
  private keywordSearch(query: string, limit: number = 5): SearchResult[] {
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
   * Enable/disable semantic search
   */
  setSemanticSearch(enabled: boolean): void {
    this.useSemanticSearch = enabled;
  }

  /**
   * Check if semantic search is enabled
   */
  isSemanticSearchEnabled(): boolean {
    return this.useSemanticSearch;
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
      
      // 智能截取：如果内容过长，只提取最相关的部分
      const content = result.entry.content;
      if (content.length > 500) {
        // 尝试提取包含关键概念的段落
        const paragraphs = content.split(/\n\n+/);
        const relevantParagraphs = paragraphs.filter(p => 
          result.matchedKeywords.some(kw => p.toLowerCase().includes(kw.toLowerCase()))
        );
        
        if (relevantParagraphs.length > 0) {
          // 取前2段最相关的
          context += relevantParagraphs.slice(0, 2).join('\n\n') + '\n\n';
        } else {
          // 否则取前500字符
          context += content.substring(0, 500) + '...\n\n';
        }
      } else {
        context += `${content}\n\n`;
      }
    }

    context += '【以上为精选的高相关度知识】\n';
    
    return context;
  }
}


