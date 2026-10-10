# AI English Bridge — AI Tutor Starter

## What is included
- `index.html`: current site prototype, including the video and Excel 5 modules.
- `api/check.js`: secure server-side AI translation checker.
- `package.json`: minimal project metadata.

## Important
The AI checker will only work after deployment to a serverless host and adding an API key as a server environment variable. Do not put the API key inside `index.html` or share it publicly.

## Deploy outline
1. Upload these files to a private or public GitHub repository (video is embedded in `index.html`, so that file is large).
2. Import the repository into Vercel.
3. In Vercel Project Settings → Environment Variables, add `OPENAI_API_KEY` with your secret API key.
4. Optionally add `OPENAI_MODEL` with a supported model name.
5. Redeploy, then test `/api/check` from the site.

`index.html` opened directly from your computer uses its local practice-check fallback; the live AI checker requires the `/api/check` endpoint.
