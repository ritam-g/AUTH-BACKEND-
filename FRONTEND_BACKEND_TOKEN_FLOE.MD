User Login
   │
   ▼
Frontend (React)
  - Send email/password
   │
   ▼
Backend (Server)
  - Validate user
  - Create Access Token (short-lived)
  - Create Refresh Token (long-lived)
   │
   ├─> Send Access Token (JSON)
   └─> Send Refresh Token (httpOnly cookie)
   │
   ▼
Frontend stores:
  - Access Token in memory
  - Refresh Token is managed automatically by browser

---------------------- API Requests ----------------------
Frontend request → includes Access Token in Authorization header
Backend verifies:
  ├─> If access token valid → return data
  └─> If access token expired → 401 → call /refresh-token

---------------------- Refresh Token Flow ----------------------
Frontend → /refresh-token (browser sends cookie)
Backend:
  - Verify refresh token
  - Create new Access Token
  - Create new Refresh Token (rotate)
Backend sends:
  - New Access Token (JSON)
  - New Refresh Token (httpOnly cookie)
Frontend:
  - Update memory with new Access Token
  - Retry original request