# Wayfarer

A responsive travel-planning workspace with a React/TypeScript frontend and a layered Spring Boot/PostgreSQL API.

## Run the frontend

Requirements: Node.js 20 or newer and npm.

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). The dashboard works without the API or external travel services: it includes sample trips, and saves trip and itinerary changes and saved places in your browser's local storage.

Create a production build with `npm run build` from `frontend/`.

## Run the backend

Requirements: Java 21, Maven 3.9 or newer, and a running PostgreSQL database.

1. Create a PostgreSQL database named `wayfarer` and note your database username and password.
2. In PowerShell, set the connection settings in the same terminal session where you will start the API:

   ```powershell
   $env:DATABASE_URL = "jdbc:postgresql://localhost:5432/wayfarer"
   $env:DATABASE_USERNAME = "postgres"
   $env:DATABASE_PASSWORD = "<your-local-postgres-password>"
   $env:FRONTEND_ORIGIN = "http://localhost:5173"
   ```

3. Start the API:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

The API listens on `http://localhost:8080`. Run backend tests with `mvn test` from `backend/`. Hibernate creates/updates the development schema automatically. Do not use `spring.jpa.hibernate.ddl-auto=update` as a production database migration strategy.

## API overview

All endpoints are under `/api`:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signup` | Create an account; passwords must contain at least 8 characters |
| `POST` | `/auth/login` | Check email and password |
| `GET` | `/trips` | List trips |
| `GET` | `/trips/{id}` | Get a trip and its destinations and activities |
| `POST` | `/trips` | Create a trip |
| `PUT` | `/trips/{id}` | Replace trip details |
| `PATCH` | `/trips/{id}/status` | Update trip status |
| `POST` | `/trips/{id}/duplicate` | Duplicate a trip |
| `DELETE` | `/trips/{id}` | Delete a trip |

Trip request bodies include `name`, `startDate`, `endDate`, `totalBudget`, `currency`, `travellerCount`, `status`, `destinations`, and optional `activities`. Dates use `YYYY-MM-DD`; activity times use `HH:mm:ss`. The API validates request DTOs and does not expose JPA entities directly.

## Current scope

The frontend is a self-contained planning demo and is **not yet connected to the API**; its local-storage data is separate from the PostgreSQL-backed API data. The API's signup/login endpoints are an MVP credential check only: passwords are BCrypt-hashed, but authentication tokens/sessions, endpoint authorization, account ownership, and a frontend sign-in flow are not implemented. Bookings and expenses are represented in the interface but do not yet have backend persistence.
