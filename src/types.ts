export type SetupMethod = 'ai' | 'manual' | 'csv' | null;

export type NavigationTab = 
  | 'dashboard'
  | 'ad_radar'
  | 'brand_insights'
  | 'prompt_analysis'
  | 'citations'
  | 'ai_model_insights'
  | 'personas'
  | 'prompt_management'
  | 'user_management'
  | 'api_docs';

export type SubNavigationItem = 
  | 'overview'
  | 'visibility'
  | 'visibility_score'
  | 'share_of_voice'
  | 'position'
  | 'sentiment'
  | 'query_fanouts'
  | 'mentions'
  | 'competitors'
  | 'prompt_groups'
  | 'all_domains'
  | 'all_pages';

export interface PromptAnalysisFilterState {
  dateRange: '7d' | '14d' | '30d';
  promptGroup: string;
  country: string;
  aiModel: string;
}

export interface PromptDetailData {
  id: string;
  rank: number;
  prompt: string;
  promptGroup: string;
  countries: string[];
  aiModels: string[];
  
  // Visibility
  visibilityScore: number;
  latestVisibility: number;
  highestVisibility: number;
  lowestVisibility: number;
  avgVisibility: number;
  visibilityHistory: { date: string; value: number }[];
  
  // Share of Voice
  shareOfVoice: number;
  latestSov: number;
  highestSov: number;
  lowestSov: number;
  avgSov: number;
  sovHistory: { date: string; value: number }[];
  
  // Position
  position: number;
  latestPosition: number;
  bestPosition: number;
  worstPosition: number;
  avgPosition: number;
  positionHistory: { date: string; value: number }[];
  
  // Sentiment
  sentimentScore: number; // e.g. 0.67
  positiveMentions: number;
  neutralMentions: number;
  negativeMentions: number;
  sentimentHistory: { date: string; value: number }[];
  
  // Fanouts
  fanoutQueries: {
    id: string;
    query: string;
    country: string;
    countryCode: string;
    flag: string;
    aiEngine: string;
    engineKey: EngineType;
    date: string;
  }[];
}

export type DomainType = 
  | 'You'
  | 'Community'
  | 'Corporate'
  | 'Editorial'
  | 'Marketplace'
  | 'Platform'
  | 'Reference'
  | 'Review site'
  | 'Social'
  | 'Unscrapable'
  | 'Other';

export interface CitationsFilterState {
  dateRange: '7d' | '14d' | '30d';
  promptGroup: string;
  country: string;
  aiModel: string;
}

export interface CitedPageItem {
  id: string;
  rank: number;
  domain: string;
  url: string;
  citations: number;
  favicon?: string;
  promptGroup?: string;
  countries?: string[];
  aiModels?: string[];
}

export interface CitedDomainItem {
  id: string;
  rank: number;
  domain: string;
  favicon?: string;
  pageCount: number;
  domainType: DomainType;
  totalCitations: number;
  citationShare: number; // e.g. 4.9 for 4.9%
  history?: { date: string; value: number }[];
  subpages?: CitedPageItem[];
}

export type PromptCategory = 
  | 'Comparison & Alternatives'
  | 'Best in Category'
  | 'Feature & Capability'
  | 'Pricing & Value'
  | 'How-to & Workflows'
  | 'Brand Sentiment'
  | 'City tour booking services'
  | 'Travel consulting'
  | 'Visitor travel planning services';

export type SearchIntent = 'commercial' | 'informational' | 'transactional' | 'navigational';

export type EngineType = 'chatgpt' | 'gemini' | 'perplexity' | 'claude' | 'copilot';

export interface PromptItem {
  id: string;
  trackedBrand?: string;
  text: string;
  category: string;
  intent: SearchIntent;
  estimatedVolume: 'High' | 'Medium' | 'Low';
  selected?: boolean;
  
  // Visibility tracking stats
  lastChecked?: string;
  brandMentioned?: boolean;
  rankingPosition?: number; // 1 = cited first, 2 = second, etc., 0 = not mentioned
  sentiment?: 'positive' | 'neutral' | 'negative' | 'unranked';
  bestEngine?: EngineType;
  sampleAiSnippet?: string;
  sourcesCount?: number;
}

export interface BrandProfile {
  name: string;
  domain: string;
  description: string;
  category: string;
  trackedEngines: EngineType[];
  visibilityScore: number;
  totalMentions: number;
  promptGroup?: string;
  shareOfVoice?: number;
}

export interface GeneratedPromptCategoryGroup {
  category: PromptCategory;
  description: string;
  prompts: PromptItem[];
}

export interface AiSimulationResult {
  prompt: string;
  engine: EngineType;
  modelAnswer: string;
  brandMentioned: boolean;
  rankingPosition: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyRecommendation: string;
  citedSources: {
    title: string;
    domain: string;
    url: string;
  }[];
}

// Traveler Journey & Marketing Stages
export type MarketingFunnelStage = 
  | 'inspiration'        // Top of Funnel: Dream, idea generation
  | 'destination'        // High Funnel: Choosing country/city
  | 'planning'           // Mid Funnel: Itinerary building, tour finding
  | 'comparison'         // Mid-Low Funnel: Provider & guide vetting
  | 'ready_to_book';     // Bottom Funnel: Transactional, immediate booking

// Brand Awareness Levels in Prompts (Critical for GEO measurement)
export type PromptAwarenessType = 
  | 'unbranded'          // e.g., "Best site to book local guides in Rome" (Highest natural GEO signal)
  | 'category_level'     // e.g., "Top 3 platforms for private tours in Europe"
  | 'comparative'        // e.g., "Example Travel vs Viator vs GetYourGuide for private tours"
  | 'direct_brand'       // e.g., "Is Example Travel reliable for Rome tours?"
  | 'transactional';     // e.g., "Book a 6-hour private walking tour in Paris with local guide"

export interface PersonaPrompt {
  questionTopic?: string;
  id: string;
  personaId: string;
  text: string;
  awarenessType: PromptAwarenessType;
  funnelStage: MarketingFunnelStage;
  searchIntent: SearchIntent;
  targetDestination: string;
  estimatedVolume: 'High' | 'Medium' | 'Low';
  
  // Citation audit metrics across LLMs
  isAudited?: boolean;
  brandMentioned?: boolean;
  rankingPosition?: number; // 0 = unranked, 1 = top recommendation
  sentiment?: 'positive' | 'neutral' | 'negative' | 'unranked';
  testedEngine?: EngineType;
  citedSources?: string[];
  competitorsMentioned?: string[];
  sampleAiSnippet?: string;
  lastAudited?: string;
}

export interface TravelPersona {
  id: string;
  name: string;
  title: string;
  funnelStage: MarketingFunnelStage;
  stageLabel: string;
  avatarIcon: string;
  color: string;
  travelerQuote: string;
  primaryGoal: string;
  keyMindset: string;
  demographics: {
    groupType: string;
    budgetLevel: string;
    planningHorizon: string;
    preferredPace: string;
  };
  keyPainsAndNeeds: string[];
  targetDestinations: string[];
  prompts: PersonaPrompt[];
  citationRate?: number; // % of prompts mentioning brand
  avgPosition?: number;
}
