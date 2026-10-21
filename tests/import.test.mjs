import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseGoogleAdsSearchTerms,parseGoogleAdsCampaigns} from '../src/utils/googleAdsImport.ts';
test('search report preserves paid metrics and skips totals',()=>{const r=parseGoogleAdsSearchTerms('Search terms report\nOctober 2026\nSearch term,Campaign,Ad group,Clicks,Impr.,Cost,Conversions,Currency code\nprivate tours,Search,Guides,10,100,25,2,CAD\nTotal: Search terms,,,10,100,25,2,CAD','sample.csv');assert.equal(r.rowCount,1);assert.equal(r.cost,25);assert.equal(r.conversions,2);assert.equal(r.rows[0].query,'private tours');assert.equal(r.currency,'CAD');});
test('unrelated CSV fails with an actionable error',()=>{assert.throws(()=>parseGoogleAdsSearchTerms('foo,bar\n1,2','bad.csv'),/Search term/);});
test('quoted query is retained',()=>{const r=parseGoogleAdsSearchTerms('Search term,Clicks,Impr.,Cost,Conversions\n"tours, private",4,30,10,1','quoted.csv');assert.equal(r.rows[0].query,'tours, private');});
