# Safe Selangor

An AI-powered and data-driven city safety platform that provides district-level safety insights, trend analysis, and actionable intelligence to promote safer and more sustainable urban environments.

---

# Overview

This project analyzes district-level safety data and presents it through an interactive web dashboard. It integrates:

# Safe Selangor

An AI-powered and data-driven city safety platform that provides district-level safety insights, trend analysis, and actionable intelligence to promote safer and more sustainable urban environments.

---

# Overview

This project analyzes district-level safety data and presents it through an interactive web dashboard. It integrates:

- A **Fastify backend** for API and orchestration
- A **Next.js frontend** for visualization and user interaction
- **Python scripts** for web scraping and data processing

The goal is to provide transparent, data-driven safety insights that support better decision-making for citizens, policymakers, and investors.

---

# 🏗 Technical Architecture

## High-Level Architecture

## Components
![Architecture Diagram](https://raw.githubusercontent.com/justin8ty/safe-selangor/python_branch/assets/architecture_diagram.png)
### Frontend – Next.js
- Displays district safety scores (0–100 scale)
- Shows monthly trend comparisons
- Visualizes safety heatmaps and analytics
- Handles user interaction and reporting
- Real-time map and feed updates
- Moderator dashboard for human moderating

###  Backend – Fastify
- REST API for frontend request
- Implement LLM to validate and analyze user-report
- Google cloud api to get landmarks and location
- Invokes Python scripts for data collection
- Interfaces with database
- Real-time score calculation

### Python Module
- Scrapes external sources for safety/crime data
- Cleans and normalizes collected data
- Implement LLM to extract data from webscraping
- Business logic for safety scoring
- Outputs structured data for backend ingestion

### Database
- Stores reports
- Stores users details 
- District/state mapping
- Baseline calculation based on official data (https://data.gov.my/)
- Historical monthly safety scores
- Trend tracking
- Stores webscraping details (links and data)


---

# ⚙️ Implementation Details

## Safety Scoring System

- Districts are scored using a **0–100 whole-number scale** based on baselines calculated from past official government's data
- Replaced percentage-based scoring for better clarity
- Higher score = safer district

## Trend Analysis

- Compares:
  - Current month
  - Previous month
  - Two months prior
- Helps users identify:
  - Improvement
  - Decline
  - Stability

## AI + Human Moderation

- AI processes and classifies safety-related data
- If AI confidence is low, the report is flagged
- Human moderators verify uncertain cases
- Ensures higher-quality and reliable data

## Webscraping with AI

- Scrape links from reputable news website
- Ai scrape information based off articles
- Automatatically runs every few hours and update database

## Frontend Design

- Mapbox api to display heatmap
- Nextjs framework
- Uses shadcn for prebuilt components


## Backend Design

- Fastify framework
- Async handlers using `await`
- Immutable data flow (spread operator usage)
- Strong TypeScript typing for reliability

## Python Worker

- Worker accepts request from database
- Uses Craw4Ai to webscrape and process data and later pass to the LLM for data extraction
- Scraped data is parsed and inserted into database
- Enables dynamic data updates without manual input
- Logic for calculating score

---

# 📊 Success Metrics

- % of districts covered with active safety data
- User engagement rate (trend views, map interactions)
- Number of reports processed with AI moderation
- Reduction in ambiguous or low-confidence classifications
- System response time for API requests

---

# 🚧 Challenges Faced

- Since many areas and cities can be under 1 police district departments making it difficult to map the districts.
- Handling inconsistent web-scraped data formats
- Integrating TypeScript backend with Python services
- Ensuring accurate trend calculation across months
- Balancing AI automation with human moderation
- Improve Token Efficiency with better preprocessing and prompting
- News outlet are very biased and have limited data.
- Handling database integrity to make sure it does not accept invalid data (eg. invalid states)
- Score calculation to show accurate representation of how dangerous a district is
- Using parallel processing for faster webscraping


---

# 🚀 Future Roadmap

## Short-Term
- Improve predictive risk modeling
- Add clearer trend indicators (visual arrows, color coding)
- Optimize Python scraping performance

## Medium-Term
- Better conflict checking on multiple similar reports
- Add major districts in major cities in malaysia (Johor Bharu, Penang)
- Better intergration and 

## Long-Term
- Expand to most districts/states
- More precise scoring for neighborhood and areas 
- Introduce predictive analytics for crime prevention
- Public API access for researchers and institutions
- Mobile App Development

---

# 🛠 Setup Instructions
## Prerequisites

- Node.js environment with **npm** or **Bun** installed to run the frontend and backend.
-  Python 3.x installed to run the web scraping and calculation scripts.
## Backend (Fastify)

```bash
bun install
bun run dev
```
## Frontend (Next.js)


```bash
npm install
npm run dev
```

## Python Module

```bash
#Create and activate virtual environment  
python3 -m venv venv  
#Linux/macOS  
source venv/bin/activate  
#Windows  
venv\Scripts\activate  
  
#Install Python dependencies  
pip install -r requirements.txt
