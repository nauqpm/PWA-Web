# News App Backend

This is the backend server for the News PWA application, built with Node.js, Express, and MongoDB.

## Features

- User authentication (register, login, profile management)
- News article management (CRUD operations)
- Category management
- Like/Unlike articles
- Comments on articles
- Search functionality
- Pagination

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/news-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Start MongoDB service on your machine

4. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth - Get authenticated user
- PUT /api/auth/profile - Update user profile
- PUT /api/auth/password - Change password

### News
- GET /api/news - Get all news articles (with pagination)
- GET /api/news/:id - Get news article by ID
- POST /api/news - Create a news article
- PUT /api/news/:id - Update a news article
- DELETE /api/news/:id - Delete a news article
- PUT /api/news/like/:id - Like/Unlike a news article
- POST /api/news/comment/:id - Comment on a news article

### Categories
- GET /api/categories - Get all categories
- GET /api/categories/:id - Get category by ID
- POST /api/categories - Create a category
- PUT /api/categories/:id - Update a category
- DELETE /api/categories/:id - Delete a category

## Security

- JWT authentication
- Password hashing with bcrypt
- Input validation
- Protected routes
- Role-based access control

## Error Handling

The API uses a consistent error response format:
```json
{
  "errors": [
    {
      "msg": "Error message"
    }
  ]
}
```

## Development

To start the development server with hot reloading:
```bash
npm run dev
```

## Production

To start the production server:
```bash
npm start
``` 