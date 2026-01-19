# Habit Tracker Setup Instructions

## Prerequisites
1. Install MongoDB locally or use MongoDB Atlas
2. Install Node.js

## Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MongoDB service (if using local MongoDB):
   ```bash
   mongod
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   Server will run on http://localhost:5000

## Frontend Setup
1. Navigate to main directory:
   ```bash
   cd ..
   ```

2. Install frontend dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```

## Database Structure

### Users Collection
- username (String, unique)
- email (String)
- password (String, not encrypted)
- createdAt (Date)

### UserData Collection
- userId (ObjectId, reference to User)
- tasks (Array of Strings)
- checkedTasks (Map of Boolean values)
- month (Number)
- year (Number)
- updatedAt (Date)

## API Endpoints
- POST /api/register - Register new user
- POST /api/login - Login user
- POST /api/savedata - Save user tasks and progress
- GET /api/getdata/:userId/:month/:year - Get user data for specific month/year