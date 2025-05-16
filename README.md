# Homepage

A personalized homepage built with SvelteKit that provides various useful information through API endpoints.

## Features

- **Word Definitions**: Look up word definitions
- **Weather Information**: Get current weather data
- **Random Facts**: Display interesting facts
- **Quotes**: Show inspirational quotes
- **Link Management**: Store and organize useful links

## API Endpoints

- `/api/definition` - Word definition service
- `/api/fact` - Random fact generator
- `/api/quotes` - Quote retrieval service
- `/api/weather` - Weather information
- `/api/word` - Word service

## Technologies

- [SvelteKit](https://kit.svelte.dev/) - Frontend framework
- [Supabase](https://supabase.io/) - Backend database and authentication
- [Axios](https://axios-http.com/) - HTTP client for API requests

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd homepage

# Install dependencies
npm install
```

## Development

Start the development server:

```bash
npm run dev

# Or open in a browser automatically
npm run dev -- --open
```

## Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is privately licensed.