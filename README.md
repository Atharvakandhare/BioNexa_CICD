# BioNexa Full-Stack Platform

BioNexa is a healthcare engagement platform that combines a React-based patient dashboard with a Node/Express API backed by MongoDB and Firebase Authentication.

## Project Layout

- `src/` – React single-page application bootstrapped with `react-scripts`; includes Firebase auth flows, AI-assisted symptom analysis, and appointment booking UI.
- `backend/` – Express server exposing authentication, doctor, appointment, and prescription APIs; relies on MongoDB and Firebase Admin for auth.
- `public/` – Static assets for the frontend build output.
- `docker-compose.yml` – Multi-service orchestration for local containerized runs.

## Frontend Stack

- React 18 with React Router DOM and React Toastify.
- Firebase client SDK for authentication and analytics.
- Framer Motion and Font Awesome for UI polish.
- AI integrations via Google Gemini (`src/services/aiService.js`) and OpenAI (`src/services/symptomAnalysis.js`).

### Scripts

```bash
npm install    # install dependencies
npm start      # run CRA dev server on http://localhost:3000
npm run build  # create production build under /build
```

## Backend Stack (`backend/`)

- Express 4 with Helmet, CORS, and Morgan middleware.
- MongoDB models for users, doctors, appointments, and prescriptions (Mongoose 8).
- Firebase Admin SDK for verifying ID tokens (requires a service account JSON file at `backend/config/firebase-service-account.json`).
- Nodemon for development reloads.

### Backend Scripts

```bash
cd backend
npm install    # install server dependencies
npm run dev    # nodemon with hot reload
npm start      # production mode
```

Environment variables expected in `backend/.env`:

```
MONGODB_URI=mongodb+srv://...
PORT=5000
GOOGLE_APPLICATION_CREDENTIALS=/app/config/firebase-service-account.json
```

## Dockerized Setup

1. Create a `.env` file at the repository root with at least:

```
MONGODB_URI=mongodb+srv://...
```

2. Ensure your Firebase Admin key is stored at `backend/config/firebase-service-account.json`. The file is mounted into the backend container but is ignored by Git.

3. Build and run both services:

```bash
docker compose build
docker compose up
```

- Frontend is served via Nginx on `http://localhost:3000`.
- Backend API is available on `http://localhost:5000`.

To rebuild after code changes:

```bash
docker compose up --build
```

## Testing & Linting

`react-scripts test` runs frontend unit tests. ESLint is configured via `eslint.config.js`; run `npx eslint src` to lint manually.

## Security Notes

- Never commit real Firebase service account files or API keys.
- Rotate the Gemini API key in `src/services/aiService.js` and move it to environment variables before deploying.
