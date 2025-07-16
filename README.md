# FairShare - Shared Finance Management Application

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Development Setup](#development-setup)
  - [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

FairShare is a web application designed to simplify shared finances for couples, roommates, and households. It provides tools for:

- Splitting expenses proportionally based on income or equally
- Tracking shared expenses and calculating who owes what

The application consists of:
- **Frontend**: React-based user interface (port 3000)
- **Backend**: Node.js API service (port 3001)
- **Database**: SQLite (with volume persistence)

## Features

- **Expense Splitting**:
  - Multiple splitting methods (proportional/equal)
  - Expense history tracking
  - Balance calculations

- **User Experience**:
  - Responsive design
  - Intuitive interface
  - Secure authentication

## Installation

### Prerequisites

- Docker (version 20.10.0 or higher)
- Docker Compose (version 2.0.0 or higher)
- Node.js (version 16 or higher) - for development only

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/elidholm/fair-share.git
   cd fair-share
   ```

2. Start the development environment:
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh
   ```

   This will:
   - Build and start the frontend (http://localhost:3000)
   - Build and start the backend (http://localhost:3001)
   - Set up file watching with hot-reload for both services
   - Mount local directories for easy development

3. Access the application at `http://localhost:3000`

### Production Deployment

1. Ensure you have the production `docker-compose.yml` file

2. Start the services:
   ```bash
   chmod +x scripts/prod-setup.sh
   ./scripts/prod-setup.sh
   ```

3. The application will be available with:
   - Automatic HTTPS via Let's Encrypt
   - Watchtower for automatic updates
   - Traefik as reverse proxy

## Configuration

### Environment Variables

**Backend**:
- `DB_TYPE`: Database type (currently only `sqlite` supported)
- `DB_PATH`: Path to database file
- `NODE_ENV`: Runtime environment (`development` or `production`)

**Frontend**:
- `NODE_ENV`: Runtime environment (`development` or `production`)
- `REACT_APP_API_URL`: Backend API URL (defaults to `http://localhost:3001` in dev)

### Database

By default, the development environment uses a SQLite database stored in `./local_db/fairshare.db`. In production, the database is stored at `/cm/storage/fairshare/fairshare.db`.

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

### Development Workflow

- Use the development Docker Compose setup for local development
- All code changes in `./backend/src` and `./frontend/src` will automatically sync to the containers
- Changes to `package.json` will trigger a rebuild of the respective container
- Format code with Prettier before committing
- Include tests for new features

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

---

For support or questions, please open an issue in the GitHub repository.
