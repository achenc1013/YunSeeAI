/**
 * Semantic Matcher - Intelligent semantic matching instead of simple keyword matching
 */

export interface SemanticMatchResult {
  score: number; // 0-1
  explanation: string;
  matchedConcepts: string[];
}

export class SemanticMatcher {
  private stopWords: Set<string>;
  private synonyms: Map<string, string[]>;

  constructor() {
    // 中英文停用词
    this.stopWords = new Set([
      // 中文停用词
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
      '自己', '这', '那', '什么', '吗', '呢', '啊', '能', '吧', '怎么', '如何',
      // 英文停用词
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'can', 'could', 'may', 'might', 'must', 'what', 'how', 'why', 'when',
      'where', 'which', 'who', 'whom', 'this', 'that', 'these', 'those'
    ]);

    // 同义词和相关概念映射
    this.synonyms = new Map([
      // 编程语言相关
      ['python', ['python', 'py', 'python语言', 'python编程', 'python开发']],
      ['javascript', ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'nodejs', 'node']],
      ['java', ['java', 'jdk', 'jvm', 'java语言']],
      ['docker', ['docker', '容器', 'container', 'docker化', '容器化']],
      ['kubernetes', ['kubernetes', 'k8s', 'kube', 'k8s集群']],
      
      // 安全相关
      ['sql注入', ['sql注入', 'sqli', 'sql injection', 'sql攻击', '注入漏洞']],
      ['xss', ['xss', '跨站脚本', 'cross-site scripting', 'xss攻击', '脚本注入']],
      ['csrf', ['csrf', '跨站请求伪造', 'cross-site request forgery', 'csrf攻击']],
      ['漏洞', ['漏洞', 'vulnerability', 'cve', '安全漏洞', '安全问题']],
      
      // 动词映射（意图识别）
      ['特点', ['特点', '特性', '特征', '优点', '优势', '好处', '特色']],
      ['应用', ['应用', '用途', '使用场景', '适用', '用于', '用来', '可以做']],
      ['原理', ['原理', '机制', '工作方式', '如何工作', '怎么工作', '实现方式']],
      ['安装', ['安装', '部署', '配置', '搭建', '环境搭建', '如何安装']],
      ['学习', ['学习', '入门', '教程', '如何学', '怎么学', '学习路径']],
    ]);
  }

  /**
   * Extract semantic concepts from text
   */
  private extractConcepts(text: string): string[] {
    const lowerText = text.toLowerCase();
    const concepts: Set<string> = new Set();

    // 1. 分词（简单分词，支持中英文）
    const words = lowerText
      .replace(/[，。！？；：、,.!?;:]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.stopWords.has(word));

    // 2. 添加原始词
    words.forEach(word => concepts.add(word));

    // 3. 扩展同义词
    words.forEach(word => {
      for (const [key, synonymList] of this.synonyms.entries()) {
        if (synonymList.some(syn => word.includes(syn) || syn.includes(word))) {
          concepts.add(key);
          synonymList.forEach(syn => concepts.add(syn));
        }
      }
    });

    // 4. 提取常见短语
    const phrases = this.extractPhrases(lowerText);
    phrases.forEach(phrase => concepts.add(phrase));

    return Array.from(concepts);
  }

  /**
   * Extract common phrases (2-3 word combinations)
   */
  private extractPhrases(text: string): string[] {
    const phrases: string[] = [];
    const words = text.split(/\s+/).filter(w => w.length > 0);

    // 提取2-gram
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (!this.stopWords.has(words[i]) || !this.stopWords.has(words[i + 1])) {
        phrases.push(phrase);
      }
    }

    // 提取3-gram
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      phrases.push(phrase);
    }

    return phrases;
  }

  /**
   * Calculate semantic similarity using concept overlap
   */
  calculateSimilarity(query: string, document: string): SemanticMatchResult {
    const queryConcepts = this.extractConcepts(query);
    const docConcepts = this.extractConcepts(document);

    if (queryConcepts.length === 0 || docConcepts.length === 0) {
      return {
        score: 0,
        explanation: '无法提取语义概念',
        matchedConcepts: []
      };
    }

    // 计算概念交集
    const matchedConcepts = queryConcepts.filter(qc => 
      docConcepts.some(dc => 
        qc.includes(dc) || 
        dc.includes(qc) ||
        this.areSynonyms(qc, dc)
      )
    );

    // 使用改进的相似度计算（Jaccard + 权重）
    const intersection = matchedConcepts.length;
    const union = new Set([...queryConcepts, ...docConcepts]).size;
    
    // 基础相似度（Jaccard）
    let baseScore = union > 0 ? intersection / union : 0;

    // 加权：重要概念权重更高
    let weightedScore = baseScore;
    
    // 如果匹配了核心概念（名词），增加权重
    const coreMatches = matchedConcepts.filter(c => c.length > 2);
    if (coreMatches.length > 0) {
      weightedScore += 0.2 * (coreMatches.length / queryConcepts.length);
    }

    // 如果匹配了短语，增加权重
    const phraseMatches = matchedConcepts.filter(c => c.includes(' '));
    if (phraseMatches.length > 0) {
      weightedScore += 0.15;
    }

    // 归一化到0-1
    const finalScore = Math.min(weightedScore, 1.0);

    return {
      score: finalScore,
      explanation: this.generateExplanation(matchedConcepts, queryConcepts),
      matchedConcepts: matchedConcepts
    };
  }

  /**
   * Check if two concepts are synonyms
   */
  private areSynonyms(concept1: string, concept2: string): boolean {
    for (const [key, synonymList] of this.synonyms.entries()) {
      const has1 = synonymList.some(s => concept1.includes(s) || s.includes(concept1));
      const has2 = synonymList.some(s => concept2.includes(s) || s.includes(concept2));
      if (has1 && has2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(matched: string[], query: string[]): string {
    if (matched.length === 0) {
      return '未找到语义匹配';
    }

    const matchRate = (matched.length / query.length * 100).toFixed(0);
    const topMatches = matched.slice(0, 3).join('、');
    
    return `匹配度${matchRate}%，关键概念: ${topMatches}`;
  }

  /**
   * Intent detection - understand what user is asking about
   */
  detectIntent(query: string): {
    intent: string;
    target: string | null;
    confidence: number;
  } {
    const lowerQuery = query.toLowerCase();
    
    // 意图模式
    const intentPatterns = [
      { intent: 'definition', patterns: ['什么是', '是什么', 'what is', '定义', '介绍'], confidence: 0.9 },
      { intent: 'features', patterns: ['特点', '特性', '优势', '好处', 'features', 'advantages'], confidence: 0.85 },
      { intent: 'usage', patterns: ['如何使用', '怎么用', '用法', '应用', 'how to use', '用途'], confidence: 0.85 },
      { intent: 'principle', patterns: ['原理', '机制', '如何工作', '怎么工作', 'how it works', 'principle'], confidence: 0.8 },
      { intent: 'installation', patterns: ['安装', '部署', '配置', 'install', 'setup', 'deploy'], confidence: 0.85 },
      { intent: 'learning', patterns: ['学习', '入门', '教程', 'learn', 'tutorial', '如何学'], confidence: 0.8 },
      { intent: 'comparison', patterns: ['区别', '对比', '比较', 'difference', 'compare', 'vs'], confidence: 0.85 },
    ];

    // 检测意图
    let detectedIntent = 'general';
    let maxConfidence = 0.5;

    for (const { intent, patterns, confidence } of intentPatterns) {
      if (patterns.some(p => lowerQuery.includes(p))) {
        if (confidence > maxConfidence) {
          detectedIntent = intent;
          maxConfidence = confidence;
        }
      }
    }

    // 提取目标实体（技术/概念）
    const concepts = this.extractConcepts(query);
    const target = concepts.find(c => c.length > 2) || null;

    return {
      intent: detectedIntent,
      target,
      confidence: maxConfidence
    };
  }
}



