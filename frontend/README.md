# GoKnown Frontend

This is the frontend application for GoKnown, built with React, TypeScript, and modern web technologies.

## Prerequisites

- Node.js 16+
- Yarn package manager
- Docker and Docker Compose (for containerized deployment)

## Local Development

### Using Docker (Recommended)

1. **Start the application with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Nginx (if configured): http://localhost:80

3. **View logs:**
   ```bash
   docker-compose logs -f frontend
   ```

### Manual Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   yarn start
   ```

## Docker Configuration

### Dockerfile
The `Dockerfile` is optimized for development and production:
- Uses Alpine Linux for smaller image size
- Installs dependencies with `yarn install --frozen-lockfile`
- Builds the application with `yarn build`
- Runs the application with `yarn start`

### Docker Compose
The `docker-compose.yaml` includes:
- **Frontend Service**: Main React application
- **Nginx**: Reverse proxy with SSL support (optional)

### Windows Compatibility
The Docker configuration has been optimized for Windows:
- Uses forward slashes (/) in paths
- Adjusted volume mounts for Windows compatibility
- Uses cross-platform commands

## Environment Variables

### Required Variables
```env
# React App Environment Settings
REACT_APP_ENVIRONMENT=development

# Backend API Endpoints
REACT_APP_PRODUCTION_API=http://localhost:3333/
REACT_APP_DEVELOPMENT_API=http://localhost:3333/
REACT_APP_STAGING_API=http://localhost:3333/
REACT_APP_BALANCE_API=http://localhost:3333/

# Build Options
GENERATE_SOURCEMAP=false

# Bypass Options (Testing Purposes)
REACT_APP_BYPASS_SMS_2FA=true
REACT_APP_BYPASS_EMAIL=true
```

## Available Scripts

- `yarn start`: Start development server
- `yarn build`: Build the application for production
- `yarn test`: Run tests
- `yarn eject`: Eject from Create React App
- `yarn lint`: Run ESLint
- `yarn lint:fix`: Fix ESLint issues

## Project Structure

```
src/
├── @types/          # TypeScript custom types
├── assets/          # Images and static files
├── components/      # Reusable components
├── hooks/           # Custom React hooks
├── pages/           # Application pages
├── routes/          # Application routes
├── services/        # Services for API communication
├── styles/          # Global styles and themes
└── utils/           # Utility functions
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Core Language** | TypeScript | Frontend development |
| **Framework** | React.js | Building user interfaces |
| **State Management** | Context API | Global state management |
| **Styling** | Styled-components | Component styling |
| **Routing** | React Router | Page navigation |
| **API Communication** | Axios | HTTP requests to the backend |
| **UI Components** | Material-UI, Chakra UI | UI component libraries |
| **Forms** | Unform | Form handling |
| **Validation** | Yup | Schema validation |

## Development Principles

- **Componentization**: Extensive use of reusable components
- **Responsiveness**: Responsive design for mobile and desktop
- **Accessibility**: Implementation of accessibility practices
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized for fast loading and smooth interactions

## Troubleshooting

### Docker Issues

1. **Permission denied errors (Windows):**
   - Run Docker Desktop as Administrator
   - Check file sharing settings in Docker Desktop

2. **Build context errors:**
   - Ensure you're in the correct directory
   - Check that all paths are correct

3. **Volume mounting issues:**
   - Enable file sharing in Docker Desktop
   - Use forward slashes (/) in paths

### Development Issues

1. **Port already in use:**
   - Check if port 3000 is available
   - Kill existing processes or change port

2. **Build errors:**
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify environment variables

3. **API connection issues:**
   - Verify backend is running
   - Check API URLs in environment variables
   - Ensure CORS is configured properly

## Production Deployment

### Using Docker

1. **Build the image:**
   ```bash
   docker build -t goknown-frontend .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 --env-file .env goknown-frontend
   ```

### Environment Setup

1. **Set REACT_APP_ENVIRONMENT=production**
2. **Configure production API URLs**
3. **Set up SSL certificates**
4. **Configure reverse proxy (Nginx)**
5. **Set up monitoring and logging**

## Testing

### Run tests:
```bash
yarn test
```

### Run tests with coverage:
```bash
yarn test --coverage
```

### Run tests in watch mode:
```bash
yarn test --watch
```

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation
4. Use conventional commits
5. Create pull requests for changes

## License

This project is proprietary software. All rights reserved.

