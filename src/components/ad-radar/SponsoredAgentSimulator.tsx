import React, { useRef, useState } from 'react';
import { ArrowRight, Bot, ExternalLink, Send, Sparkles } from 'lucide-react';
import { BrandProfile, PromptItem } from '../../types';
import { GoogleAdsImport, GoogleAdsLandingPageImport } from '../../utils/googleAdsImport';

type Recommendation = {
  url: string;
  label: string;
  reason?: string;
  title?: string;
  grounding?: 'live_site_search';
};
type Message = { role: 'user' | 'agent'; text: string; recommendation?: Recommendation };
type Seed = { id: string; text: string; source: string };

interface Props {
  brand: BrandProfile;
  prompts: PromptItem[];
  searchTerms: GoogleAdsImport | null;
  landingPages: GoogleAdsLandingPageImport | null;
}

const exampleSeed: Seed = {
  id: 'example',
  text: 'I am planning a private tour and want to find a local guide who can adapt the experience to my interests.',
  source: 'Example scenario',
};

const safeBrandUrl = (domain: string) => {
  try {
    const url = new URL(/^https?:\/\//i.test(domain) ? domain : `https://${domain}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : '';
  } catch { return ''; }
};

const normalizedHost = (value: string) => {
  try { return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./i, '').toLowerCase(); }
  catch { return ''; }
};

const followUpsFor = (context: string) => {
  const text = context.toLowerCase();
  if (/legit|reliab|reput|scam|trust|review|happy|satisf/.test(text)) return [
    'Where can I verify the company information?',
    'How should I evaluate the customer reviews?',
    'What booking protections should I check?',
    'What are the most common positive and negative themes?',
  ];
  if (/cancel|refund|change.*booking/.test(text)) return [
    'Where are the cancellation terms shown?',
    'Do the terms vary by tour?',
    'What should I confirm before paying?',
    'Who should I contact about an existing booking?',
  ];
  if (/price|cost|budget|include|fee|pay/.test(text)) return [
    'What is included in the listed price?',
    'Are there extra fees I should check?',
    'How can I compare options for my group size?',
    'Where can I confirm the final price?',
  ];
  return [
    'Can I tailor the tour to my interests?',
    'What should I check about the price and what is included?',
    'How can I choose a guide for my group?',
    'How do I check the cancellation terms?',
  ];
};

export const SponsoredAgentSimulator: React.FC<Props> = ({ brand, prompts, searchTerms, landingPages }) => {
  const seeds: Seed[] = [
    ...(searchTerms?.rows || [])
      .filter(row => row.query && (row.clicks > 0 || row.conversions > 0))
      .sort((a, b) => (b.conversions * 30 + b.clicks) - (a.conversions * 30 + a.clicks))
      .slice(0, 25)
      .map((row, index) => ({ id: `ads-${index}`, text: row.query, source: 'Google Ads search term' })),
    ...prompts.filter(prompt => prompt.selected !== false).slice(0, 25)
      .map(prompt => ({ id: `prompt-${prompt.id}`, text: prompt.text, source: 'Tracked prompt' })),
  ];
  if (!seeds.length) seeds.push(exampleSeed);

  const [selectedSeedId, setSelectedSeedId] = useState(seeds[0].id);
  const [customQuery, setCustomQuery] = useState('');
  const selectedSeed = seeds.find(seed => seed.id === selectedSeedId) || seeds[0];
  const initialQuery = customQuery.trim() || selectedSeed.text;
  const [approvedFacts, setApprovedFacts] = useState('');
  const origin = safeBrandUrl(brand.domain);
  const pageOptions = (landingPages?.pages || []).filter(page => {
    try {
      const url = new URL(page.url);
      const invalidPlaceholder = /[{}]|%7b|%7d|\{ignore\}/i.test(page.url);
      return origin && !invalidPlaceholder && normalizedHost(url.href) === normalizedHost(origin);
    } catch { return false; }
  }).slice(0, 60);
  const [stage, setStage] = useState<'ad' | 'chat'>('ad');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'ai' | 'scripted' | null>(null);
  const requestVersion = useRef(0);

  const reset = () => {
    requestVersion.current += 1;
    setStage('ad'); setMessages([]); setDraft(''); setError(''); setMode(null); setBusy(false);
  };

  const localFallbackAnswer = (question: string, history: Message[] = []) => {
    const text = question.toLowerCase();
    const context = `${initialQuery} ${history.map(message => message.text).join(' ')} ${question}`.toLowerCase();
    const trustContext = /legit|reliab|reput|scam|trust|review|happy|satisf/.test(context);
    if (/where|how|check|verify|validation|proof/.test(text) && trustContext) return `To assess ${brand.name}, check its official company and contact information, booking and cancellation terms, guide profiles, and recent reviews on independent platforms. Look at review volume, recency, repeated themes and how complaints are handled—not only the average score. Live search is required to provide the exact current pages.`;
    if (/review|happy|satisf|experience|travell?ers?/.test(text) && trustContext) return `To understand whether travellers are happy, compare recent reviews across more than one source. Look for repeated comments about guide quality, communication, tour accuracy, support and cancellations, and note both positive and negative patterns. This scripted preview cannot honestly summarize current reviews without live search.`;
    if (/\b(?:legit|legitimate|scam|reputable|trustworthy|reliable)\b|real company/.test(text)) return `A useful answer should verify ${brand.name} using current company information, booking policies and independent customer reviews. Live website search is unavailable in this preview, so I should not claim that it is—or is not—legitimate without sources. Would you like a checklist for evaluating it?`;
    if (/\b(?:customer|traveller|traveler|guest) reviews?\b|\breviews? say\b/.test(text)) return 'This scripted preview cannot summarize current customer reviews reliably. A live answer should compare recent review sources, describe recurring positive and negative themes, and link to the exact pages used.';
    if (/cancel|refund|change.*booking/.test(text)) return 'Cancellation and refund terms can vary by experience. Please review the terms on the specific tour page before booking. Which destination or tour are you considering?';
    if (/price|cost|budget|include|fee|pay/.test(text)) return 'Prices and inclusions vary by tour. Share your destination, dates and group size so you can compare the relevant options on the website.';
    if (/\bcustom(?:ize|ise|ized|ised|ization|isation)?\b|\btailor(?:ed|ing)?\b|\badapt(?:ed|ing|able)?\b|\bpace\b|\bmobility\b|\baccessib/.test(text)) return 'You can describe your interests, preferred pace and any mobility needs. Any changes should be discussed and confirmed with the guide before booking.';
    if (/guide|review|trust|safe/.test(text)) return 'You can compare guide profiles, tour details and available reviews on the website. Which destination and interests should we focus on?';
    if (/date|available|book|reserve/.test(text)) return 'Availability depends on the tour and selected date. Share your destination, date and group size, then confirm the details on the relevant page.';
    if (approvedFacts.trim()) return `Based on the verified information supplied for this preview: ${approvedFacts.trim().slice(0, 260)}. What destination, dates or group needs should we focus on?`;
    return 'Tell me more about your destination, dates, group and interests, and I can help you identify which details to check before booking.';
  };

  const send = async (question: string, history: Message[] = messages) => {
    const text = question.trim();
    if (!text || busy) return;
    const version = ++requestVersion.current;
    const previous = history;
    setMessages([...previous, { role: 'user', text }]);
    setDraft(''); setBusy(true); setError('');
    try {
      const response = await fetch('/api/sponsored-agent-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brand.name,
          brandDomain: brand.domain,
          category: brand.category,
          brandDescription: brand.description,
          initialQuery,
          approvedFacts,
          messages: [...previous, { role: 'user', text }],
          landingPages: pageOptions.slice(0, 30).map(page => ({
            url: page.url,
            path: decodeURIComponent(new URL(page.url).pathname),
            clicks: page.clicks,
            impressions: page.impressions,
          })),
        }),
      });
      if (!response.ok) throw new Error('The preview could not respond. Please try again.');
      const result: { answer: string; mode: 'ai' | 'scripted'; recommendation?: Recommendation | null; warning?: string } = await response.json();
      if (version !== requestVersion.current) return;
      if (!result.answer) throw new Error('The preview returned an empty answer. Please try again.');
      const aiRecommendation = result.recommendation && normalizedHost(result.recommendation.url) === normalizedHost(brand.domain)
        ? result.recommendation
        : undefined;
      setMessages(current => [...current, {
        role: 'agent',
        text: result.answer,
        recommendation: result.mode === 'ai' ? aiRecommendation : undefined,
      }]);
      setMode(result.mode);
      if (result.mode === 'scripted') {
        const status = result.warning?.includes('openai_key_missing')
          ? 'OPENAI_API_KEY is not available in this deployment. Add it to the environment you are testing, then redeploy.'
          : result.warning?.includes('openai_request_failed')
            ? 'OpenAI website search failed. Check the deployment logs, API billing and model access.'
            : 'Live AI and website search are unavailable in this deployment.';
        setError(`${status} This is a built-in example response, so no page recommendation is shown.`);
      }
    } catch (cause) {
      if (version !== requestVersion.current) return;
      setMessages([...previous, { role: 'user', text }, {
        role: 'agent',
        text: localFallbackAnswer(text, previous),
        recommendation: undefined,
      }]);
      setMode('scripted');
      setError('Demo mode: using built-in responses. Connect the server endpoint to enable live AI responses.');
    } finally { if (version === requestVersion.current) setBusy(false); }
  };

  const startConversation = () => {
    setStage('chat');
    setMessages([]);
    setDraft('');
    setError('');
    setMode(null);
    void send(initialQuery, []);
  };

  return <div className="space-y-4">
    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-[11px] leading-relaxed text-violet-800">
      <strong>Internal simulation:</strong> The ad placement and traveller conversation below are examples. This does not show a live ChatGPT ad or predict who will see one. Google Ads queries are used only to suggest scenarios.
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div><div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">1 · Set the scene</div><h2 className="mt-1 text-sm font-bold text-slate-900">What is the traveller looking for?</h2></div>
        <label className="block text-[11px] font-semibold text-slate-700">Choose a starting idea
          <select value={selectedSeed.id} onChange={event => { setSelectedSeedId(event.target.value); setCustomQuery(''); reset(); }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
            {seeds.map(seed => <option key={seed.id} value={seed.id}>{seed.source}: {seed.text}</option>)}
          </select>
        </label>
        <label className="block text-[11px] font-semibold text-slate-700">Or write your own travel question
          <textarea value={customQuery} onChange={event => { setCustomQuery(event.target.value); reset(); }} rows={3} maxLength={500} placeholder="e.g. We have two days in Rome and want a private history tour at a relaxed pace." className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-2.5 text-xs font-normal" />
        </label>
        <label className="block text-[11px] font-semibold text-slate-700">Verified brand facts for this preview (optional)
          <textarea value={approvedFacts} onChange={event => { setApprovedFacts(event.target.value); reset(); }} rows={4} maxLength={3000} placeholder="Add approved details about customization, guide selection, or policies. Leave blank when unverified." className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-2.5 text-xs font-normal" />
        </label>
        <p className="text-[10px] leading-relaxed text-slate-500">The agent treats these notes as supplied facts. Do not add details that have not been confirmed.</p>
        {stage === 'chat' && <button onClick={reset} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Restart simulation</button>}
      </div>

      <div className="lg:col-span-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {stage === 'ad' ? <div className="space-y-5 p-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2 · Simulated ad placement</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] font-bold text-slate-500">Traveller asks</div>
            <p className="mt-2 text-sm font-semibold text-slate-800">{initialQuery}</p>
            <div className="mt-4 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-600">Illustrative independent response: Compare the available options, what each experience includes, and whether they suit your dates and interests.</div>
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
            <div className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-violet-700 border border-violet-200">Sponsored · {brand.name} · simulation</div>
            <h3 className="mt-3 text-base font-bold text-slate-900">Explore private tours with {brand.name}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">Ask about options for your interests, group and travel plans. Review the details on the website before booking.</p>
            <button onClick={startConversation} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700">Open sponsored conversation <ArrowRight className="h-4 w-4" /></button>
          </div>
          <p className="text-[10px] text-slate-500">The sponsored conversation opens separately after the traveller clicks the ad.</p>
        </div> : <div>
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-emerald-50 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white"><Bot className="h-5 w-5" /></div>
            <div><div className="text-sm font-bold text-slate-900">{brand.name} sponsored agent</div><div className="text-[10px] text-slate-500">Separate conversation · simulated {mode === 'scripted' ? '· scripted responses' : mode === 'ai' ? '· AI responses' : ''}</div></div>
          </div>
          <div className="max-h-[470px] min-h-72 space-y-3 overflow-y-auto p-5" role="log" aria-live="polite">
            {messages.map((message, index) => message.role === 'user' ? (
              <div key={index} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-violet-600 p-3 text-xs leading-relaxed text-white">{message.text}</div>
            ) : (
              <div key={index} className="max-w-[85%] space-y-2">
                <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-slate-100 p-3 text-xs leading-relaxed text-slate-700">{message.text}</div>
                {message.recommendation && <div className="ml-1 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Recommended page for this answer</div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                      Verified from live website
                    </span>
                  </div>
                  {message.recommendation.title && <div className="mt-1.5 text-[11px] font-bold text-slate-800">{message.recommendation.title}</div>}
                  {message.recommendation.reason && <p className="mt-1 text-[10px] leading-relaxed text-slate-600">{message.recommendation.reason}</p>}
                  <a href={message.recommendation.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                    <Sparkles className="h-3.5 w-3.5" />{message.recommendation.label}<ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <div className="mt-1.5 max-w-full truncate text-[9px] text-slate-500" title={message.recommendation.url}>{message.recommendation.url}</div>
                </div>}
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500">Preparing a response…</div>}
          </div>
          <div className="space-y-3 border-t border-slate-100 p-4">
            <div className="flex flex-wrap gap-2">{followUpsFor(`${initialQuery} ${messages.map(message => message.text).join(' ')}`).map(question => <button key={question} onClick={() => send(question)} disabled={busy} className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-left text-[11px] font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">{question}</button>)}</div>
            <form onSubmit={event => { event.preventDefault(); send(draft); }} className="flex gap-2">
              <input aria-label="Traveller's question" value={draft} onChange={event => setDraft(event.target.value)} maxLength={800} placeholder="Ask as the traveller…" className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-xs" />
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Send question" className="rounded-xl bg-violet-600 px-4 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </form>
            {error && <div role="status" className={`rounded-xl border px-3 py-2 text-xs ${mode === 'scripted' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{error}</div>}
            <p className="text-[10px] text-slate-500">Preview only. A recommended page appears only when live AI searches the official brand domain and returns a verified source. Scripted responses do not recommend a page. Prices, availability, inclusions and policies still need confirmation on the linked page.</p>
          </div>
        </div>}
      </div>
    </div>
  </div>;
};
