# 🏛️ Matrix Corp — Incident Ticketing & Maintenance Module

A production-grade, full-stack incident management system built with **Spring Boot 3** and **React 18**.

---

## 🗂️ Project Structure

```
d:\paf\
├── backend/          ← Spring Boot 3 (Java 17, Maven)
├── frontend/         ← React 18 + Vite
├── start-backend.bat ← One-click backend start (Windows)
├── start-frontend.bat← One-click frontend start (Windows)
└── README.md
```

---

## ⚙️ Prerequisites

| Tool    | Version | Check Command     |
| ------- | ------- | ----------------- |
| Java    | 17+     | `java -version`   |
| Maven   | 3.9+    | `mvn -version`    |
| Node.js | 18+     | `node -v`         |
| MySQL   | 8.0+    | `mysql --version` |

---

## 🚀 Quick Start

### 1️⃣ Configure Database

Edit `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smartcampus_incidents?createDatabaseIfNotExist=true
    username: root # ← your MySQL username
    password: root # ← your MySQL password
```

The database `smartcampus_incidents` will be **created automatically** on first run.

### 2️⃣ Start the Backend

```powershell
# Option A — batch script (Windows)
.\start-backend.bat

# Option B — manual
cd backend
mvn spring-boot:run
```

Backend starts at: **http://localhost:8080/api**
Swagger UI: **http://localhost:8080/api/swagger-ui.html**

### 3️⃣ Start the Frontend

```powershell
# Option A — batch script (Windows)
.\start-frontend.bat

# Option B — manual
cd frontend
npm install
npm run dev
```

Frontend opens at: **http://localhost:5173**

---

## 🔐 Authentication

The API uses **JWT Bearer tokens**. All endpoints except `/api/auth/**` require a valid token.

### Register & Login

```http
POST /api/auth/register
Content-Type: application/json

{
  "name":       "John Smith",
  "email":      "john@campus.edu",
  "password":   "Password1",
  "phone":      "+911234567890",
  "department": "Engineering",
  "role":       "USER"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email":    "john@campus.edu",
  "password": "Password1"
}
```

Response includes `accessToken` — use as `Authorization: Bearer <token>`.

> **Note:** `ADMIN` accounts must be created directly in the database. Registration only allows `USER` and `TECHNICIAN` roles.

---

## 📡 API Endpoints

| Method   | Endpoint                                 | Role(s)           | Description                  |
| -------- | ---------------------------------------- | ----------------- | ---------------------------- |
| `POST`   | `/api/auth/register`                     | Public            | Create account               |
| `POST`   | `/api/auth/login`                        | Public            | Login, get JWT               |
| `GET`    | `/api/users/me`                          | All               | Get current user profile     |
| `GET`    | `/api/users/technicians`                 | ADMIN             | List active technicians      |
| `POST`   | `/api/tickets`                           | USER, ADMIN       | Create ticket                |
| `GET`    | `/api/tickets`                           | All               | List tickets (role-filtered) |
| `GET`    | `/api/tickets/{id}`                      | All               | Get ticket details           |
| `PATCH`  | `/api/tickets/{id}/status`               | ADMIN, TECHNICIAN | Update ticket status         |
| `PUT`    | `/api/tickets/{id}/assign`               | ADMIN             | Assign technician            |
| `DELETE` | `/api/tickets/{id}`                      | ADMIN             | Delete ticket                |
| `POST`   | `/api/tickets/{id}/attachments`          | USER, ADMIN       | Upload images (multipart)    |
| `GET`    | `/api/tickets/{id}/attachments/{fileId}` | All               | Download/view attachment     |
| `POST`   | `/api/tickets/{id}/comments`             | All               | Add comment                  |
| `GET`    | `/api/tickets/{id}/comments`             | All               | Get all comments             |
| `PUT`    | `/api/tickets/{id}/comments/{cId}`       | Comment owner     | Edit comment                 |
| `DELETE` | `/api/tickets/{id}/comments/{cId}`       | Owner or ADMIN    | Delete comment               |
| `GET`    | `/api/notifications`                     | All               | Get my notifications         |
| `GET`    | `/api/notifications/unread-count`        | All               | Get unread count             |
| `PATCH`  | `/api/notifications/{id}/read`           | All               | Mark notification as read    |
| `PATCH`  | `/api/notifications/read-all`            | All               | Mark all as read             |

---

## 🔄 State Machine

```
OPEN  ──→  IN_PROGRESS  ──→  RESOLVED  ──→  CLOSED
  │                │
  └──────────────→ REJECTED
```

| Transition             | Who Can Do It              | Extra Requirement             |
| ---------------------- | -------------------------- | ----------------------------- |
| OPEN → IN_PROGRESS     | ADMIN (via assign)         | Must assign a TECHNICIAN      |
| IN_PROGRESS → RESOLVED | TECHNICIAN (assigned only) | Must provide resolution notes |
| RESOLVED → CLOSED      | ADMIN or ticket creator    | —                             |
| OPEN → REJECTED        | ADMIN                      | Must provide rejection reason |
| IN_PROGRESS → REJECTED | ADMIN                      | Must provide rejection reason |

Invalid transitions return **HTTP 422 Unprocessable Entity**.

---

## 📤 Sample API Requests

### Create a Ticket (USER)

```http
POST /api/tickets
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "title":          "AC not working in Room 204",
  "description":    "The air conditioning unit in Room 204, Block A has been malfunctioning for 3 days. Temperature is very high and affecting students.",
  "category":       "HVAC",
  "location":       "Block A, Floor 2, Room 204",
  "priority":       "HIGH",
  "contactDetails": "+91 9876543210"
}
```

### Assign Technician (ADMIN)

```http
PUT /api/tickets/1/assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "technicianId": 5
}
```

### Update Status to RESOLVED (TECHNICIAN)

```http
PATCH /api/tickets/1/status
Authorization: Bearer <technician_token>
Content-Type: application/json

{
  "newStatus":       "RESOLVED",
  "resolutionNotes": "Replaced the compressor unit and recharged refrigerant. System is now functioning normally. Tested for 2 hours."
}
```

### Upload Images

```http
POST /api/tickets/1/attachments
Authorization: Bearer <user_token>
Content-Type: multipart/form-data

files=@image1.jpg
files=@image2.jpg
```

### Reject a Ticket (ADMIN)

```http
PATCH /api/tickets/1/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "newStatus":       "REJECTED",
  "rejectionReason": "This issue falls under the jurisdiction of the external contractor. Please contact facilities@campus.edu directly."
}
```

---

## 🗄️ Database Schema

Tables auto-created by Hibernate:

| Table           | Key Columns                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `users`         | id, name, email, password, role, phone, department, active                                  |
| `tickets`       | id, title, description, category, location, status, priority, created_by_id, assigned_to_id |
| `comments`      | id, content, ticket_id, author_id, created_at, updated_at                                   |
| `attachments`   | id, original_file_name, stored_path, content_type, file_size, ticket_id                     |
| `notifications` | id, recipient_id, message, type, ticket_id, is_read, created_at                             |

---

## 🏗️ Architecture Patterns Used

| Pattern                   | Implementation                                       |
| ------------------------- | ---------------------------------------------------- |
| Layered Architecture      | Controller → Service → Repository                    |
| State Machine             | `VALID_TRANSITIONS` map in `TicketServiceImpl`       |
| Repository Pattern        | Spring Data JPA interfaces                           |
| DTO Pattern               | Request DTOs / Response DTOs separated from entities |
| Global Exception Handling | `@RestControllerAdvice` in `GlobalExceptionHandler`  |
| JWT Stateless Auth        | `JwtAuthenticationFilter` + `JwtTokenProvider`       |
| Async Notifications       | `@Async` on notification methods (`@EnableAsync`)    |
| Protected Routes          | `ProtectedRoute` component in React                  |
| Context + Hooks           | `AuthContext`, `NotificationContext` with polling    |
| Optimistic UI updates     | Comments update locally before server confirm        |

---

## 🎨 Frontend Pages

| Page          | Route          | Description                          |
| ------------- | -------------- | ------------------------------------ |
| Login         | `/login`       | JWT auth with show/hide password     |
| Register      | `/register`    | Role selection (USER / TECHNICIAN)   |
| Dashboard     | `/dashboard`   | Stats overview, recent tickets       |
| Ticket List   | `/tickets`     | Paginated, filtered, URL-synced      |
| Create Ticket | `/tickets/new` | 4-step wizard with image upload      |
| Ticket Detail | `/tickets/:id` | Full detail, state actions, comments |

---

## 🔒 Security Best Practices

- Passwords hashed with **BCrypt (cost 12)**
- JWT tokens with configurable expiry (default 24h)
- Role-based API access enforced at **service layer**, not just controller
- Path traversal prevention in file upload
- MIME type validation for uploads
- ADMIN accounts cannot be created via public registration endpoint
- Global 401 → auto-logout in Axios interceptor

---

## 📁 File Storage

Uploaded files are stored at:

```
backend/uploads/tickets/{ticketId}/{uuid}.{ext}
```

Served via: `GET /api/tickets/{id}/attachments/{fileId}`

> For production: replace `FileStorageServiceImpl` with an AWS S3 adapter.

---
