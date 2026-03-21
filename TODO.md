# AUTH Backend Fix TODO

## Approved Plan Steps (To be completed step-by-step)

1. ✅ [Complete] Create TODO.md for tracking.

2. ✅ Create new middleware files:
   - `src/middleware/auth.js` (JWT protect middleware)
   - `src/middleware/validators.js` (validation schemas for register/login)
   - `src/middleware/error.js` (global error handler)

3. ✅ Update `src/config/database.js` (fix config, add error handling)

4. ✅ Update `src/model/user.model.js` (add timestamps, indexes)

5. ✅ Update `src/app.js` (add helmet, cors, rate limit, global error handler)

6. [Pending] Update `src/controller/auth.controller.js` (bcrypt, fix config, add protect middleware, implement missing routes with stubs)

7. [Pending] Update `src/routes/auth.routes.js` (apply middleware to protected routes)

8. [Pending] Update `server.js` (graceful shutdown)

9. [Pending] Test changes: npm install (if deps), node server.js, test endpoints.

10. [Pending] Final cleanup, attempt_completion.

**Progress: 5/10**
