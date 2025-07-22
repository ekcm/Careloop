# Careloop Frontend

Next.js React application for multilingual collaborative task management with AI-powered translation and voice features.

## Prerequisites

Before setting up the frontend, ensure you have:

- **Node.js 18+** and npm
- **Database setup completed** - Follow [../database/README.md](../database/README.md) first
- **API Keys**:
  - Supabase project URL and anon key
  - OpenAI API key (for translation)
  - ElevenLabs API key (for text-to-speech)

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create your environment file:

```bash
cp ../.env.example .env
```

Configure `.env` with your actual values:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# OpenAI Configuration (Required for translation)
OPENAI_API_KEY=sk-your-openai-api-key-here

# ElevenLabs Configuration (Required for speech-to-text and text-to-speech)
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `OPENAI_API_KEY` and `ELEVENLABS_API_KEY` are server-side only (used in API routes)
- Get your Supabase keys from your project dashboard at [supabase.com](https://supabase.com)

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Key Features

### Translation System
- **Real-time translation** using OpenAI GPT models
- **Smart caching** to avoid redundant API calls
- **Batch processing** for efficient translation
- **Language detection** for automatic source language identification

### Voice Features
- **Speech-to-text** transcription using ElevenLabs Scribe (scribe_v1)
- **Text-to-speech** using ElevenLabs API

### Collaborative Tasks
- **Group-based** task management
- **Real-time updates** via Supabase subscriptions
- **Comments and discussions** on tasks
- **Role-based permissions** (admin/member)

### Authentication & Security
- **Supabase Auth** for user management
- **Row Level Security** for data isolation
- **API routes** for secure server-side operations

## Deployment

### Build and Test
```bash
npm run build    # Build production bundle
npm run start    # Test production build locally
```