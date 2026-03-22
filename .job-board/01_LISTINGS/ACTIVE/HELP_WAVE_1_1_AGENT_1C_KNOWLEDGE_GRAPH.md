[Ver001.000]

# WAVE 1.1 — AGENT 1-C TASK: Knowledge Graph & Search
**Priority:** P0  
**Estimated:** 8 hours  
**Due:** +24 hours from claim  
**Stream:** Unified Help System  
**Dependencies:** Agent 1-A content schema, Agent 1-B expertise model

---

## ASSIGNMENT

Build the help content knowledge graph for intelligent search and recommendations.

### Core Challenge

Users don't know what to search for. Recommend related topics. Surface relevant content before they ask.

---

## DELIVERABLES

### 1. Knowledge Graph Schema

```typescript
// apps/website-v2/src/help/knowledgeGraph.ts

// Node types
export interface HelpTopic {
  id: string;
  content: HelpContent;  // From Agent 1-A
  
  // Graph relationships
  related: string[];           // Related topic IDs
  prerequisites: string[];     // Should learn first
  leadsTo: string[];          // Natural progression
  
  // Categorization
  category: HelpCategory;
  tags: string[];
  
  // Usage analytics
  viewCount: number;
  helpfulRating: number;       // 0-5 user rating
  averageReadTime: number;     // ms
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  parent?: string;            // For hierarchy
}

// The graph
export interface KnowledgeGraph {
  topics: Map<string, HelpTopic>;
  categories: Map<string, HelpCategory>;
  
  // Graph operations
  findRelated(topicId: string, limit?: number): HelpTopic[];
  findPrerequisites(topicId: string): HelpTopic[];
  findPath(from: string, to: string): HelpTopic[];  // Learning path
  search(query: string, filters?: SearchFilters): SearchResult[];
  recommend(context: RecommendationContext): HelpTopic[];
}
```

### 2. Search Engine

```typescript
// Full-text search with ranking

export interface SearchResult {
  topic: HelpTopic;
  score: number;
  matches: MatchHighlight[];
  relevance: 'exact' | 'high' | 'medium' | 'low';
}

export class HelpSearchEngine {
  private index: MiniSearch;  // or flexsearch
  
  constructor(private graph: KnowledgeGraph) {
    this.buildIndex();
  }
  
  private buildIndex(): void {
    this.index = new MiniSearch({
      fields: ['content.levels.beginner.summary', 
               'content.levels.beginner.detail',
               'tags', 'category.name'],
      storeFields: ['id'],
      searchOptions: {
        boost: {
          'content.levels.beginner.summary': 2,
          'tags': 1.5
        },
        fuzzy: 0.2
      }
    });
    
    for (const topic of this.graph.topics.values()) {
      this.index.add(topic);
    }
  }
  
  search(query: string, userProfile?: UserExpertiseProfile): SearchResult[] {
    const rawResults = this.index.search(query);
    
    // Rank by expertise-appropriate level
    return rawResults.map(result => {
      const topic = this.graph.topics.get(result.id)!;
      const score = this.calculateRelevance(result, topic, userProfile);
      
      return {
        topic,
        score,
        matches: this.extractHighlights(result, query),
        relevance: this.classifyRelevance(score)
      };
    }).sort((a, b) => b.score - a.score);
  }
  
  private calculateRelevance(
    result: MiniSearchResult,
    topic: HelpTopic,
    profile?: UserExpertiseProfile
  ): number {
    let score = result.score;
    
    // Boost by popularity
    score *= (1 + Math.log(topic.viewCount + 1) / 10);
    
    // Boost by helpfulness
    score *= (1 + topic.helpfulRating / 10);
    
    // Boost if matches user expertise
    if (profile && this.matchesExpertise(topic, profile)) {
      score *= 1.2;
    }
    
    return score;
  }
}
```

### 3. Recommendation Engine

```typescript
// Intelligent content recommendations

export interface RecommendationContext {
  currentTopic?: string;
  recentSearches: string[];
  userProfile: UserExpertiseProfile;
  pageContext: PageContext;
  timeOnPlatform: number;
}

export class RecommendationEngine {
  recommend(context: RecommendationContext): HelpTopic[] {
    const candidates: ScoredTopic[] = [];
    
    // 1. Natural progression from current topic
    if (context.currentTopic) {
      const progression = this.getProgressionTopics(context);
      candidates.push(...progression);
    }
    
    // 2. Related to recent searches
    const searchRelated = this.getSearchRelatedTopics(context);
    candidates.push(...searchRelated);
    
    // 3. Fill gaps in expertise
    const gapFillers = this.getExpertiseGapTopics(context);
    candidates.push(...gapFillers);
    
    // 4. Popular content
    const popular = this.getPopularTopics(context);
    candidates.push(...popular);
    
    // Deduplicate and rank
    return this.deduplicateAndRank(candidates).slice(0, 5);
  }
  
  private getProgressionTopics(context: RecommendationContext): ScoredTopic[] {
    const current = this.graph.topics.get(context.currentTopic!);
    if (!current) return [];
    
    return current.leadsTo.map(id => ({
      topic: this.graph.topics.get(id)!,
      score: 10,  // High priority
      reason: 'natural_progression'
    }));
  }
  
  private getExpertiseGapTopics(context: RecommendationContext): ScoredTopic[] {
    // Find topics in categories user hasn't explored
    const exploredCategories = new Set(
      context.userProfile.features.keys()
    );
    
    const unexplored = Array.from(this.graph.categories.values())
      .filter(cat => !exploredCategories.has(cat.id));
    
    return unexplored.flatMap(cat => 
      this.getCategoryIntroTopics(cat.id).map(topic => ({
        topic,
        score: 5,
        reason: 'category_discovery'
      }))
    );
  }
}
```

### 4. Graph Visualization Component

```typescript
// Visual knowledge map (for HelpWiki)

export const KnowledgeGraphView: React.FC<{
  rootTopic?: string;
  highlightPath?: string[];
  onNodeClick: (topicId: string) => void;
}> = ({ rootTopic, highlightPath, onNodeClick }) => {
  // D3.js or ReactFlow visualization
  // Show topics as nodes, relationships as edges
  // Highlight current topic and learning path
  
  return (
    <div className="knowledge-graph">
      <ReactFlow
        nodes={transformTopicsToNodes(graph.topics)}
        edges={transformRelationsToEdges(graph)}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        // ... styling
      />
    </div>
  );
};
```

### 5. Content Index Builder

```typescript
// Build search index from content files

export async function buildKnowledgeIndex(
  contentDir: string
): Promise<KnowledgeGraph> {
  const graph: KnowledgeGraph = {
    topics: new Map(),
    categories: new Map()
  };
  
  // Load all help content JSON files
  const files = await glob(`${contentDir}/**/*.json`);
  
  for (const file of files) {
    const content: HelpContent = JSON.parse(await readFile(file, 'utf-8'));
    
    const topic: HelpTopic = {
      id: content.id,
      content,
      related: inferRelated(content),
      prerequisites: inferPrerequisites(content),
      leadsTo: inferProgression(content),
      category: assignCategory(content),
      tags: extractTags(content),
      viewCount: 0,
      helpfulRating: 0,
      averageReadTime: 0
    };
    
    graph.topics.set(topic.id, topic);
  }
  
  // Build reverse relationships
  linkRelatedTopics(graph);
  
  return graph;
}
```

### 6. Integration with HelpOverlay

```typescript
// Show recommendations in help panel

export const RecommendedTopics: React.FC<{
  currentTopic?: string;
}> = ({ currentTopic }) => {
  const recommendations = useRecommendations({ currentTopic });
  
  if (recommendations.length === 0) return null;
  
  return (
    <div className="recommended-topics">
      <h4>You might also like:</h4>
      <ul>
        {recommendations.map(rec => (
          <li key={rec.topic.id}>
            <HelpLink topicId={rec.topic.id}>
              {rec.topic.content.levels.beginner.summary}
            </HelpLink>
            <span className="reason">{formatReason(rec.reason)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

## FOREMAN REVIEW CHECKLIST

- [ ] Graph schema supports all relationship types
- [ ] Search returns relevant results with highlighting
- [ ] Recommendations feel helpful, not random
- [ ] Graph visualization is performant (<100 nodes)
- [ ] Index builder handles all content from Agent 1-A
- [ ] No circular prerequisite chains

---

## INTEGRATION NOTES

**Receives from:**
- Agent 1-A: Help content (to index)
- Agent 1-B: Expertise profile (to personalize)

**Provides to:**
- Agent 2-B: Search component (search function)
- Agent 2-C: HelpWiki (graph visualization)
- Agent 3-B: Godot tutorial system (recommendations)

---

*Claim by moving to `.job-board/02_CLAIMED/{agent-id}/`*
