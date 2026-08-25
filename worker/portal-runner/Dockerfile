# Portal worker — Playwright + Chromium. Run as a Cloud Run *job* (not a service) or on a small VM.
FROM mcr.microsoft.com/playwright:v1.50.0-noble
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY tsconfig.json ./
ENV HEADLESS=true PROFILES_DIR=/data/profiles
VOLUME ["/data/profiles"]
CMD ["npx", "tsx", "src/index.ts"]
