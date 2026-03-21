User clicks "Logout"
        │
        ▼
Frontend (Browser)
  - Sends request to /logout
  - Browser automatically sends refreshToken cookie
        │
        ▼
Backend (Server)
  1️⃣ Check if refreshToken exists in cookies
        │
        ▼
  2️⃣ Find session in DB where revoked=false
        │
        ▼
  3️⃣ Compare refreshToken from cookie with session.refreshTokenHash using bcrypt.compare
        │
        ├─> ❌ If mismatch → Return 401 "Invalid refresh token"
        │
        ▼
  4️⃣ If match → session.revoked = true
        │
        ▼
  5️⃣ Save session in DB
        │
        ▼
  6️⃣ Clear refreshToken cookie in browser
        │
        ▼
Frontend
  - refreshToken cookie removed
  - Access token in memory will expire naturally
        │
        ▼
Result
  - User cannot generate new access tokens
  - Any API request with old access token will fail after expiration
  - Logout is complete

  🔹 Key Notes from Diagram
Access Token
Stored in memory
Short-lived (~15 min)
Automatically invalid after logout + expiry
Refresh Token
Stored in httpOnly cookie
Long-lived (~7 days)
Revoked in session → cannot generate new access token
Session Model
Tracks refresh tokens
revoked = true → prevents reuse
Provides full control over user sessions
🔹 Analogy
Access token = temporary keycard for office → expires naturally
Refresh token = master key stored at office safe → revoked when you logout
Session DB = office registry → keeps track of all keycards and master keys