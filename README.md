# TodoPro — Full Stack Todo Application

A full-stack todo app with JWT authentication, built with React, Node.js, Express, MongoDB, and Docker.

## Features

- User registration and login with JWT
- Full CRUD for todos (create, edit, delete, mark complete)
- Dark / light mode toggle
- Responsive UI with Tailwind CSS and Framer Motion animations
- Docker support for both development and production

## Project Structure

```
todo-app/
├── Backend/
│   ├── src/
│   │   ├── config/db.js           # MongoDB connection
│   │   ├── middleware/            # JWT auth middleware
│   │   ├── models/                # Mongoose models (User, Todo)
│   │   └── routes/                # API routes (auth, todos)
│   ├── server.js                  # Entry point
│   ├── Dockerfile
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── api/                   # Axios client + todo API calls
│   │   ├── components/            # TodoTable, TodoModal, Particles
│   │   ├── pages/                 # Login, Register, Dashboard
│   │   └── App.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── docker-compose.override.yml    # Dev overrides (hot reload, volumes)
└── .env.example
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router, Axios, Tailwind CSS, Framer Motion, React Toastify |
| Backend | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| Database | MongoDB 7 |
| DevOps | Docker, Docker Compose, Nginx |

---

## Quick Start — Docker (Recommended)

1. Clone the repo:
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. Copy and configure the environment file:
   ```bash
   cp .env.example .env
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Open the app:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

To stop:
```bash
docker-compose down
```

To rebuild after code changes:
```bash
docker-compose up -d --build
```

View logs:
```bash
docker-compose logs -f
```

---

## Local Development (without Docker)

### Backend

```bash
cd Backend
npm install
cp .env.example .env   # then edit .env
npm run dev
```

Required `.env` values:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/todo_app_full
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
```

Server starts at http://localhost:5001. If you don't have MongoDB installed locally, you can spin up just the DB container:

```bash
docker run -d -p 27017:27017 --name todo-mongo mongo:7
```

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env   # optional, defaults to http://localhost:5001/api
npm start
```

Optional `.env` value:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

Dev server starts at http://localhost:3000.

---

## Environment Variables

### Root `.env` — used by Docker Compose

```env
PORT=5001
MONGODB_URI=mongodb://mongo:27017/todo_app_full
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
REACT_APP_API_URL=http://localhost:5001/api
```

### Backend `.env` — used for local development only

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/todo_app_full
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
```

### Frontend `.env` — used for local development only

```env
REACT_APP_API_URL=http://localhost:5001/api
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login and receive a JWT |

### Todos — `/api/todos` (all require `Authorization: Bearer <token>`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/get` | Get all todos for the logged-in user |
| POST | `/create` | Create a new todo |
| PUT | `/edit/:id` | Update a todo |
| DELETE | `/delete/:id` | Delete a todo |

---

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start without nodemon |

### Frontend

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server |
| `npm run build` | Production build |
| `npm test` | Run tests |

---

## License

ISC
