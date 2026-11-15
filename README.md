# Life RPG

A personal RPG-style life tracker built with React + TypeScript, Express + TypeScript, and MongoDB/Mongoose.

## Stack
- React + Vite + TypeScript
- Express + TypeScript
- MongoDB Atlas + Mongoose
- JWT auth + bcrypt
- Zod validation

## Structure
- `client/` frontend
- `server/` API
- `shared/` reserved for shared types later

## Setup

### Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Set:
- `MONGODB_URI` to your Atlas connection string
- `JWT_SECRET` to a long random secret
- `CLIENT_ORIGIN` to `http://localhost:5173`

### Client
```bash
cd client
npm install
npm run dev
```

The Vite dev server runs at http://localhost:5173.

## Security model
The browser never connects to MongoDB. It talks to the Express API. Every user-owned document is scoped by the authenticated user's ID. The API also applies rate limiting and request validation.

This is an intentionally small MVP. Before public deployment, add HTTPS, production CORS configuration, stronger account recovery/email verification, refresh-token rotation or an established auth provider, logging/monitoring, and a production secrets manager.
