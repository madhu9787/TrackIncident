# Release Incident Correlator

**College:** Sri Shakthi Institute of Engineering and Technology  
**Team Name:** Tech Titans

| Member | Department | Resume |
|---|---|---|
| ABINAYA S | AIDS | [Resume](./resumes/ABINAYA%20S%20RESUME.pdf) |
| DHIVYA V | IT | [Resume](./resumes/DHIVYA%20V%20RESUME%20Final.pdf%20(1).pdf) |
| Madhumitha G | IT | [Resume](./resumes/Madhumitha%20G%20resume.pdf) |
| Velmani R | CSE | [Resume](./resumes/Velmani_R_FlowCV_Resume_2026-06-10%20(2).pdf) |

## Project Title
**Release Incident Correlator** – An AI‑driven platform that automatically correlates production incidents with recent code changes, providing root‑cause analysis and remediation recommendations.

## Deployment
- **Frontend:** https://track-incident.vercel.app/ (deployed on Vercel)  
- **Backend:** Hosted on Render  
- **Live Demo Video:** [Watch full demo](https://youtu.be/fMzumygK6kQ?si=fATBtJIHJz0Q3VEJ)

## Demo Workflow
Here is our full workflow:
1. Upload incident logs and commit history.  
2. The system preprocesses data, applies time‑window filtering, and sends the context to the Groq‑hosted LLM.  
3. AI returns confidence scores, blast radius, explanations, and remediation steps, which are stored in PostgreSQL and visualised on the dashboard.

## Features
**Incident Detection** – Automatic ingestion of alerts and anomaly detection from uploaded datasets.
**Incident Correlation** – Maps incidents to recent deployments using time‑window heuristics and semantic analysis.
**Root‑Cause Analysis** – Pinpoints the exact commit, file, and lines responsible for an outage.
**AI‑Powered Recommendations** – Generates actionable remediation steps via Groq LLM.
**Severity Classification** – Categorises incidents based on historical impact.
**Dashboard & Analytics** – Real‑time visualisation of system health and correlation results.
**Historical Trend Analysis** – Tracks recurring issues across releases.
**Incident Timeline** – Visual timeline of events leading to an incident.
**Search & Filtering** – Powerful queries by severity, component, date, or developer.
**Data Visualization** – Interactive charts built with Framer Motion.
**CSV Import Processing** – Seamless upload of CSV/JSON logs.
**Automated Incident Grouping** – Clusters related alerts into a single report.

## Tech Stack
**Frontend** – React for UI, Vite for fast builds, Tailwind CSS for utility‑first styling, Framer Motion for smooth animations.
**Backend** – Python with Flask serving REST APIs, Pandas for data manipulation, PostgreSQL for persistent storage.
**AI Models** – Groq‑hosted LLM (Groq‑Lite) used for semantic correlation and recommendation generation.
**Database Storage** – PostgreSQL stores incidents, commits, correlation scores, and recommendations.

## AI Usage Document
The AI component is documented in detail.  
Here is our document – click to view the AI usage in our project: [AI Usage Document](./document/RELEASE%20INCIDENT%20CORRELATOR.pdf)

## Architecture Diagram
![Architecture Diagram](./images/architecture.png)

## Detailed Architecture Workflow
1. **User Upload** – The user uploads incident logs and commit data via the React frontend.
2. **Pre‑processing** – Backend cleans data, normalises timestamps, and filters commits within the configurable time window.
3. **Prompt Construction** – Incident context and candidate diffs are formatted into a structured prompt for the Groq LLM.
4. **Inference** – The LLM evaluates similarity, returns confidence scores, blast radius, explanations, and remediation steps.
5. **Result Storage** – All results are persisted in PostgreSQL.
6. **Visualization** – The frontend queries the backend to display correlation results, dashboards, and AI recommendations.
7. **Feedback Loop** – Users can provide feedback on AI suggestions, which are logged for future model fine‑tuning.

## Outcomes
### Landing page
*Landing page of the application.*
![Landing page](./images/Landing%20page.png)

### Applications
*Showcase of enterprise‑level usage.*
![Applications](./images/enterprises.png)

### Workflow
*Illustrates the end‑to‑end processing pipeline.*
![Workflow](./images/working.png)

### Dashboard
*Real‑time analytics dashboard.*
![Dashboard](./images/dashboard.png)

### AI Report
*AI generated incident report.*
![AI Report](./images/result.png)

### History Analysis
*Historical incident database view.*
![History Analysis](./images/History.png)

### AI Interface
*Interactive AI chat interface.*
![AI Interface](./images/Ai%20interface.png)

## Database Screenshots
### Tables
*Database schema overview.*
![Tables](./images/tables.png)

### Incident DB
*Incident records table.*
![Incident DB](./images/incident%20db.png)

### Incident 2
*Second incident example.*
![Incident 2](./images/incident%202%20db.png)

## Conclusion
The Release Incident Correlator demonstrates how modern AI models, combined with efficient engineering practices, can transform incident management from a manual, time‑consuming process into an automated, intelligent workflow that accelerates resolution and improves system reliability.
