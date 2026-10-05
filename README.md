# Student Complaint Management System (MERN)

Web app for students to file campus complaints and for staff/admin to track them until they are closed.

## Stack

- **MongoDB** — users and complaints
- **Express** — REST API on port 5000
- **React** (Vite) — UI on port 5173
- **Node.js** — backend runtime

## Features

- Student register / login (JWT)
- File complaints (category, priority, description)
- Track status: Pending → In Progress → Resolved / Rejected
- Comments on a ticket
- Admin: view all tickets, assign staff, change status
- Staff: work only on assigned tickets
- Dashboard counts by status

## Setup

You need Node.js and MongoDB running locally (or a MongoDB Atlas URI).

### 1. Backend

```bash
cd backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

Default Mongo URI in `.env` is `mongodb://127.0.0.1:27017/student_complaints`.

Demo accounts after seed:

| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@campus.edu   | admin123  |
| Staff | staff@campus.edu   | admin123  |

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Students create their own accounts from **Register**. Admin and staff accounts are created with the seed script.
