# CLAUDE.md

## Project Overview

This is Fin's personal homepage - a SvelteKit web application that provides a personalized dashboard with various useful information and utilities.

## Key Features

- **Quotations Display**: Shows inspirational quotes with attribution and sources
- **Word Definitions**: Retrieves and displays word definitions with the ability to add new words
- **Time Tracking**: DoneThat integration showing focus time vs total time with interactive bar charts
- **Task Management**: Todoist integration for today/overdue tasks
- **Weather Information**: Displays current weather for Oxford
- **Google Sheets Integration**: Uses Google Apps Script APIs to manage data

## Technology Stack

- **Frontend Framework**: SvelteKit 2.0
- **Styling**: TailwindCSS 4.x with Flexoki color scheme
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Package Manager**: npm/pnpm
- **Code Quality**: ESLint, Prettier

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte           # Main homepage component
│   ├── +page.server.js        # Server-side actions (form handling)
│   ├── +layout.svelte         # App layout
│   └── api/
│       ├── definition/        # Word definition API endpoint
│       ├── quotation/         # Quotation management API
│       ├── weather/           # Weather data API
│       ├── word/              # Word management API (Google Sheets)
│       ├── donethat/          # DoneThat time tracking API
│       └── tasks-direct/      # Todoist tasks API
├── lib/
│   └── cache/                 # IndexedDB caching utilities
└── app.css                    # Global styles (includes dark mode variables)
```

## API Endpoints

- `GET/POST /api/word` - Retrieve random words or add new words to Google Sheets
- `GET/POST /api/quotation` - Manage quotations database
- `GET /api/weather?city=Oxford` - Get weather information
- `GET /api/definition` - Word definition lookup
- `GET /api/donethat?days=7` - Fetch time tracking data from DoneThat API
- `GET /api/tasks-direct` - Fetch today/overdue tasks from Todoist (uses `getTasksByFilter`)
- `GET /api/tasks-direct?all=true` - Fetch all tasks from Todoist (for caching)

## External Dependencies

- **Google Apps Script**: Backend API for word and quotation management
- **Weather API**: Third-party weather service
- **Google Sheets**: Data storage for words and quotations
- **DoneThat API**: Time tracking data (`api.donethat.ai/report`)
- **Todoist API**: Task management via `@doist/todoist-api-typescript` SDK

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Environment Variables

The project uses environment variables for API keys and URLs:
- `WORD_API_URL` - Google Apps Script endpoint for word management
- `DONETHAT_KEY` - API key for DoneThat time tracking
- `TODOIST_KEY` - API key for Todoist task management

## Design System

The application uses the Flexoki color scheme with CSS variables that automatically adapt to dark/light mode (via `.dark` class). Key classes:
- `bg-flexoki-white` - Page background (use for solid backgrounds that adapt to theme)
- `flexoki-ui`, `flexoki-ui-2` - Border colors
- `flexoki-black`, `flexoki-tx-2`, `flexoki-tx-3` - Text colors (primary, secondary, muted)
- `flexoki-bg-2` - Secondary background color
- `flexoki-re`, `flexoki-gr` - Error and success colors

Colors are defined as CSS variables in `app.css` with both light and dark mode values.

## Form Handling

The app includes two main forms:
1. **Add Word Form** - Submits new words to be defined and stored
2. **Add Quotation Form** - Submits new quotations with optional attribution

Both forms use SvelteKit's `enhance` for progressive enhancement and include loading states and error handling.

## Code Style

- Uses SvelteKit conventions and patterns
- Implements reactive statements and stores
- Follows component-based architecture
- Uses semantic HTML and accessibility best practices