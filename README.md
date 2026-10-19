# Kastura Pharma — React + Google Sheets forms

This project packages the existing Kastura Pharma site in a React/Vite app while preserving its interactions and visual design. The original page is retained as `public/site.html` and mounted by the React entry point so its legacy interactions continue to work. Contact Us, callback, newsletter and mock checkout submissions are routed to Google Sheets.

## Important before launch

**Google Sheets cannot be connected until you deploy the included Apps Script and paste its URL into `public/config.js`.** The repository cannot create or authorize a spreadsheet inside your Google account automatically. Do not treat a form as live until you complete the test steps below. The checkout on this site is explicitly a mock checkout: no real payment or order fulfilment occurs.

## 1. Set up the Google spreadsheet (one-time)

1. Open [Google Apps Script](https://script.google.com/) and create a new project.
2. Copy all of `google-apps-script.gs` into `Code.gs`. Save.
3. Select `setupKasturaSpreadsheet` in the function selector and click **Run**. Approve Google Sheets permissions.
4. In **Execution log**, copy the spreadsheet URL. It contains tabs for Contact Us, Callback Requests, Newsletter, Orders (Mock), and Other Forms.
5. In Apps Script choose **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone** (required for public website visitors; your organisation's policy may disallow this). Deploy and authorize if prompted. Copy the Web app URL ending in `/exec`.
6. Open `public/config.js` and set `GOOGLE_APPS_SCRIPT_URL` to that exact `/exec` URL. Commit and push.

Public Apps Script web apps are callable by anyone who knows the URL. This basic endpoint is suitable for low-volume public enquiries, not sensitive health data or payment data. Add abuse protection / rate limiting before high-traffic use. Do not collect medical history or other sensitive health information through this site.

## 2. Run locally

Install Node.js LTS, then in this folder run:

```bash
npm install
npm run dev
```

Open the local URL Vite prints.

## 3. Deploy to GitHub Pages

1. Push this folder to a GitHub repository (the project files should be at the repository root).
2. Update `vite.config.js` `base` to `'/YOUR-REPOSITORY-NAME/'` if deploying to `https://USERNAME.github.io/YOUR-REPOSITORY-NAME/`. Use `'/'` for a custom domain or `USERNAME.github.io` repository. The current `./` base is often suitable for project pages, but verify assets on the published URL.
3. In GitHub go to **Settings → Pages → Build and deployment → GitHub Actions** or use a workflow that runs `npm ci`, `npm run build`, then publishes `dist`. A simple reliable route is the included `npm run deploy` after setting the correct base and running `npm install`; it publishes `dist` to `gh-pages` (you may need to enable Pages from the `gh-pages` branch in Settings).
4. For a fully automatic deployment, create `.github/workflows/deploy.yml` using the standard Vite GitHub Pages workflow.

## 4. Required end-to-end tests

- Submit Contact Us with valid name, email, message and consent; confirm a row appears in the **Contact Us** tab.
- Submit callback form; confirm a row in **Callback Requests**.
- Subscribe with an email; confirm a row in **Newsletter**.
- Submit the mock checkout; confirm a row in **Orders (Mock)**.
- Repeat once on the published GitHub Pages URL, not just localhost.
- If a submission is missing, check Apps Script **Executions**, deployment version, and that `public/config.js` contains the `/exec` URL. When updating Apps Script code, create a new deployment version or edit the existing deployment to use the new version.

## Notes

- The browser uses `no-cors` for Apps Script submissions because Apps Script does not provide a reliable CORS response for this static frontend. The browser cannot verify the server response, so a resolved fetch is not a guaranteed proof of spreadsheet insertion. Always complete the end-to-end test above.
- This project records only form details. Batch verification is a sample/demo feature and does not write to the spreadsheet.
