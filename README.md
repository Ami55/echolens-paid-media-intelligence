# EchoLens Paid Media Intelligence

Standalone extraction of the Paid Media Intelligence / Ad Radar module from the supplied EchoLens archive. The original EchoLens ZIP and app have not been modified. The full EchoLens app can retain its existing module; this is a separate repository and deployment.

## Included

- Google Ads CSV imports: search terms, campaigns, time series, and landing pages.
- Paid search analysis and connections to planning prompts.
- Sponsored-ad observation log, conversation scenarios, opportunity/readiness views, and creative directions.
- Sponsored-agent conversation preview with the original optional OpenAI/Gemini server integration and scripted fallback.
- Independent editable brand and planning-prompt setup, saved in this browser.
- Existing EchoLens visual styling and SEO Girl - Ami footer.

Use the repository name **echolens-paid-media-intelligence**.

## GitHub and Vercel

1. Unzip and upload the contents to the repository root, including source folders, `api`, configuration, package.json, and package-lock.json. Do not upload the ZIP itself or node_modules.
2. Import the repository into Vercel. Framework: **Vite**. Root: repository root. Build: `npm run build`. Output: `dist`. Install: `npm ci`. Configuration is in `vercel.json`.
3. Deploy. CSV analysis and scripted previews do not require a key.
4. For live sponsored-agent responses, add `OPENAI_API_KEY` in Vercel's environment variables and redeploy. Optional `OPENAI_MODEL` defaults to the original app's `gpt-5-mini`. The API project must have model/tool access and billing. Optional `SITE_SEARCH_DOMAIN` pins website search to your brand domain. `GEMINI_API_KEY` retains the original fallback, subject to account/model availability. Do not commit real keys.

Only the sponsored-agent preview uses the live AI connection. Other drafts and scenario suggestions use the original templates/rules. Imports are CSV-based, not Google Ads account connections. No campaigns are launched, and hypothetical sponsored-agent experiences do not establish real platform placements or targeting.

## Privacy and storage

CSV analysis and observations are stored in browser localStorage on the standalone app's origin. Existing EchoLens browser data does not automatically move to the new app: reimport reports and set up the brand/prompts. Use a separate deployment origin for independent data. The sponsored-agent preview sends brand context, conversation messages, approved facts, and limited landing-page context to the server/provider when used. This portfolio extraction has no added authentication or durable rate limiting; restrict access before enabling paid AI on a public deployment.

## Development

Node.js 22.14+:

```
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Build generates the frontend, local server, and Vercel API bundle. The API placeholder is replaced by the build. No EchoLens tracking cron jobs or unrelated dashboard API endpoints are included.

## Validation in this handoff

The source was extracted from the supplied archive, with standalone setup and hosting configuration added. Parser checks and TypeScript syntax checks are run separately. Full dependency installation, production bundling, and browser QA require package registry access; the handoff notes state their actual status.
