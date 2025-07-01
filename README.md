# DeployWebTest

A full-stack web application with a React frontend and Node.js/Express backend, featuring Progressive Web App (PWA) capabilities.

## Features

### Frontend
- React-based Progressive Web App (PWA)
- Responsive and modern user interface
- Client-side routing with React Router
- Service Worker support for offline capabilities
- Web Vitals monitoring for performance optimization

### Backend
- RESTful API built with Express.js
- MongoDB database integration with Mongoose
- User authentication with JWT
- Password encryption using bcrypt
- Input validation with express-validator
- CORS support for cross-origin requests
- Web Push notifications support
- Environment variable configuration

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4.4 or higher)
- Git

## Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   npm install web-push
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   npm install react-router-dom
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Development

### Backend Development
- The backend follows a modular structure:
  - `routes/`: API route definitions
  - `models/`: MongoDB schema definitions
  - `middleware/`: Custom middleware functions
  - `services/`: Business logic and service functions
  - `server.js`: Main application entry point

### Frontend Development
- The frontend is organized as follows:
  - `src/`: Source code directory
  - `public/`: Static assets and PWA configuration
  - `src/components/`: Reusable React components
  - `src/pages/`: Page components
  - `src/services/`: API service functions

## Production

### Backend Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```

2. The build output will be in the `build/` directory, ready for deployment to your hosting service.

## Code Flow

### Backend Flow
1. Request comes in through Express routes
2. Middleware processes the request (authentication, validation)
3. Route handlers call appropriate services
4. Services interact with the database through models
5. Response is sent back to the client

### Frontend Flow
1. User interacts with the React application
2. Components make API calls through service functions
3. State updates trigger re-renders
4. Service Worker handles offline capabilities
5. PWA features provide native-like experience

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
