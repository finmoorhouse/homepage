# CLAUDE.md

## Project Overview

This is Fin's personal homepage - a SvelteKit web application that provides a personalized dashboard with various useful information and utilities.

## Key Features

- **Quotations Display**: Shows inspirational quotes with attribution and sources
- **Word Definitions**: Retrieves and displays word definitions with the ability to add new words
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
│       └── word/              # Word management API (Google Sheets)
├── lib/
└── app.css                    # Global styles
```

## API Endpoints

- `GET/POST /api/word` - Retrieve random words or add new words to Google Sheets
- `GET/POST /api/quotation` - Manage quotations database
- `GET /api/weather?city=Oxford` - Get weather information
- `GET /api/definition` - Word definition lookup

## External Dependencies

- **Google Apps Script**: Backend API for word and quotation management
- **Weather API**: Third-party weather service
- **Google Sheets**: Data storage for words and quotations

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Environment Variables

The project uses environment variables for API URLs:
- `WORD_API_URL` - Google Apps Script endpoint for word management

## Design System

The application uses the Flexoki color scheme with custom CSS classes like:
- `flexoki-ui`, `flexoki-ui-2` - Border colors
- `flexoki-black`, `flexoki-tx-2` - Text colors
- `flexoki-bg-2` - Background colors
- `flexoki-re`, `flexoki-gr` - Error and success colors

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