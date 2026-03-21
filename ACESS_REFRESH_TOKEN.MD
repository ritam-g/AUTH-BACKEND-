          ┌───────────────┐
          │   User Login  │
          │ (email/pass)  │
          └───────┬───────┘
                  │
                  ▼
          ┌───────────────┐
          │  Server Auth  │
          │ Validate User │
          └───────┬───────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ Access Token  │       │ Refresh Token │
│ short-lived   │       │ long-lived    │
│ (~15m)        │       │ (~7d)         │
└───────────────┘       └───────────────┘
      │                       │
      │                       │
      │                       │
      │                       ▼
      │             ┌──────────────────┐
      │             │ Saved in Cookie  │
      │             │ httpOnly, Secure │
      │             └──────────────────┘
      │
      ▼
┌───────────────┐
│  Client Req   │
│   (API Call)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Server checks │
│ Access Token  │
└───────┬───────┘
        │
   ┌────┴─────┐
   │ Valid?   │
   ├──────────┤
   │ Yes      │ → Serve Data
   │ No       │
   ▼          │
┌───────────────┐
│ Check Refresh │
│ Token (Cookie)│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Verify Token  │
│ & Generate    │
│ new Access    │
│ Token (and    │
│ optionally    │
│ new Refresh)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Send new      │
│ Access Token  │
│ (and cookie)  │
└───────────────┘
🔹 Key Points from Diagram
Access Token
Short-lived (~15 min)
Stored in memory (not cookie usually) it use in redux or context
Sent in Authorization: Bearer <token> header
Refresh Token
Long-lived (~7 days)
Stored securely in httpOnly cookie
Used only when access token expires
Flow
User logs in → gets both tokens
Access token used for requests
On expiry → client uses refresh token → server issues new access token
Security
Refresh token rotation prevents misuse
httpOnly cookie → not accessible via JS → XSS protection