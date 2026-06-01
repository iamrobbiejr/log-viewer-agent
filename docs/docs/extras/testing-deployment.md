---
sidebar_position: 2
---

# Testing & Deployment

This guide explains how to test the Log Viewer ecosystem locally and how to deploy it to remote hosting providers.

## Local Testing
When testing locally, the `apps/agent/config.json` uses `null` for values that the installer usually populates.

1. **Start the Backend:** Navigate to `apps/nest-backend` and run `npm run start:dev`. It will spin up on `localhost:3000`.
2. **Start the Frontend:** Navigate to `apps/dashboard` and run `npm run dev`. It will start on `localhost:5173`.
3. **Start the Agent Locally:** 
   - Navigate to `apps/agent`.
   - Create a virtual environment: `python -m venv venv`
   - Install dependencies: `pip install -r requirements.txt`
   - Run the agent manually: `uvicorn main:app --host 0.0.0.0 --port 8000`
4. **Link them together:** In your Dashboard, add a machine with URL `http://localhost:8000` and the API key defined in your `apps/agent/config.json`.

## Remote Testing (Vercel / Netlify)

You can easily deploy the frontend Dashboard to Vercel or Netlify.

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Select the **Root Directory** as `apps/dashboard`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. **Environment Variables**: Set `VITE_API_BASE_URL` to the URL of your deployed NestJS Backend (e.g., `https://my-backend.railway.app/api/v1`).

### Deploying the Backend
The NestJS backend can be hosted on services like Render, Railway, or Heroku.
- Ensure you set the `DATABASE_URL` environment variable to connect to a proper PostgreSQL database instead of the default SQLite.
- Configure CORS in `main.ts` if needed to restrict traffic to your specific Vercel frontend domain.

## Ngrok for Dynamic Agents

During installation, the agent automatically starts an Ngrok service.
- **Why Ngrok?** It bypasses firewalls to expose the local `localhost:8000` agent to the internet.
- **Is it secure?** Yes, because the agent enforces API Key authentication on every request. Even if someone finds the Ngrok URL, they cannot view your logs without the key.
- **Cloudflare Alternative:** As noted in the Cloudflare guide, you can disable the Ngrok service and use Cloudflare Tunnels for a more permanent, branded URL structure.

> [Screenshot/s needed] - Add screenshots of a successful Vercel deployment and Ngrok tunnel dashboard.
