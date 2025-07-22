# Careloop

A multilingual collaborative task management application with AI-powered translation and voice features.

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Python](https://img.shields.io/badge/Python-3.12-yellow) ![Supabase](https://img.shields.io/badge/Supabase-Database-green)

## Features

- **Multilingual Support** - Real-time translation with OpenAI GPT models
- **Voice Integration** - ElevenLabs-powered speech-to-text and text-to-speech
- **Group Collaboration** - Shared task management with real-time updates
- **Built-in encouragement** - Encouragement letter for Migrant Domestic Helper when daily tasks are completed
- **AI Models** - Custom SEA-LION model deployment for performance comparison

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+ (for backend AI services)
- Supabase account
- OpenAI API key

### 1. Database Setup
Follow the instructions in [database/README.md](database/README.md) for setting up your Supabase database.
This will create all required tables, RLS policies, and functions.

### 2. Frontend Setup
Follow the instructions in [frontend/README.md](frontend/README.md) for setting up the Nextjs application correctly.
This will allow users to interact with the Careloop application.

### 3. Backend Setup (Optional)
Follow the instructions in [backend/README.md](backend/README.md) for setting up SEA-LION LLM deployment correctly.
This will deploy SEA-LION 3.5 LLM for benchmarking.