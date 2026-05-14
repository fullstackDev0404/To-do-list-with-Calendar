# TodoPro — Full Stack Todo App

A full-stack todo app with JWT auth, built with React, Node.js, Express, MongoDB, and Docker. Nothing fancy, just a solid foundation that works.

## What's inside

- Sign up / log in with JWT
- Full CRUD for todos — create, edit, delete, check things off
- Dark / light mode toggle
- Responsive UI with Tailwind CSS and some Framer Motion flair
- Docker support for dev and production

## Project layout

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

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router, Axios, Tailwind CSS, Framer Motion, React Toastify |
| Backend | Node.js, Express 5, Mongoose, JWT, bcryptjs |
| Database | MongoDB 7 |
| DevOps | Docker, Docker Compose, Nginx |

---

## Getting started — Docker (easiest way)

1. Clone the repo:
   ```bash
   git clone <repository-url>
   cd todo-app
   ```

2. Copy the example env file and tweak it if needed:
   ```bash
   cp .env.example .env
   ```

3. Spin everything up:
   ```bash
   docker-compose up -d
   ```

4. Open it up:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

To shut it down:
```bash
docker-compose down
```

After making code changes, rebuild:
```bash
docker-compose up -d --build
```

Tail the logs:
```bash
docker-compose logs -f
```

---

## Running locally (no Docker)

### Backend

```bash
cd Backend
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

Your `.env` needs these:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/todo_app_full
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
```

Server runs at http://localhost:5001. No local MongoDB? Just spin up the container for it:

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

Dev server runs at http://localhost:3000.

---

## Environment variables

### Root `.env` — picked up by Docker Compose

```env
PORT=5001
MONGODB_URI=mongodb://mongo:27017/todo_app_full
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
REACT_APP_API_URL=http://localhost:5001/api
```

### Backend `.env` — for local dev only

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/todo_app_full
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-key-change-in-production
```

### Frontend `.env` — for local dev only

```env
REACT_APP_API_URL=http://localhost:5001/api
```

---

## API endpoints

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create a new account |
| POST | `/login` | Log in and get a JWT back |

### Todos — `/api/todos` (needs `Authorization: Bearer <token>`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/get` | Fetch all your todos |
| POST | `/create` | Add a new todo |
| PUT | `/edit/:id` | Update a todo |
| DELETE | `/delete/:id` | Remove a todo |

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
