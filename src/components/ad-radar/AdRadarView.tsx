import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Eye, FileText, ShieldCheck, Sparkles, Target, Upload, WandSparkles } from 'lucide-react';
import { BrandProfile, PromptItem } from '../../types';
import { CONVERSATIONAL_AD_JOURNEYS } from '../../data/adRadarData';
import { GoogleAdsCampaignImport, GoogleAdsImport, GoogleAdsLandingPageImport, GoogleAdsTimeSeriesImport, parseGoogleAdsCampaigns, parseGoogleAdsLandingPages, parseGoogleAdsSearchTerms, parseGoogleAdsTimeSeries } from '../../utils/googleAdsImport';
import { SponsoredAgentSimulator } from './SponsoredAgentSimulator';

type Tab = 'google-ads' | 'observations' | 'scenarios' | 'opportunities' | 'readiness' | 'creative' | 'agent';
interface SponsoredObservation { id: string; prompt: string; sponsor: string; placement: string; followUp: string; market: string; evidence: string; status: 'Pending test' | 'Verified' | 'Needs review' | 'No sponsored ad'; observedAt: string; }
interface Props { brand: BrandProfile; prompts: PromptItem[]; }

export const AdRadarView: React.FC<Props> = ({ brand, prompts }) => {
  const [tab, setTab] = useState<Tab>('google-ads');
  const [adsData, setAdsData] = useState<GoogleAdsImport | null>(() => {
    try { return JSON.parse(localStorage.getItem('ecolens_google_ads_search_terms') || 'null'); } catch { return null; }
  });
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [campaignData, setCampaignData] = useState<GoogleAdsCampaignImport | null>(() => {
    try { return JSON.parse(localStorage.getItem('ecolens_google_ads_campaigns') || 'null'); } catch { return null; }
  });
  const [timeSeries, setTimeSeries] = useState<GoogleAdsTimeSeriesImport | null>(() => {
    try { return JSON.parse(localStorage.getItem('ecolens_google_ads_timeseries') || 'null'); } catch { return null; }
  });
  const [landingPages, setLandingPages] = useState<GoogleAdsLandingPageImport | null>(() => {
    try { return JSON.parse(localStorage.getItem('ecolens_google_ads_landing_pages') || 'null'); } catch { return null; }
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState(CONVERSATIONAL_AD_JOURNEYS[0].id);
  const tracked = prompts.filter(prompt => prompt.selected !== false);
  const [selectedId, setSelectedId] = useState(tracked[0]?.id || '');
  const selected = tracked.find(prompt => prompt.id === selectedId) || tracked[0];
  const [generated, setGenerated] = useState(false);
  const [observations, setObservations] = useState<SponsoredObservation[]>(() => {
    try { return JSON.parse(localStorage.getItem('ecolens_sponsored_agent_observations') || '[]'); } catch { return []; }
  });
  const [observationDraft, setObservationDraft] = useState({ prompt: '', sponsor: '', placement: 'Sponsored Agent', followUp: '', market: 'United States', evidence: '' });
  const [customMonitoringPrompt, setCustomMonitoringPrompt] = useState('');
  const [monitoringSelection, setMonitoringSelection] = useState('');
  const monitoringStepRef = useRef<HTMLElement | null>(null);
  const saveObservation = () => {
    if (!observationDraft.prompt.trim() || !observationDraft.sponsor.trim()) return;
    const next: SponsoredObservation[] = [{ id: crypto.randomUUID(), ...observationDraft, status: observationDraft.evidence.trim() ? 'Verified' : 'Needs review', observedAt: new Date().toISOString() }, ...observations.filter(item => item.status !== 'Pending test')];
    setObservations(next); localStorage.setItem('ecolens_sponsored_agent_observations', JSON.stringify(next));
    setObservationDraft({ prompt: '', sponsor: '', placement: 'Sponsored Agent', followUp: '', market: 'United States', evidence: '' });
  };
  const saveNoSponsoredAd = () => {
    if (!observationDraft.prompt.trim()) return;
    const next: SponsoredObservation[] = [{ id: crypto.randomUUID(), ...observationDraft, sponsor: 'None observed', evidence: '', status: 'No sponsored ad', observedAt: new Date().toISOString() }, ...observations.filter(item => item.status !== 'Pending test')];
    setObservations(next); localStorage.setItem('ecolens_sponsored_agent_observations', JSON.stringify(next));
    setObservationDraft({ prompt: '', sponsor: '', placement: 'Sponsored Agent', followUp: '', market: 'United States', evidence: '' });
    setCustomMonitoringPrompt('');
    setMonitoringSelection('Saved as “No sponsored ad”. Choose another prompt to continue.');
  };

  const importGoogleAds = async (file?: File) => {
    if (!file) return;
    setImporting(true); setImportError('');
    try {
      const parsed = parseGoogleAdsSearchTerms(await file.text(), file.name);
      setAdsData(parsed);
      localStorage.setItem('ecolens_google_ads_search_terms', JSON.stringify(parsed));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'The CSV could not be imported.');
    } finally { setImporting(false); }
  };
  const importCampaigns = async (file?: File) => {
    if (!file) return;
    setImporting(true); setImportError('');
    try { const parsed = parseGoogleAdsCampaigns(await file.text(), file.name); setCampaignData(parsed); localStorage.setItem('ecolens_google_ads_campaigns', JSON.stringify(parsed)); }
    catch (error) { setImportError(error instanceof Error ? error.message : 'The campaign CSV could not be imported.'); }
    finally { setImporting(false); }
  };
  const importTimeSeries = async (file?: File) => {
    if (!file) return;
    setImporting(true); setImportError('');
    try { const parsed = parseGoogleAdsTimeSeries(await file.text(), file.name); setTimeSeries(parsed); localStorage.setItem('ecolens_google_ads_timeseries', JSON.stringify(parsed)); }
    catch (error) { setImportError(error instanceof Error ? error.message : 'The time-series CSV could not be imported.'); }
    finally { setImporting(false); }
  };
  const importLandingPages = async (file?: File) => {
    if (!file) return;
    setImporting(true); setImportError('');
    try { const parsed = parseGoogleAdsLandingPages(await file.text(), file.name); setLandingPages(parsed); localStorage.setItem('ecolens_google_ads_landing_pages', JSON.stringify(parsed)); }
    catch (error) { setImportError(error instanceof Error ? error.message : 'The landing-page CSV could not be imported.'); }
    finally { setImporting(false); }
  };

  const opportunityScore = (prompt: PromptItem) => {
    let score = prompt.intent === 'commercial' ? 35 : 20;
    if (!prompt.brandMentioned) score += 35;
    if (prompt.estimatedVolume === 'High') score += 25;
    else if (prompt.estimatedVolume === 'Medium') score += 15;
    return Math.min(score, 95);
  };
  const opportunities = useMemo(() => [...tracked].sort((a, b) => opportunityScore(b) - opportunityScore(a)).slice(0, 8), [prompts]);
  const sponsoredSeeds = useMemo(() => {
    const promptSeeds = tracked.slice(0, 30).map(item => ({ id: `prompt-${item.id}`, text: item.text, source: 'Tracked prompt' }));
    const querySeeds = (adsData?.rows || []).filter(item => /book|booking|hire|reserve|best|compare|private tour|tour guide|local guide/i.test(item.query)).sort((a, b) => (b.conversions * 30 + b.clicks) - (a.conversions * 30 + a.clicks)).slice(0, 30).map((item, index) => ({ id: `query-${index}-${item.query}`, text: item.query, source: 'Google Ads search term' }));
    const seen = new Set<string>();
    return [...promptSeeds, ...querySeeds].filter(item => { const key = item.text.toLowerCase().trim(); if (seen.has(key)) return false; seen.add(key); return true; });
  }, [tracked, adsData]);
  const useSponsoredSeed = (text: string, source = 'Prompt') => {
    const clean = text.trim();
    if (!clean) return;
    setObservationDraft(current => ({ ...current, prompt: clean, followUp: buildSponsoredFollowUp(clean) }));
    setCustomMonitoringPrompt(clean);
    setMonitoringSelection(`${source} selected. Step 2 is ready.`);
    setObservations(current => [{
      id: 'pending-sponsored-test',
      prompt: clean,
      sponsor: 'Awaiting ChatGPT check',
      placement: 'Placement not checked yet',
      followUp: buildSponsoredFollowUp(clean),
      market: 'United States',
      evidence: '',
      status: 'Pending test',
      observedAt: new Date().toISOString(),
    }, ...current.filter(item => item.status !== 'Pending test')]);
    requestAnimationFrame(() => monitoringStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <header className="rounded-3xl bg-gradient-to-r from-[#11162E] via-[#28205D] to-[#53127A] p-6 text-white shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div><div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B9AEFF]">EchoLens Paid Media Lab</div><h1 className="text-2xl font-bold mt-2">Paid Media Intelligence</h1><p className="text-xs text-white/65 mt-2 max-w-2xl leading-relaxed">Connect real Google Ads search demand to AI prompt opportunities, campaign actions and conversation-ready creative.</p></div>
        <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold">{adsData ? `${adsData.rowCount.toLocaleString()} search terms imported` : 'Google Ads data not imported'}</div>
      </div>
    </header>

    <nav className="flex gap-2 overflow-x-auto pb-1">
      {([
        ['google-ads', 'Google Ads data', Upload],
        ['observations', 'Sponsored Agent monitor', Eye],
        ['scenarios', 'Competitive scenarios', AlertTriangle],
        ['opportunities', 'Conversation opportunities', Target],
        ['readiness', 'Ad readiness', ShieldCheck],
        ['creative', 'Creative studio', WandSparkles],
        ['agent', 'Sponsored agent simulator', Bot],
      ] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer ${tab === id ? 'bg-violet-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'}`}><Icon className="w-4 h-4" />{label}</button>)}
    </nav>

    {tab === 'google-ads' && <GoogleAdsPanel data={adsData} campaigns={campaignData} timeSeries={timeSeries} landingPages={landingPages} importing={importing} error={importError} onImport={importGoogleAds} onCampaignImport={importCampaigns} onTimeSeriesImport={importTimeSeries} onLandingPageImport={importLandingPages} />}

    {tab === 'observations' && <div className="space-y-5">
      <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-emerald-50 p-5"><div className="text-[10px] uppercase tracking-wider font-bold text-violet-700">Based on OpenAI's Sponsored Agents model</div><h2 className="text-lg font-bold text-slate-950 mt-1">Track observed conversational ads separately from organic AI answers</h2><p className="text-[11px] text-slate-600 leading-relaxed mt-2 max-w-3xl">A Sponsored Agent starts after a user clicks a clearly labeled ad and opens a separate business-sponsored conversation. Record evidence here only when an ad label, sponsored business and placement can be observed.</p><div className="flex gap-3 mt-3 text-[10px] font-bold"><a className="text-violet-700 hover:underline" href="https://openai.com/index/reimagining-advertising-with-ai/" target="_blank" rel="noreferrer">OpenAI announcement</a><a className="text-violet-700 hover:underline" href="https://searchengineland.com/openai-is-turning-chatgpt-ads-into-conversations-488949" target="_blank" rel="noreferrer">Article</a></div></section>
      {observationDraft.prompt && <section role="status" className="rounded-2xl border border-violet-300 bg-white px-5 py-4 shadow-sm"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="text-[9px] uppercase tracking-wider font-bold text-emerald-600">Prompt selected · test in progress</div><div className="text-xs font-bold text-slate-900 mt-1">{observationDraft.prompt}</div><div className="text-[10px] text-slate-500 mt-1">Next: open ChatGPT in Step 2, then record what you observed in Step 3. Selecting a prompt alone does not create an observation.</div></div><button onClick={() => window.scrollBy({ top: 520, behavior: 'smooth' })} className="px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold whitespace-nowrap">Continue to Step 2</button></div></section>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-4 space-y-4"><section className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[9px] uppercase tracking-wider font-bold text-violet-600">Step 1</div><h3 className="text-sm font-bold mt-1">Enter any prompt</h3><p className="text-[10px] text-slate-500 mt-1">Type your own prompt, or choose one of the suggestions below.</p><textarea value={customMonitoringPrompt} onChange={event => setCustomMonitoringPrompt(event.target.value)} rows={3} placeholder="e.g. What is the best website to book a private tour guide in Rome?" className="w-full mt-3 p-3 rounded-xl border border-slate-200 text-xs resize-none" /><button onClick={() => { useSponsoredSeed(customMonitoringPrompt); setCustomMonitoringPrompt(''); }} disabled={!customMonitoringPrompt.trim()} className="w-full mt-2 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold disabled:opacity-40">Use this prompt</button><div className="mt-4 pt-4 border-t border-slate-100"><div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Suggested from your data</div><div className="mt-2 max-h-44 overflow-y-auto space-y-1.5">{sponsoredSeeds.length ? sponsoredSeeds.map(seed => <button key={seed.id} onClick={() => useSponsoredSeed(seed.text)} className={`w-full text-left p-2.5 rounded-xl border cursor-pointer ${observationDraft.prompt === seed.text ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-200'}`}><div className="text-[9px] uppercase tracking-wider font-bold text-violet-600">{seed.source}</div><div className="text-[10px] font-semibold text-slate-700 mt-1 line-clamp-2">{seed.text}</div></button>) : <p className="text-[10px] text-slate-400 p-3">No suggested prompts yet.</p>}</div></div></section><section className="bg-white rounded-2xl border border-slate-200 p-5"><div className="text-[9px] uppercase tracking-wider font-bold text-violet-600">Step 2</div><h3 className="text-sm font-bold mt-1">Open the real ChatGPT</h3><div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-800 leading-relaxed"><strong>EcoLens cannot show ChatGPT ads itself.</strong> This button opens ChatGPT so you can check whether your account receives a clearly labeled sponsored ad.</div><div className="space-y-3 mt-4"><Field label="Prompt to test" value={observationDraft.prompt} onChange={value => setObservationDraft({ ...observationDraft, prompt: value })} /><Field label="Optional follow-up" value={observationDraft.followUp} onChange={value => setObservationDraft({ ...observationDraft, followUp: value })} /><a href={observationDraft.prompt ? `https://chatgpt.com/?q=${encodeURIComponent(observationDraft.prompt)}` : undefined} target="_blank" rel="noreferrer" onClick={() => observationDraft.prompt && navigator.clipboard.writeText(`${observationDraft.prompt}\n\n${observationDraft.followUp}`)} className={`w-full py-2.5 rounded-xl text-center text-xs font-bold block ${observationDraft.prompt ? 'bg-[#101010] text-white cursor-pointer' : 'bg-slate-100 text-slate-400 pointer-events-none'}`}>Open in ChatGPT</a><div className="text-[9px] uppercase tracking-wider font-bold text-slate-400 pt-2">Step 3 · What did you see?</div><button onClick={saveNoSponsoredAd} disabled={!observationDraft.prompt} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold disabled:opacity-40">I did not see a sponsored ad</button><div className="pt-3 mt-3 border-t border-slate-100"><div className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">I saw a clearly labeled sponsored ad</div><div className="space-y-3 mt-3"><Field label="Advertiser name (e.g. Viator)" value={observationDraft.sponsor} onChange={value => setObservationDraft({ ...observationDraft, sponsor: value })} /><label className="block"><span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">What appeared?</span><select value={observationDraft.placement} onChange={event => setObservationDraft({ ...observationDraft, placement: event.target.value })} className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 text-xs bg-white"><option>Sponsored Agent</option><option>Sponsored card</option><option>Sponsored follow-up</option><option>Conversational text customization</option></select></label><Field label="Screenshot filename or evidence link" value={observationDraft.evidence} onChange={value => setObservationDraft({ ...observationDraft, evidence: value })} /><button onClick={saveObservation} disabled={!observationDraft.prompt.trim() || !observationDraft.sponsor.trim()} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-40">Save what I saw</button></div></div></div></section></div>
        <section className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-5 border-b border-slate-100"><h3 className="text-sm font-bold">Observed competitor placements</h3><p className="text-[10px] text-slate-500 mt-1">{observations.length ? `${observations.length} saved observations` : 'No verified observations yet. Simulated scenarios are kept in a separate tab.'}</p></div>{observations.length ? <div className="divide-y divide-slate-100">{observations.map(item => <div key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-slate-900">{item.sponsor} · {item.placement}</div><p className="text-[11px] text-slate-700 mt-2">{item.prompt}</p>{item.followUp && <p className="text-[10px] text-slate-500 mt-1">Follow-up: {item.followUp}</p>}<p className="text-[9px] text-slate-400 mt-2">{item.market} · {new Date(item.observedAt).toLocaleDateString()} · {item.evidence || 'Evidence not attached'}</p></div><span className={`px-2 py-1 rounded-full text-[9px] font-bold ${item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span></div></div>)}</div> : <Empty icon={<Eye className="w-7 h-7" />} text="Add the first observed Sponsored Agent or conversational ad. Organic mentions and citations belong in Prompt Snapshots, not here." />}</section>
      </div>
    </div>}

    {tab === 'scenarios' && (() => {
      const scenario = CONVERSATIONAL_AD_JOURNEYS.find(item => item.id === selectedScenarioId) || CONVERSATIONAL_AD_JOURNEYS[0];
      return <div className="space-y-4">
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-[11px] text-violet-800"><strong>Simulated competitive scenario:</strong> this illustrates how a sponsored placement could interrupt a multi-turn journey. It is not a live detection or competitor-performance claim.</div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
            {CONVERSATIONAL_AD_JOURNEYS.map(item => <button key={item.id} onClick={() => setSelectedScenarioId(item.id)} className={`w-full p-3 rounded-xl border text-left cursor-pointer ${item.id === scenario.id ? 'border-violet-400 bg-violet-50' : 'border-slate-200 hover:border-violet-200'}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-rose-700 bg-rose-50 rounded-full px-2 py-0.5">{item.adType}</span><span className="text-[10px] text-slate-400">Turn {item.adInterventionTurn}</span></div><p className="text-xs font-bold text-slate-800 mt-2 line-clamp-2">{item.initialPrompt}</p><p className="text-[10px] text-slate-500 mt-1">Scenario sponsor: <strong>{item.adSponsor}</strong></p></button>)}
          </div>
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100"><div><div className="text-[10px] uppercase tracking-wider font-bold text-violet-600">{scenario.engine} · {scenario.country}</div><h2 className="text-base font-bold text-slate-950 mt-1">{scenario.initialPrompt}</h2></div><span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">Potential diversion at turn {scenario.adInterventionTurn}</span></div>
            <div className="mt-5 space-y-4">{scenario.turns.map(turn => <div key={turn.turnNumber} className="relative pl-7"><div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center">{turn.turnNumber}</div><div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">User</div><p className="text-xs font-semibold text-slate-800 mt-1">{turn.userQuery}</p></div><div className="mt-2 text-xs text-slate-600 leading-relaxed">{turn.aiResponseSummary}</div>{turn.adDetected && <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700"><Bot className="w-3.5 h-3.5" />Sponsored intervention scenario</div><h3 className="text-sm font-bold text-slate-900 mt-2">{turn.adDetected.headline}</h3><p className="text-[11px] text-slate-600 mt-1">Sponsored by {turn.adDetected.sponsor} · {turn.adDetected.placement}</p><div className="flex flex-wrap gap-1.5 mt-3">{turn.adDetected.contextHints.map(hint => <span key={hint} className="px-2 py-1 rounded-md bg-white border border-amber-200 text-[10px] text-amber-800">{hint}</span>)}</div></div>}</div>)}</div>
            <div className="mt-5 rounded-xl bg-[#12182F] text-white p-4"><div className="text-[10px] uppercase tracking-wider font-bold text-[#B9AEFF]">Recommended defense</div><p className="text-xs leading-relaxed text-white/80 mt-1.5">{scenario.strategicImpact.counterStrategy}</p></div>
          </div>
        </div>
      </div>;
    })()}

    {tab === 'opportunities' && <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Metric label="Tracked prompts" value={tracked.length} /><Metric label="Commercial journeys" value={tracked.filter(p => p.intent === 'commercial').length} /><Metric label="Mention gaps" value={tracked.filter(p => !p.brandMentioned).length} /></div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="text-sm font-bold">Prioritized conversation opportunities</h2><p className="text-[11px] text-slate-500 mt-1">Priority combines intent, estimated volume and whether the brand is absent.</p></div><div className="divide-y divide-slate-100">{opportunities.map(prompt => <button key={prompt.id} onClick={() => { setSelectedId(prompt.id); setTab('creative'); setGenerated(false); }} className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-violet-50/30 cursor-pointer"><div className="min-w-0"><div className="text-sm font-bold text-slate-900 truncate">{prompt.text}</div><div className="flex gap-2 mt-1 text-[10px] text-slate-500"><span>{prompt.category}</span><span>•</span><span>{prompt.intent}</span><span>•</span><span>{prompt.brandMentioned ? 'Brand mentioned' : 'Mention gap'}</span></div></div><div className="flex items-center gap-3 shrink-0"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${opportunityScore(prompt) >= 70 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{opportunityScore(prompt)} opportunity</span><ArrowRight className="w-4 h-4 text-violet-500" /></div></button>)}</div></div>
    </div>}

    {tab === 'readiness' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5"><h2 className="text-sm font-bold">Brand inputs available</h2><div className="mt-4 space-y-3">{[['Brand identity', brand.name], ['Destination URL', brand.domain], ['Brand description', brand.description], ['Primary category', brand.category]].map(([label, value]) => <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /><div><div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">{label}</div><div className="text-xs text-slate-700 mt-0.5">{value}</div></div></div>)}</div></div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5"><h2 className="text-sm font-bold">Before a live launch</h2><div className="mt-4 space-y-3">{['Connect an approved ad account', 'Confirm cancellation and refund facts', 'Provide approved brand claims and prohibited claims', 'Define conversion event and campaign budget'].map(item => <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100"><span className="w-4 h-4 rounded-full border-2 border-amber-400" /><span className="text-xs font-semibold text-slate-700">{item}</span></div>)}</div></div>
    </div>}

    {tab === 'creative' && <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source prompt</label><select value={selected?.id || ''} onChange={e => { setSelectedId(e.target.value); setGenerated(false); }} className="w-full mt-2 p-3 rounded-xl border border-slate-200 text-xs bg-white">{tracked.map(p => <option key={p.id} value={p.id}>{p.text}</option>)}</select><button onClick={() => setGenerated(true)} disabled={!selected} className="w-full mt-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" />Generate creative direction</button></div>
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5">{generated && selected ? <div className="space-y-4"><Output label="Conversation intent" value={`${selected.intent} intent around ${selected.category}`} /><Output label="Ad title" value={`${brand.name}: A clearer way to choose ${selected.category}`} /><Output label="Ad copy" value={`Compare options with confidence. Explore ${brand.name}, understand what is included, and find the right fit for your needs.`} /><Output label="Conversation starter" value={`Ask ${brand.name} about availability, customization, trust signals and cancellation before you decide.`} /><Output label="Landing-page recommendation" value={`Create or improve a focused page answering: “${selected.text}” with comparison facts, reviews, policies and a clear next step.`} /></div> : <Empty icon={<FileText className="w-7 h-7" />} text="Choose a tracked prompt and generate a campaign-ready creative direction." />}</div>
    </div>}

    {tab === 'agent' && <SponsoredAgentSimulator brand={brand} prompts={prompts} searchTerms={adsData} landingPages={landingPages} />}
  </div>;
};

const Metric = ({ label, value }: { label: string; value: number }) => <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</div><div className="text-2xl font-bold text-slate-950 mt-2">{value}</div></div>;
const Output = ({ label, value }: { label: string; value: string }) => <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60"><div className="text-[10px] uppercase tracking-wider font-bold text-violet-600">{label}</div><div className="text-xs leading-relaxed text-slate-700 mt-1.5">{value}</div></div>;
const Empty = ({ icon, text }: { icon: React.ReactNode; text: string }) => <div className="min-h-72 flex flex-col items-center justify-center text-center text-slate-400 px-6">{icon}<p className="text-xs mt-3 max-w-sm">{text}</p></div>;

const GoogleAdsPanel = ({ data, campaigns, timeSeries, landingPages, importing, error, onImport, onCampaignImport, onTimeSeriesImport, onLandingPageImport }: { data: GoogleAdsImport | null; campaigns: GoogleAdsCampaignImport | null; timeSeries: GoogleAdsTimeSeriesImport | null; landingPages: GoogleAdsLandingPageImport | null; importing: boolean; error: string; onImport: (file?: File) => void; onCampaignImport: (file?: File) => void; onTimeSeriesImport: (file?: File) => void; onLandingPageImport: (file?: File) => void }) => {
  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: data?.currency || 'USD', maximumFractionDigits: 0 }).format(value);
  const pct = (value: number) => `${value.toFixed(1)}%`;
  const waste = data?.rows.filter(row => row.cost >= 100 && row.conversions === 0).sort((a, b) => b.cost - a.cost).slice(0, 12) || [];
  const winners = data?.rows.filter(row => row.conversions > 0).sort((a, b) => b.conversions - a.conversions).slice(0, 12) || [];
  const highIntent = data?.rows.filter(row => /book|booking|hire|reserve|private tour|tour guide|local guide/i.test(row.query)).sort((a, b) => b.clicks - a.clicks).slice(0, 12) || [];
  const campaignTotals = campaigns?.campaigns.reduce((totals, row) => ({ cost: totals.cost + row.cost, conversions: totals.conversions + row.conversions, value: totals.value + row.conversionValue }), { cost: 0, conversions: 0, value: 0 });
  const campaignRisks = campaigns?.campaigns.filter(row => row.cost > 0).sort((a, b) => (b.cost / Math.max(b.conversions, .1)) - (a.cost / Math.max(a.conversions, .1))).slice(0, 10) || [];
  return <div className="space-y-5">
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div><h2 className="text-sm font-bold text-slate-950">Google Ads data sources</h2><p className="text-[11px] text-slate-500 mt-1">Upload exports directly from Google Ads. Each source adds a different layer of analysis.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
        <UploadSource title="Search terms" detail={data ? `${data.rowCount.toLocaleString()} queries · ${data.fileName}` : 'Query, cost and conversion intent'} loaded={!!data} importing={importing} onFile={onImport} />
        <UploadSource title="Campaign report" detail={campaigns ? `${campaigns.campaigns.length.toLocaleString()} campaigns · ${campaigns.fileName}` : 'Budget, bidding and impression share'} loaded={!!campaigns} importing={importing} onFile={onCampaignImport} />
        <UploadSource title="Impressions trend" detail={timeSeries ? `${timeSeries.points.length} days · ${timeSeries.fileName}` : 'Daily visibility trend'} loaded={!!timeSeries} importing={importing} onFile={onTimeSeriesImport} />
        <UploadSource title="Landing pages" detail={landingPages ? `${landingPages.pages.length.toLocaleString()} canonical pages · ${landingPages.fileName}` : 'URL, traffic and spend'} loaded={!!landingPages} importing={importing} onFile={onLandingPageImport} />
      </div>
      {error && <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-700">{error}</div>}
      {data && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-slate-500"><span><strong className="text-slate-700">File:</strong> {data.fileName}</span><span><strong className="text-slate-700">Period:</strong> {data.period}</span><span><strong className="text-slate-700">Campaigns:</strong> {data.campaignCount.toLocaleString()}</span></div>}
    </section>

    {campaigns && campaignTotals && <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <DataMetric label="Campaigns" value={campaigns.campaigns.length.toLocaleString()} />
        <DataMetric label="Campaign spend" value={money(campaignTotals.cost)} />
        <DataMetric label="Campaign conversions" value={campaignTotals.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <DataMetric label="Conversion value" value={money(campaignTotals.value)} />
        <DataMetric label="ROAS" value={campaignTotals.cost ? `${(campaignTotals.value / campaignTotals.cost).toFixed(2)}×` : '—'} />
      </div>
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold">Campaigns needing review</h3><p className="text-[10px] text-slate-500 mt-1">Prioritized by high spend relative to conversions. Impression-share losses show whether budget or rank is limiting reach.</p></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-400"><tr><th className="p-3">Campaign</th><th className="p-3">Type</th><th className="p-3">Cost</th><th className="p-3">Conv.</th><th className="p-3">Lost budget</th><th className="p-3">Lost rank</th></tr></thead><tbody className="divide-y divide-slate-100">{campaignRisks.map(row => <tr key={row.name} className="text-[11px]"><td className="p-3 font-semibold text-slate-800 max-w-md">{row.name}</td><td className="p-3 text-slate-500">{row.type}</td><td className="p-3 font-bold">{money(row.cost)}</td><td className="p-3">{row.conversions.toFixed(1)}</td><td className="p-3">{row.lostBudgetShare || '—'}</td><td className="p-3">{row.lostRankShare || '—'}</td></tr>)}</tbody></table></div></section>
    </>}

    {landingPages && <LandingPagePanel data={landingPages} />}

    {!data ? <div className="bg-white rounded-2xl border border-dashed border-violet-300 min-h-80"><Empty icon={<Upload className="w-8 h-8" />} text="Upload a Google Ads Search terms report to replace the prototype with real paid-media intelligence." /></div> : <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <DataMetric label="Search terms" value={data.rowCount.toLocaleString()} />
        <DataMetric label="Impressions" value={data.impressions.toLocaleString()} />
        <DataMetric label="Clicks" value={data.clicks.toLocaleString()} />
        <DataMetric label="Spend" value={money(data.cost)} />
        <DataMetric label="Conversions" value={data.conversions.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
        <DataMetric label="CPA" value={data.conversions ? money(data.cost / data.conversions) : '—'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <InsightTable title="Conversion drivers" subtitle="Queries producing the most conversions" rows={winners} value={row => `${row.conversions.toFixed(1)} conv.`} tone="emerald" />
        <InsightTable title="Spend without conversion" subtitle="Review negatives, match type and landing page" rows={waste} value={row => money(row.cost)} tone="rose" />
        <InsightTable title="High-intent AI seeds" subtitle="Real paid queries worth tracking as AI prompts" rows={highIntent} value={row => `${row.clicks.toLocaleString()} clicks`} tone="violet" />
      </div>
      <section className="rounded-2xl bg-[#12182F] text-white p-5">
        <div className="text-[10px] uppercase tracking-[.16em] font-bold text-[#9DF2CD]">What EcoLens can do with this file</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Action title="Protect performance" text={`${waste.length} visible high-spend queries need a negative-keyword, targeting or landing-page review.`} />
          <Action title="Expand AI tracking" text="Turn high-intent search terms into tracked prompts and follow-up questions for US and Canada." />
          <Action title="Build better creative" text={`Use actual CTR (${pct(data.impressions ? data.clicks / data.impressions * 100 : 0)}) and conversion signals to prioritize messages, not simulated competitor claims.`} />
        </div>
      </section>
    </>}
  </div>;
};

const DataMetric = ({ label, value }: { label: string; value: string }) => <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[9px] uppercase tracking-wider font-bold text-slate-400">{label}</div><div className="text-lg font-bold text-slate-950 mt-2 truncate">{value}</div></div>;
const InsightTable = ({ title, subtitle, rows, value, tone }: { title: string; subtitle: string; rows: GoogleAdsImport['rows']; value: (row: GoogleAdsImport['rows'][number]) => string; tone: 'emerald' | 'rose' | 'violet' }) => <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold">{title}</h3><p className="text-[10px] text-slate-500 mt-1">{subtitle}</p></div><div className="divide-y divide-slate-100 max-h-[430px] overflow-y-auto">{rows.length ? rows.map((row, index) => <div key={`${row.query}-${index}`} className="p-3"><div className="flex gap-3 justify-between"><span className="text-[11px] font-semibold text-slate-800 leading-snug">{row.query}</span><span className={`shrink-0 text-[10px] font-bold ${tone === 'emerald' ? 'text-emerald-700' : tone === 'rose' ? 'text-rose-700' : 'text-violet-700'}`}>{value(row)}</span></div><div className="text-[9px] text-slate-400 mt-1 truncate">{row.campaign}</div></div>) : <div className="p-5 text-[11px] text-slate-400">No matching rows in the retained data.</div>}</div></section>;
const Action = ({ title, text }: { title: string; text: string }) => <div className="rounded-xl bg-white/7 border border-white/10 p-4"><div className="text-xs font-bold">{title}</div><p className="text-[11px] text-white/65 leading-relaxed mt-2">{text}</p></div>;
const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <label className="block"><span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">{label}</span><input value={value} onChange={event => onChange(event.target.value)} className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-200 text-xs" /></label>;
const buildSponsoredFollowUp = (seed: string) => {
  const lower = seed.toLowerCase();
  if (/cancel|refund/.test(lower)) return 'Which provider has the safest cancellation and refund policy?';
  if (/review|trust|reliable|best/.test(lower)) return 'Can you compare the most trusted providers and explain why you recommend them?';
  if (/price|cost|cheap|affordable/.test(lower)) return 'Which option offers the best value after fees and cancellation terms?';
  if (/rome|italy/.test(lower)) return 'Can you recommend a verified private local guide in Rome and help me compare booking options?';
  return 'Which provider should I choose, and can I ask them questions before booking?';
};
const UploadSource = ({ title, detail, loaded, importing, onFile }: { title: string; detail: string; loaded: boolean; importing: boolean; onFile: (file?: File) => void }) => <div className={`rounded-xl border p-3 ${loaded ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/60'}`}><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold text-slate-800">{title}</div><p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{detail}</p></div>{loaded && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}</div><label className="inline-flex mt-3 items-center gap-1.5 text-[10px] font-bold text-violet-700 cursor-pointer"><Upload className="w-3.5 h-3.5" />{loaded ? 'Replace file' : 'Choose CSV'}<input type="file" accept=".csv,text/csv" className="hidden" disabled={importing} onChange={event => onFile(event.target.files?.[0])} /></label></div>;

const LandingPagePanel = ({ data }: { data: GoogleAdsLandingPageImport }) => {
  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: data.currency || 'USD', maximumFractionDigits: 0 }).format(value);
  const totals = data.pages.reduce((sum, page) => ({ clicks: sum.clicks + page.clicks, impressions: sum.impressions + page.impressions, cost: sum.cost + page.cost }), { clicks: 0, impressions: 0, cost: 0 });
  const automatic = data.pages.filter(page => page.selectedBy === 'AUTOMATIC').length;
  const opportunities = data.pages.filter(page => page.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 15);
  return <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="p-5 border-b border-slate-100"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold">Landing-page intelligence</h3><p className="text-[10px] text-slate-500 mt-1">Tracking parameters are removed before URLs are grouped, preventing duplicate-page counts.</p></div><span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">Conversion columns not provided</span></div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4"><DataMetric label="Source rows" value={data.rowCount.toLocaleString()} /><DataMetric label="Canonical pages" value={data.pages.length.toLocaleString()} /><DataMetric label="Clicks" value={totals.clicks.toLocaleString()} /><DataMetric label="Spend" value={money(totals.cost)} /><DataMetric label="Automatic URLs" value={automatic.toLocaleString()} /></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-400"><tr><th className="p-3">Landing page</th><th className="p-3">Selected by</th><th className="p-3">Impressions</th><th className="p-3">Clicks</th><th className="p-3">CTR</th><th className="p-3">Cost</th><th className="p-3">Recommended action</th></tr></thead><tbody className="divide-y divide-slate-100">{opportunities.map(page => { const ctr = page.impressions ? page.clicks / page.impressions * 100 : 0; return <tr key={page.url} className="text-[10px]"><td className="p-3 max-w-sm"><a href={page.url} target="_blank" rel="noreferrer" className="font-semibold text-violet-700 hover:underline break-all">{page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}</a></td><td className="p-3 text-slate-500">{page.selectedBy}</td><td className="p-3">{page.impressions.toLocaleString()}</td><td className="p-3">{page.clicks.toLocaleString()}</td><td className="p-3">{ctr.toFixed(1)}%</td><td className="p-3 font-bold">{money(page.cost)}</td><td className="p-3 text-slate-600 max-w-xs">{page.selectedBy === 'AUTOMATIC' ? 'Review Final URL Expansion relevance and add an exclusion if the page does not match the query.' : ctr < 2 ? 'Review ad-to-page message match and page relevance.' : 'Add conversion data before changing this page.'}</td></tr>; })}</tbody></table></div>
  </section>;
};
