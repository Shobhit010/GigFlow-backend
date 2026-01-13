# GigFlow Backend ⚙️

The backend for **GigFlow** is a robust REST API built with Node.js and Express. It powers the freelance marketplace by managing users, gigs, bids, and real-time notifications. It emphasizes data integrity for the hiring process and secure authentication.

## 🚀 Project Overview

The backend handles all business logic, including the critical **"Atomic Hiring"** workflow that ensures a gig cannot be doubly assigned. It also manages the WebSocket server for real-time updates.

## 🛠️ Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) (with Mongoose)
- **Authentication:** JWT (JSON Web Tokens) stored in HttpOnly Cookies
- **Real-time:** [Socket.io](https://socket.io/)
- **Security:** `bcryptjs` for password hashing, `cors` for cross-origin requests.

## 🏗️ Architecture Overview

The project follows a standard **MVC-like** structure (Models, Views/Routes, Controllers):
- **Middleware:** `authMiddleware.js` verifies JWTs from cookies. `errorMiddleware.js` handles exceptions globally.
- **Controllers:** Contain the core business logic (`placeBid`, `hireFreelancer`, etc.).
- **Routes:** Map HTTP endpoints to controller functions.

## 📦 Database Design (MongoDB)

### Models
1.  **User:** Stores `name`, `email`, `password` (hashed).
2.  **Gig:** Represents a project.
    -   `status`: Enum `['open', 'assigned', 'completed']`.
    -   `budget`: Number.
    -   `user`: Reference to the creator.
3.  **Bid:** Represents a proposal.
    -   `status`: Enum `['pending', 'hired', 'rejected']`.
    -   `amount`: Number.
    -   `freelancer`: Reference to the bidder.
    -   `gig`: Reference to the gig.

## 🔒 Authentication & Security

- **JWT Strategy:** Upon login, a signed JWT is generated and sent as an **HttpOnly** cookie. This prevents XSS attacks from easily stealing the token.
- **Route Protection:** The `protect` middleware checks for this cookie before allowing access to private routes (`/gigs/create`, `/bids`, etc.).

## 🛣️ API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Authenticate user & set cookie | No |
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/logout` | Clear auth cookie | No |

### Gigs
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/api/gigs` | Fetch all open gigs | No |
| POST | `/api/gigs` | Create a new gig | Yes |
| GET | `/api/gigs/my` | Get gigs created by user | Yes |
| GET | `/api/gigs/:id` | Get gig details | Yes |

### Bids
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| POST | `/api/bids` | Place a bid on a gig | Yes |
| GET | `/api/bids/my` | Get my submitted bids | Yes |
| GET | `/api/bids/:gigId` | Get all bids for a gig (Owner only) | Yes |
| **PATCH** | `/api/bids/:bidId/hire` | **Hire a freelancer** | Yes |

## ⚙️ Hiring Logic (Critical)

The hiring process (`hireFreelancer` in `bidController.js`) is critical and uses **MongoDB Transactions** to ensure atomicity. This prevents race conditions where two freelancers could be hired for the same gig.

**Process when "Hire" is clicked:**
1.  **Start Transaction:** A MongoDB session starts.
2.  **Validation:** Checks if the gig is still `open`.
3.  **Update Gig:** Sets `gig.status` to `'assigned'`.
4.  **Update Bid:** Sets the selected bid's status to `'hired'`.
5.  **Reject Others:** Updates **all other bids** for this gig to `'rejected'`.
6.  **Commit:** Saves all changes to the DB at once.
7.  **Notify:** Uses Socket.io to send a real-time event to the hired freelancer.

## ⚡ Real-time Features

- **Connection:** The server listens on the same port as the API.
- **User Mapping:** Maintains a `userSocketMap` (UserId -> SocketId) to target notifications.
- **Events:**
    -   `register`: Clint sends their UserId upon connection.
    -   `notification`: Server sends this when a user is hired.

## 🔧 Environment Variables

Create a `.env` file in the root of `backend`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<your-connection-string>
JWT_SECRET=your_super_secret_key_123
```

## 🏃‍♂️ Running Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Server:**
    ```bash
    npm run dev
    ```
    (Uses `nodemon` for hot-reloading)

3.  **Console Output:**
    You should see:
    ```
    Server running on port 5000
    MongoDB Connected: ...
    ```
