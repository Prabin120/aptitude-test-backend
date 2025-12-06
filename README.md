# Aptitude Test Backend

Backend service for the Aptitude Test application, built with Node.js, Express, and TypeScript. This service handles authentication, user profiles, test management, and more.

## Features

- **Authentication**: Secure user authentication using JWT (Access & Refresh tokens) and Google OAuth.
- **User Profile**: Manage user profiles and settings.
- **Aptitude Tests**: Create, manage, and take aptitude tests.
- **Group Tests**: Support for group-based testing scenarios.
- **Feedback**: System for collecting and managing user feedback.
- **Rewards**: Reward system integration.
- **Services**: Additional utility services.
- **Rate Limiting**: Protection against abuse using `express-rate-limit` and `express-slow-down`.
- **Logging**: Comprehensive logging with `winston`.

## Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose)
- **Caching**: [Redis](https://redis.io/)
- **Authentication**: Passport.js, JSON Web Tokens (JWT)
- **Validation**: Joi (implied/common practice, or manual validation)
- **Containerization**: Docker

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd aptitude-test-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory. You can use `example.env` as a reference:

```bash
cp example.env .env
```

Update the variables in `.env` with your local configuration (Database URI, Secrets, API Keys, etc.).

### Running the Application

**Development Mode:**

To run the application in development mode with hot-reloading:

```bash
npm run dev
```

**Production Build:**

To build and start the application for production:

```bash
npm run build
npm start
```

**Docker:**

To build and run using Docker:

```bash
docker build -t aptitude-backend .
docker run -p 8000:8000 --env-file .env aptitude-backend
```

## API Endpoints

The API is prefixed with `/p/api/v1`. Here are the main route groups:

- **Auth**: `/p/api/v1/auth` - Authentication routes (Login, Register, OAuth)
- **User**: `/p/api/v1/user` - User profile management
- **Test**: `/p/api/v1/test` - Test related operations
- **Aptitude**: `/p/api/v1/aptitude` - Aptitude specific routes
- **Group Test**: `/p/api/v1/group-test` - Group testing features
- **Feedback**: `/p/api/v1/feedback` - Feedback submission
- **Services**: `/p/api/v1/services` - Miscellaneous services
- **Reward**: `/p/api/v1/reward` - Reward system

**Health Check:**
- `GET /p/health` - Check if the server is running.

## Testing

Run the test suite using Jest:

```bash
npm test
```
