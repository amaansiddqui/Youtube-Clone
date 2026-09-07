# YouTube Clone

A responsive YouTube-style video platform built with React, Redux Toolkit, Vite, and Express. The project includes a home feed, search and category filters, video playback, channel pages, authentication, comments, reactions, subscriptions, and creator video management.

## Project Purpose

This project is an educational full-stack application for practicing:

- React component composition and responsive layouts
- Redux Toolkit state management and memoized selectors
- REST API design with Express
- MongoDB persistence with a JSON database fallback
- Client-side routing with the browser History API
- Local-first development and offline-friendly behavior

## Features

- Responsive home feed with video cards and category chips
- Search across video titles, channels, and descriptions
- Custom HTML5 video player with playback controls and fullscreen mode
- Channel pages with banners, profiles, tabs, subscriptions, and creator actions
- Sign-in and registration flow with JWT support when the backend is available
- Likes, dislikes, comments, comment editing, and comment deletion
- Video upload, editing, and deletion for channel owners
- Recommended videos on the watch page
- Mobile navigation drawer and responsive desktop sidebar
- Automatic localStorage fallback when the backend is offline

## Technology Stack

**Frontend**

- React 19
- Redux Toolkit and React Redux
- Vite
- Tailwind CSS
- ESLint

**Backend**

- Node.js with Express
- MongoDB through Mongoose
- JWT authentication
- CORS
- JSON file persistence for zero-configuration development

## Repository Structure

```text
Backend/
	config/       MongoDB connection and startup data healing
	data/         JSON database and seed data
	middleware/   Authentication middleware
	models/       Mongoose models
	routes/       Authentication, video, and channel APIs
	server.js     Express application entry point

Frontend/
	src/components/  UI components and page views
	src/data/        Local sample video data
	src/store/       Redux store and slices
	src/utils/       API client, local services, auth, and formatters
	src/App.jsx      Application layout and client-side routing
	src/App.css      Shared responsive styles
```

## Project Setup

### 1. Prerequisites

- Node.js 18 or newer
- npm
- MongoDB is optional. The backend automatically falls back to `Backend/data/database.json` when MongoDB is unavailable.

### 2. Install Dependencies

Install dependencies separately for the frontend and backend from the repository root:

```powershell
cd Backend
npm install

cd ..\Frontend
npm install
```

### 3. Configure the Backend (Optional)

The backend works without MongoDB by using the JSON database fallback. To use MongoDB, set the connection string before starting the server:

```powershell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/youtube_clone"
$env:PORT = "5000"
```

### 4. Start the Development Servers

Open two terminals from the repository root.

**Terminal 1: Backend API**

```powershell
cd Backend
npm run dev
```

The API runs at `http://127.0.0.1:5000`.

**Terminal 2: Frontend**

```powershell
cd Frontend
npm run dev
```

Vite prints the local frontend URL, normally `http://localhost:5173`.

Open the Vite URL in a browser to use the application.

### 5. Verify the Setup

Check the backend health endpoint:

```text
http://127.0.0.1:5000/api/health
```

The endpoint should return a JSON response with `status: "ok"`. The frontend should then load the video feed and connect to the API.

## Configuration Reference

The backend supports these environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | Express server port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/youtube_clone` | MongoDB connection string |

## API Overview

The frontend API client uses `http://127.0.0.1:5000/api`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check backend availability |
| `GET` | `/api/videos` | List videos, with optional search/category filters |
| `GET` | `/api/videos/:id` | Fetch one video and user reaction status |
| `POST` | `/api/videos` | Create a video |
| `PUT` | `/api/videos/:id` | Update video metadata |
| `DELETE` | `/api/videos/:id` | Delete a video |
| `GET` | `/api/channels/:id` | Fetch a channel |
| `GET` | `/api/auth/...` | Register, sign in, and manage users |

The exact request and response handling lives in `Frontend/src/utils/api.js`; route-specific behavior lives under `Backend/routes/`.

## Data and Persistence

When MongoDB is connected, the backend reads and writes MongoDB collections. When it is unavailable, the backend uses `Backend/data/database.json` in memory and persists changes back to that file.

The frontend also maintains a local cache in browser localStorage. This allows browsing and basic interactions to continue when the API is offline. Clear the site storage in browser developer tools to reset local cached videos, users, reactions, and subscriptions.

## Useful Commands

Run these from the relevant project directory:

```powershell
# Frontend production build
cd Frontend
npm run build

# Frontend linting
npm run lint

# Preview the production build
npm run preview
```

## Troubleshooting

**The frontend cannot reach the API**

Confirm the backend is running on port 5000. The frontend will use localStorage fallback behavior, but server-backed synchronization will be unavailable.

**MongoDB connection warnings appear**

MongoDB is optional. Start MongoDB and set `MONGODB_URI`, or continue using the JSON database fallback.

**A video or thumbnail URL is stale**

Restart the backend after changing seed data. The frontend also repairs known stale cached media URLs when local data is loaded.

**The frontend uses another Vite port**

Port 5173 is already occupied when another Vite process is running. Use the URL printed by Vite, or stop the existing process before restarting the dev server.

## Documentation Conventions

Comments are kept near behavior that is not obvious from the code, especially API fallback logic, persistence synchronization, authentication, and media recovery. Component names describe their UI responsibility, while service and slice modules own data access and state transitions.