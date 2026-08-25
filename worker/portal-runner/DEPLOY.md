# Portal worker — deployment

The worker is a long-running Node process with Chromium. It does not run inside the Next.js app
(Cloud Run request handlers cannot hold a browser session for 20 minutes). Two supported homes:

## Option A — small always-on VM (simplest, recommended to start)
1. Ubuntu 22.04 e2-small (2 GB). `sudo apt install -y nodejs npm` (Node 20+).
2. `git clone` the repo, `cd worker/portal-runner`, `npm install`, `npx playwright install --with-deps chromium`.
3. Copy `.env.example` → `.env`, fill in. Put the service-account JSON in a file and set
   `GOOGLE_APPLICATION_CREDENTIALS=/path/sa.json` instead of `FIREBASE_SERVICE_ACCOUNT_KEY` if preferred.
4. Run under systemd:
   ```
   [Service]
   WorkingDirectory=/opt/myacc/worker/portal-runner
   EnvironmentFile=/opt/myacc/worker/portal-runner/.env
   ExecStart=/usr/bin/npx tsx src/index.ts
   Restart=always
   ```
5. Nightly health: `0 4 * * * cd /opt/myacc/worker/portal-runner && npx tsx src/index.ts --health`.

## Option B — Cloud Run job
`gcloud run jobs deploy portal-runner --source . --region europe-west1 --task-timeout 3600 --memory 2Gi`
with secrets mounted as env vars, and a Cloud Scheduler trigger every 15 minutes running with `--once`
(process the queue then exit). Persistent browser profiles need a mounted volume (Cloud Storage FUSE)
at `/data/profiles`, otherwise every run is a "new device" and portals will OTP every time.

## What the worker needs from Kevin
- Confirm automated access is acceptable per portal (plan §9 #4). CIPC and SARS both have terms of use;
  the worker uses ordinary browser sessions under your/your client's login, nothing more.
- Firm credentials for CIPC (customer code + password) and, optionally, the practitioner eFiling profile.
- Be reachable for OTPs: eFiling sends a PIN to the taxpayer's registered cell/email on new-device login.
  The worker pauses up to 10 minutes; the inbox shows an "OTP needed" card.

## Safety properties
- Never presses a portal's final submit unless the job's `decision.action === 'submit'` (Kevin) or
  `mode === 'auto'` (only reachable through the autonomy promotion switch).
- Screenshots every meaningful screen to Storage; the inbox shows them before you submit.
- If a selector is not found within its timeout, the job becomes `handoff` with the prepared values,
  never a guess.
- Credentials are decrypted in memory here and never written anywhere.
