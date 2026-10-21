export interface GoogleAdsSearchTerm {
  query: string;
  campaign: string;
  adGroup: string;
  matchType: string;
  campaignType: string;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
}

export interface GoogleAdsImport {
  fileName: string;
  period: string;
  importedAt: string;
  rowCount: number;
  campaignCount: number;
  currency: string;
  clicks: number;
  impressions: number;
  cost: number;
  conversions: number;
  rows: GoogleAdsSearchTerm[];
}

export interface GoogleAdsCampaign {
  name: string;
  type: string;
  status: string;
  budget: number;
  bidStrategy: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  impressionShare: string;
  lostBudgetShare: string;
  lostRankShare: string;
}

export interface GoogleAdsCampaignImport {
  fileName: string;
  period: string;
  importedAt: string;
  currency: string;
  campaigns: GoogleAdsCampaign[];
}

export interface GoogleAdsTimeSeriesImport {
  fileName: string;
  importedAt: string;
  points: { date: string; impressions: number }[];
}

export interface GoogleAdsLandingPage {
  url: string;
  selectedBy: string;
  clicks: number;
  impressions: number;
  cost: number;
}

export interface GoogleAdsLandingPageImport {
  fileName: string;
  period: string;
  importedAt: string;
  currency: string;
  rowCount: number;
  pages: GoogleAdsLandingPage[];
}

const numberValue = (value = '') => Number(value.replace(/[$,%]/g, '').replace(/,/g, '')) || 0;

// Google Ads exports prepend a report title and date range. This parser finds the
// real header and retains the most actionable rows so a 90MB export does not get
// copied wholesale into browser storage.
export const parseGoogleAdsSearchTerms = (text: string, fileName: string): GoogleAdsImport => {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex(line => line.toLowerCase().startsWith('search term,'));
  if (headerIndex < 0) throw new Error('The file does not contain a Google Ads “Search term” header.');
  const headers = parseCsvLine(lines[headerIndex]);
  const index = (name: string) => headers.findIndex(header => header.trim().toLowerCase() === name.toLowerCase());
  const at = (cells: string[], name: string) => cells[index(name)] || '';
  const campaigns = new Set<string>();
  const candidates: GoogleAdsSearchTerm[] = [];
  let rowCount = 0, clicks = 0, impressions = 0, cost = 0, conversions = 0;
  let currency = '';

  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const cells = parseCsvLine(lines[i]);
    const query = at(cells, 'Search term').trim();
    if (!query || query.toLowerCase().startsWith('total:')) continue;
    const row: GoogleAdsSearchTerm = {
      query,
      campaign: at(cells, 'Campaign'),
      adGroup: at(cells, 'Ad group'),
      matchType: at(cells, 'Match type'),
      campaignType: at(cells, 'Campaign type'),
      clicks: numberValue(at(cells, 'Clicks')),
      impressions: numberValue(at(cells, 'Impr.')),
      cost: numberValue(at(cells, 'Cost')),
      conversions: numberValue(at(cells, 'Conversions')),
    };
    rowCount += 1;
    clicks += row.clicks; impressions += row.impressions; cost += row.cost; conversions += row.conversions;
    if (row.campaign) campaigns.add(row.campaign);
    currency ||= at(cells, 'Currency code');
    if (row.clicks > 0 || row.cost > 0 || row.conversions > 0) candidates.push(row);
  }

  candidates.sort((a, b) => (b.cost + b.conversions * 25 + b.clicks * .1) - (a.cost + a.conversions * 25 + a.clicks * .1));
  return {
    fileName,
    period: (lines[headerIndex - 1] || '').replace(/^"|"$/g, ''),
    importedAt: new Date().toISOString(),
    rowCount,
    campaignCount: campaigns.size,
    currency,
    clicks,
    impressions,
    cost,
    conversions,
    rows: candidates.slice(0, 2000),
  };
};

export const parseGoogleAdsCampaigns = (text: string, fileName: string): GoogleAdsCampaignImport => {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex(line => line.toLowerCase().startsWith('campaign status,'));
  if (headerIndex < 0) throw new Error('The file does not contain a Google Ads campaign header.');
  const headers = parseCsvLine(lines[headerIndex]);
  const index = (name: string) => headers.findIndex(header => header.trim().toLowerCase() === name.toLowerCase());
  const at = (cells: string[], name: string) => cells[index(name)] || '';
  const campaigns: GoogleAdsCampaign[] = [];
  let currency = '';
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const cells = parseCsvLine(lines[i]);
    const name = at(cells, 'Campaign').trim();
    if (!name || name.toLowerCase().startsWith('total:')) continue;
    currency ||= at(cells, 'Currency code');
    campaigns.push({
      name,
      type: at(cells, 'Campaign type'),
      status: at(cells, 'Status') || at(cells, 'Campaign status'),
      budget: numberValue(at(cells, 'Budget')),
      bidStrategy: at(cells, 'Bid strategy type'),
      impressions: numberValue(at(cells, 'Impr.')),
      clicks: numberValue(at(cells, 'Clicks')),
      cost: numberValue(at(cells, 'Cost')),
      conversions: numberValue(at(cells, 'Conversions')),
      conversionValue: numberValue(at(cells, 'Conv. value')),
      impressionShare: at(cells, 'Search impr. share'),
      lostBudgetShare: at(cells, 'Search lost IS (budget)'),
      lostRankShare: at(cells, 'Search lost IS (rank)'),
    });
  }
  return { fileName, period: (lines[headerIndex - 1] || '').replace(/^"|"$/g, ''), importedAt: new Date().toISOString(), currency, campaigns };
};

export const parseGoogleAdsTimeSeries = (text: string, fileName: string): GoogleAdsTimeSeriesImport => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  if (headers[0]?.toLowerCase() !== 'date' || !headers.some(header => header.toLowerCase().includes('impr'))) throw new Error('The file does not look like a Google Ads impressions time series.');
  const points = lines.slice(1).map(line => parseCsvLine(line)).filter(cells => cells[0]).map(cells => ({ date: cells[0], impressions: numberValue(cells[1]) }));
  return { fileName, importedAt: new Date().toISOString(), points };
};

export const parseGoogleAdsLandingPages = (text: string, fileName: string): GoogleAdsLandingPageImport => {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex(line => line.toLowerCase().startsWith('landing page,'));
  if (headerIndex < 0) throw new Error('The file does not contain a Google Ads landing-page header.');
  const headers = parseCsvLine(lines[headerIndex]);
  const index = (name: string) => headers.findIndex(header => header.trim().toLowerCase() === name.toLowerCase());
  const at = (cells: string[], name: string) => cells[index(name)] || '';
  const grouped = new Map<string, GoogleAdsLandingPage>();
  let currency = '', rowCount = 0;
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const cells = parseCsvLine(lines[i]);
    const rawUrl = at(cells, 'Landing page').trim();
    if (!rawUrl || rawUrl.toLowerCase().startsWith('total:')) continue;
    rowCount += 1; currency ||= at(cells, 'Currency code');
    const url = rawUrl.split('?')[0].replace(/\/$/, '');
    const existing = grouped.get(url) || { url, selectedBy: at(cells, 'Selected by'), clicks: 0, impressions: 0, cost: 0 };
    existing.clicks += numberValue(at(cells, 'Clicks'));
    existing.impressions += numberValue(at(cells, 'Impr.'));
    existing.cost += numberValue(at(cells, 'Cost'));
    if (existing.selectedBy !== at(cells, 'Selected by')) existing.selectedBy = 'MIXED';
    grouped.set(url, existing);
  }
  const pages = [...grouped.values()].sort((a, b) => b.cost - a.cost);
  return { fileName, period: (lines[headerIndex - 1] || '').replace(/^"|"$/g, ''), importedAt: new Date().toISOString(), currency, rowCount, pages };
};

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let value = '', quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { values.push(value); value = ''; }
    else value += char;
  }
  values.push(value);
  return values;
};
