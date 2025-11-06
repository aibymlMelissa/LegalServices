import { OpenAI } from 'openai';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  timestamp: string;
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  filter?: Record<string, any>;
}

export class VectorSearchService {
  private openai: OpenAI;
  private documents: Map<string, VectorDocument> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      this.isInitialized = true;
    } else {
      console.warn('OpenAI API key not provided. Vector search will use fallback keyword search.');
      this.isInitialized = false;
    }
  }

  /**
   * Index a document with vector embedding
   */
  async indexDocument(
    id: string, 
    content: string, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      let embedding: number[] | undefined;

      // Generate embedding if OpenAI is available
      if (this.isInitialized && content.trim().length > 0) {
        try {
          const response = await this.openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: this.preprocessContent(content)
          });
          embedding = response.data[0].embedding;
        } catch (error) {
          console.warn(`Failed to generate embedding for document ${id}:`, error);
        }
      }

      const document: VectorDocument = {
        id,
        content: content.trim(),
        metadata: {
          ...metadata,
          indexed_at: new Date().toISOString(),
          word_count: this.countWords(content)
        },
        embedding,
        timestamp: new Date().toISOString()
      };

      this.documents.set(id, document);
      console.log(`Indexed document: ${id} (${document.metadata.word_count} words)`);
    } catch (error) {
      console.error(`Error indexing document ${id}:`, error);
      throw new Error(`Failed to index document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search documents using vector similarity
   */
  async search(
    query: string, 
    limit: number = 10,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      // Try vector search first if available
      if (this.isInitialized) {
        try {
          return await this.vectorSearch(query, limit, options);
        } catch (error) {
          console.warn('Vector search failed, falling back to keyword search:', error);
        }
      }

      // Fallback to keyword search
      return this.keywordSearch(query, limit, options);
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Vector-based semantic search
   */
  private async vectorSearch(
    query: string, 
    limit: number,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // Generate query embedding
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: this.preprocessContent(query)
    });
    const queryEmbedding = response.data[0].embedding;

    // Find documents with embeddings
    const documentsWithEmbeddings = Array.from(this.documents.values())
      .filter(doc => doc.embedding && this.matchesFilter(doc, options.filter));

    if (documentsWithEmbeddings.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const similarities = documentsWithEmbeddings.map(doc => ({
      document: doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding!)
    }));

    // Filter by threshold if specified
    const threshold = options.threshold || 0.1;
    const filtered = similarities.filter(item => item.score >= threshold);

    // Sort by similarity score
    filtered.sort((a, b) => b.score - a.score);

    // Return top results
    return filtered.slice(0, limit).map(item => ({
      id: item.document.id,
      content: item.document.content,
      metadata: {
        ...item.document.metadata,
        similarity_score: item.score
      },
      score: item.score
    }));
  }

  /**
   * Keyword-based search fallback
   */
  private keywordSearch(
    query: string, 
    limit: number,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const queryWords = this.preprocessContent(query)
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);

    const documents = Array.from(this.documents.values())
      .filter(doc => this.matchesFilter(doc, options.filter));

    const results: Array<{ document: VectorDocument; score: number }> = [];

    for (const doc of documents) {
      const content = doc.content.toLowerCase();
      let score = 0;

      // Calculate keyword matching score
      for (const word of queryWords) {
        // Exact match
        const exactMatches = (content.match(new RegExp(`\\b${this.escapeRegex(word)}\\b`, 'g')) || []).length;
        score += exactMatches * 3;

        // Partial match
        const partialMatches = (content.match(new RegExp(this.escapeRegex(word), 'g')) || []).length;
        score += partialMatches;

        // Boost score for title matches
        if (doc.metadata.title?.toLowerCase().includes(word)) {
          score += 5;
        }
      }

      // Normalize score by content length
      const normalizedScore = score / Math.sqrt(doc.metadata.word_count || 1);

      if (normalizedScore > 0) {
        results.push({ document: doc, score: normalizedScore });
      }
    }

    // Sort by score and return top results
    results.sort((a, b) => b.score - a.score);

    return Promise.resolve(
      results.slice(0, limit).map(item => ({
        id: item.document.id,
        content: item.document.content,
        metadata: {
          ...item.document.metadata,
          keyword_score: item.score
        },
        score: item.score
      }))
    );
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): VectorDocument | null {
    return this.documents.get(id) || null;
  }

  /**
   * Update document
   */
  async updateDocument(
    id: string, 
    content: string, 
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.indexDocument(id, content, metadata);
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Get all document IDs
   */
  getDocumentIds(): string[] {
    return Array.from(this.documents.keys());
  }

  /**
   * Get total number of indexed documents
   */
  getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * Clear all documents
   */
  clearIndex(): void {
    this.documents.clear();
  }

  /**
   * Get similar documents to a given document
   */
  async findSimilar(
    documentId: string, 
    limit: number = 5
  ): Promise<SearchResult[]> {
    const doc = this.documents.get(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Use the document content as search query
    return this.search(doc.content, limit + 1)
      .then(results => results.filter(result => result.id !== documentId).slice(0, limit));
  }

  /**
   * Batch index multiple documents
   */
  async batchIndex(
    documents: Array<{ id: string; content: string; metadata?: Record<string, any> }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const doc of documents) {
      try {
        await this.indexDocument(doc.id, doc.content, doc.metadata || {});
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get index statistics
   */
  getIndexStats(): {
    totalDocuments: number;
    documentsWithEmbeddings: number;
    averageContentLength: number;
    oldestDocument: string | null;
    newestDocument: string | null;
  } {
    const docs = Array.from(this.documents.values());
    
    if (docs.length === 0) {
      return {
        totalDocuments: 0,
        documentsWithEmbeddings: 0,
        averageContentLength: 0,
        oldestDocument: null,
        newestDocument: null
      };
    }

    const withEmbeddings = docs.filter(doc => doc.embedding).length;
    const avgLength = docs.reduce((sum, doc) => sum + doc.content.length, 0) / docs.length;
    
    const sorted = docs.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      totalDocuments: docs.length,
      documentsWithEmbeddings: withEmbeddings,
      averageContentLength: Math.round(avgLength),
      oldestDocument: sorted[0]?.id || null,
      newestDocument: sorted[sorted.length - 1]?.id || null
    };
  }

  /**
   * Preprocess content for better search
   */
  private preprocessContent(content: string): string {
    return content
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim()
      .substring(0, 8000);       // Limit length for embedding API
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Check if document matches filter criteria
   */
  private matchesFilter(
    doc: VectorDocument, 
    filter?: Record<string, any>
  ): boolean {
    if (!filter) return true;

    for (const [key, value] of Object.entries(filter)) {
      const docValue = doc.metadata[key];
      
      if (Array.isArray(value)) {
        if (!value.includes(docValue)) return false;
      } else if (docValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Count words in content
   */
  private countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      openaiConnection: boolean;
      documentsIndexed: number;
      embeddingsGenerated: number;
    };
  }> {
    const stats = this.getIndexStats();
    
    let openaiConnection = false;
    if (this.isInitialized) {
      try {
        // Test OpenAI connection with a small request
        await this.openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: 'test'
        });
        openaiConnection = true;
      } catch (error) {
        console.warn('OpenAI connection test failed:', error);
      }
    }

    const status = openaiConnection && stats.totalDocuments > 0 
      ? 'healthy'
      : stats.totalDocuments > 0 
      ? 'degraded' 
      : 'unhealthy';

    return {
      status,
      details: {
        openaiConnection,
        documentsIndexed: stats.totalDocuments,
        embeddingsGenerated: stats.documentsWithEmbeddings
      }
    };
  }
}