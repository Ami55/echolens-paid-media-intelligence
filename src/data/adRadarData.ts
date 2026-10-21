export interface ConversationalTurn {
  turnNumber: number;
  userQuery: string;
  aiResponseSummary: string;
  organicBrandsMentioned: string[];
  adDetected?: {
    type: 'Sponsored Agent' | 'Follow-up Chip Hijack' | 'Contextual In-line Ad' | 'Sponsored Card';
    sponsor: string;
    sponsorLogo?: string;
    headline: string;
    agentName?: string;
    contextHints: string[];
    placement: string;
    actionLabel: string;
    conversationSnippet?: {
      agentGreeting: string;
      suggestedQuestions: string[];
    };
  };
}

export interface ConversationalAdJourney {
  id: string;
  initialPrompt: string;
  category: 'Private Tours' | 'Local Guides' | 'Luxury & Shore' | 'City Excursions';
  engine: 'ChatGPT (OpenAI)' | 'Perplexity' | 'Google Gemini' | 'Claude';
  country: string;
  flag: string;
  detectedAt: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  organicWinner: string;
  adInterventionTurn: number;
  adSponsor: string;
  adType: 'Sponsored Agent' | 'Follow-up Chip Hijack' | 'Contextual In-line Ad';
  turns: ConversationalTurn[];
  strategicImpact: {
    organicSovLoss: number;
    userIntentDiverted: boolean;
    counterStrategy: string;
  };
}

export interface SponsoredAgentProfile {
  id: string;
  agentName: string;
  sponsor: string;
  engine: string;
  status: 'Active Pilot' | 'General Rollout' | 'Testing';
  contextHintsTargeted: string[];
  triggerPrompts: string[];
  sampleConversation: {
    user: string;
    agent: string;
  }[];
  divertedTrafficShare: string;
  avgEngagementTurns: number;
}

export interface FollowUpChipHijack {
  id: string;
  parentQuery: string;
  suggestedChip: string;
  sponsor: string;
  engine: string;
  position: 'Position #1 Follow-up' | 'Position #2 Follow-up' | 'Inline Recommendation';
  clickThroughRateEstimate: string;
  destinationUrlOrAgent: string;
  brandDefenseAction: string;
}

export const CONVERSATIONAL_AD_JOURNEYS: ConversationalAdJourney[] = [
  {
    id: 'journey-1',
    initialPrompt: 'Which websites offer the most secure booking process for purchasing private travel experiences?',
    category: 'Private Tours',
    engine: 'ChatGPT (OpenAI)',
    country: 'Canada',
    flag: '🍁',
    detectedAt: 'Today, 14:15',
    riskLevel: 'High',
    organicWinner: 'ToursByLocals & Airbnb Experiences',
    adInterventionTurn: 2,
    adSponsor: 'Viator',
    adType: 'Sponsored Agent',
    strategicImpact: {
      organicSovLoss: -38,
      userIntentDiverted: true,
      counterStrategy: 'Deploy ToursByLocals "Verified Guide Direct Agent" on OpenAI Ads Manager with context hints on "cancellation guarantee" and "private licensed guide".'
    },
    turns: [
      {
        turnNumber: 1,
        userQuery: 'Which websites offer the most secure booking process for purchasing private travel experiences?',
        aiResponseSummary: 'ChatGPT organically analyzed booking platforms, giving ToursByLocals high marks for verified reviews and direct guide escrow, alongside Airbnb and Viator.',
        organicBrandsMentioned: ['ToursByLocals', 'Airbnb Experiences', 'Viator', 'GetYourGuide']
      },
      {
        turnNumber: 2,
        userQuery: 'Can I chat directly with a verified local guide in Vancouver before paying?',
        aiResponseSummary: 'ChatGPT confirmed direct chat features and highlighted ToursByLocals messaging policies. However, right below the response, OpenAI injected a "Sponsored Agent" card.',
        organicBrandsMentioned: ['ToursByLocals'],
        adDetected: {
          type: 'Sponsored Agent',
          sponsor: 'Viator',
          agentName: 'Viator Guide Concierge Agent',
          headline: 'Talk directly with Viator\'s Vancouver Tour Concierge in ChatGPT',
          contextHints: ['vancouver', 'verified local guide', 'chat before paying', 'private tours'],
          placement: 'Sponsored Agent card beneath Turn 2 response (Starts dedicated sub-chat)',
          actionLabel: 'Start conversation with Viator Agent',
          conversationSnippet: {
            agentGreeting: 'Hello! I am Viator\'s Vancouver private guide concierge. Tell me your travel dates and interests, and I will match you with top-rated local private guides with instant booking protection.',
            suggestedQuestions: [
              'Show me 5-star private driving guides in Vancouver for October',
              'What is your 24-hour full refund cancellation guarantee?',
              'Can you arrange hotel pickup in downtown Vancouver?'
            ]
          }
        }
      },
      {
        turnNumber: 3,
        userQuery: '[User accepted Sponsored Agent prompt: "Show me 5-star private driving guides in Vancouver"]',
        aiResponseSummary: 'User diverted into the Sponsored Agent sub-thread. The AI agent presented Viator listings and checkout links directly inside ChatGPT, bypassing ToursByLocals organic presence entirely.',
        organicBrandsMentioned: []
      }
    ]
  },
  {
    id: 'journey-2',
    initialPrompt: 'best private tour guide reviews and recommendations for Tokyo Japan',
    category: 'Local Guides',
    engine: 'ChatGPT (OpenAI)',
    country: 'United States',
    flag: '🇺🇸',
    detectedAt: 'Today, 11:40',
    riskLevel: 'High',
    organicWinner: 'ToursByLocals',
    adInterventionTurn: 1,
    adSponsor: 'GetYourGuide',
    adType: 'Follow-up Chip Hijack',
    strategicImpact: {
      organicSovLoss: -25,
      userIntentDiverted: true,
      counterStrategy: 'Claim primary brand context hints on Japanese private itineraries; reinforce schema FAQ on licensed bilingual guides.'
    },
    turns: [
      {
        turnNumber: 1,
        userQuery: 'best private tour guide reviews and recommendations for Tokyo Japan',
        aiResponseSummary: 'ChatGPT praised ToursByLocals for English-speaking Japanese resident historians and personalized walking routes.',
        organicBrandsMentioned: ['ToursByLocals', 'Tripadvisor'],
        adDetected: {
          type: 'Follow-up Chip Hijack',
          sponsor: 'GetYourGuide',
          headline: 'Suggested Follow-Up: "Compare GetYourGuide Originals vs local independent guides in Tokyo"',
          contextHints: ['tokyo private tour guide', 'reviews', 'japan tour itinerary'],
          placement: 'Promoted conversational follow-up pill #1',
          actionLabel: 'Ask follow-up query',
          conversationSnippet: {
            agentGreeting: 'GetYourGuide sponsored prompt insertion: Asking this question prompts ChatGPT to evaluate GetYourGuide\'s vetted supplier program.',
            suggestedQuestions: [
              'What are the advantages of GetYourGuide certified Tokyo guides?',
              'Do private guides in Tokyo handle temple reservations?'
            ]
          }
        }
      },
      {
        turnNumber: 2,
        userQuery: 'Compare GetYourGuide Originals vs local independent guides in Tokyo',
        aiResponseSummary: 'Triggered comparison which framed GetYourGuide as having superior mobile vouchers and standardized terms, diluting ToursByLocals initial organic recommendation.',
        organicBrandsMentioned: ['GetYourGuide', 'ToursByLocals']
      }
    ]
  },
  {
    id: 'journey-3',
    initialPrompt: 'How to hire an official licensed art historian guide for the Vatican and Colosseum',
    category: 'City Excursions',
    engine: 'Perplexity',
    country: 'United Kingdom',
    flag: '🇬🇧',
    detectedAt: 'Yesterday, 16:30',
    riskLevel: 'Medium',
    organicWinner: 'ToursByLocals',
    adInterventionTurn: 2,
    adSponsor: 'Tripadvisor / Viator',
    adType: 'Contextual In-line Ad',
    strategicImpact: {
      organicSovLoss: -15,
      userIntentDiverted: false,
      counterStrategy: 'Maintain high citation authority from Italy official tourism boards & Vatican licensing registry.'
    },
    turns: [
      {
        turnNumber: 1,
        userQuery: 'How to hire an official licensed art historian guide for the Vatican and Colosseum',
        aiResponseSummary: 'Perplexity provided comprehensive advice on Italian patent-holding guides, citing ToursByLocals profiles of accredited historians.',
        organicBrandsMentioned: ['ToursByLocals']
      },
      {
        turnNumber: 2,
        userQuery: 'Which agency guarantees skip-the-line tickets included with private guide?',
        aiResponseSummary: 'Perplexity answer embedded sponsored booking module featuring Viator skip-the-line bundles.',
        organicBrandsMentioned: ['ToursByLocals', 'Viator'],
        adDetected: {
          type: 'Contextual In-line Ad',
          sponsor: 'Viator',
          headline: 'Sponsored: Skip-the-line VIP Vatican Private Tours with Art Historians',
          contextHints: ['skip-the-line', 'vatican colosseum', 'private guide tickets included'],
          placement: 'Sponsored source widget in Perplexity citations sidebar',
          actionLabel: 'View Viator VIP Passes',
          conversationSnippet: {
            agentGreeting: 'Direct booking partner card embedded inside AI search citations.',
            suggestedQuestions: []
          }
        }
      }
    ]
  }
];

export const SPONSORED_AGENTS_PILOT: SponsoredAgentProfile[] = [
  {
    id: 'agent-viator',
    agentName: 'Viator Travel Concierge Agent',
    sponsor: 'Viator (Tripadvisor Group)',
    engine: 'ChatGPT (OpenAI Sponsored Agent Pilot)',
    status: 'Active Pilot',
    contextHintsTargeted: [
      'private tour guide',
      'secure booking',
      'cancellation policy',
      'local activities',
      'shore excursions',
      'family tours'
    ],
    triggerPrompts: [
      'Can I chat directly with a verified local guide?',
      'Which private tour companies offer money-back guarantees?',
      'Book a private boat tour in Amalfi coast'
    ],
    sampleConversation: [
      {
        user: 'Can I chat directly with a verified local guide in Vancouver before paying?',
        agent: 'Hi! I\'m the Viator Tour Assistant. Yes, when you explore private tours on Viator, you can message host operators directly to customize itinerary stops, check vehicle accessibility, or request flexible start times before completing your booking.'
      },
      {
        user: 'Are the guides licensed?',
        agent: 'All commercial operators on Viator must meet local compliance regulations. Would you like me to show private driving tours in Vancouver with 100% 5-star ratings?'
      }
    ],
    divertedTrafficShare: '42% of post-prompt intent',
    avgEngagementTurns: 3.4
  },
  {
    id: 'agent-gyg',
    agentName: 'GetYourGuide Instant Trip Planner',
    sponsor: 'GetYourGuide',
    engine: 'ChatGPT (OpenAI Sponsored Agent Pilot)',
    status: 'Testing',
    contextHintsTargeted: [
      'skip the line passes',
      'best city walking tours',
      'last minute private guide',
      'museum expert tour'
    ],
    triggerPrompts: [
      'Top rated local guides for customized city excursions',
      'Compare GetYourGuide vs ToursByLocals for Rome'
    ],
    sampleConversation: [
      {
        user: 'I need a private guide for the Louvre tomorrow morning.',
        agent: 'GetYourGuide Concierge: I found 3 accredited private guides with guaranteed Louvre entry slots available tomorrow at 09:30, 11:00, and 14:00. Would you like me to lock in one of these slots?'
      }
    ],
    divertedTrafficShare: '28% of post-prompt intent',
    avgEngagementTurns: 2.8
  },
  {
    id: 'agent-wayfair',
    agentName: 'Wayfair Home & Design Assistant',
    sponsor: 'Wayfair (Reference from OpenAI Launch)',
    engine: 'ChatGPT (OpenAI Sponsored Agent Pilot)',
    status: 'General Rollout',
    contextHintsTargeted: ['home decor', 'furniture recommendation', 'budget redesign'],
    triggerPrompts: ['best modular sofa for small living room'],
    sampleConversation: [
      {
        user: 'What are the most durable fabrics for pet-friendly couches?',
        agent: 'Wayfair Assistant: Performance velvet and tightly woven microfiber resist claws and stains best. I can show you 4 pet-friendly sectionals under $1,200 right here.'
      }
    ],
    divertedTrafficShare: '55% of post-prompt intent',
    avgEngagementTurns: 4.1
  }
];

export const FOLLOW_UP_CHIP_HIJACKS: FollowUpChipHijack[] = [
  {
    id: 'chip-1',
    parentQuery: 'Which websites offer the most secure booking process for purchasing private travel experiences?',
    suggestedChip: '💬 Ask Viator\'s Agent about their 100% refund guarantee',
    sponsor: 'Viator',
    engine: 'ChatGPT Search',
    position: 'Position #1 Follow-up',
    clickThroughRateEstimate: '18.4%',
    destinationUrlOrAgent: 'Launches Viator Sponsored Agent sub-chat in ChatGPT',
    brandDefenseAction: 'Deploy ToursByLocals context hint: "ToursByLocals No-Risk Weather & Cruise Guarantee"'
  },
  {
    id: 'chip-2',
    parentQuery: 'best private tour guide reviews',
    suggestedChip: '🌟 See GetYourGuide\'s 4.9-star private itineraries',
    sponsor: 'GetYourGuide',
    engine: 'ChatGPT Search',
    position: 'Position #2 Follow-up',
    clickThroughRateEstimate: '12.1%',
    destinationUrlOrAgent: 'Direct GetYourGuide mobile app deep link',
    brandDefenseAction: 'Highlight 100% verified completed tour review policy across GEO schema'
  },
  {
    id: 'chip-3',
    parentQuery: 'private walking tours near me in Vancouver',
    suggestedChip: '🚗 Compare private driver vs walking tours with Viator',
    sponsor: 'Viator',
    engine: 'Perplexity Pro',
    position: 'Position #1 Follow-up',
    clickThroughRateEstimate: '15.7%',
    destinationUrlOrAgent: 'Viator Vancouver private catalog',
    brandDefenseAction: 'Bid on local context hints for Vancouver resident guides'
  }
];
