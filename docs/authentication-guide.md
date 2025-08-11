# Complete Authentication Guide for Node.js

This guide covers everything we discussed about backend authentication, from fundamentals to middleware implementation.

## Table of Contents
1. [Authentication Fundamentals](#authentication-fundamentals)
2. [Password Hashing with bcrypt](#password-hashing-with-bcrypt)
3. [Registration and Login Flow](#registration-and-login-flow)
4. [Authentication State Management](#authentication-state-management)
5. [HTTP Status Codes](#http-status-codes)
6. [Async/Await Deep Dive](#asyncawait-deep-dive)
7. [Return Statement Pattern](#return-statement-pattern)
8. [Try-Catch Error Handling](#try-catch-error-handling)
9. [Separation of Concerns](#separation-of-concerns)
10. [Middleware Fundamentals](#middleware-fundamentals)
11. [Authentication Middleware](#authentication-middleware)
12. [Custom Middleware](#custom-middleware)
13. [Complete Architecture](#complete-architecture)

---

## Authentication Fundamentals

**Authentication** = "Who are you?" (proving identity)
**Authorization** = "What can you do?" (permissions)

Think of it like a nightclub:
- Authentication: Showing your ID to prove you're old enough
- Authorization: Having a VIP wristband to access special areas

---

## Password Hashing with bcrypt

### Why We Hash Passwords

**Never store plain text passwords!** Here's why:

```javascript
// BAD - Never do this!
const user = {
  email: "john@example.com",
  password: "mypassword123" // Anyone with database access can see this!
}

// GOOD - Hashed password
const user = {
  email: "john@example.com", 
  password: "$2b$12$LQv3c1yqBwlVHpPuNK.7Wu.yQj.QkX9Z8fK2Q" // Unreadable hash
}
```

**What is hashing?**
- One-way mathematical function
- Same input = same output
- Can't reverse it to get original password
- bcrypt adds "salt" (random data) to prevent rainbow table attacks

---

## Registration and Login Flow

### Registration Flow:
```
User fills form → Backend validates → Hash password → Save to database → Success response
```

**Step by step:**
1. User submits: `{email: "john@example.com", password: "mypassword123"}`
2. Server validates: email format, password strength
3. Server hashes password: `"mypassword123"` → `"$2b$12$LQv3c1yqB..."`
4. Server saves: `{email: "john@example.com", password: "$2b$12$LQv3c1yqB..."}`
5. Server responds: `{message: "User created successfully"}`

### Login Flow:
```
User submits credentials → Find user → Compare passwords → Create session/token → Success response
```

**Step by step:**
1. User submits: `{email: "john@example.com", password: "mypassword123"}`
2. Server finds user by email in database
3. Server compares: `bcrypt.compare("mypassword123", stored_hash)`
4. If match: create session/token for user
5. Server responds: `{token: "jwt_token_here", user: {...}}`

---

## Authentication State Management

After login, how does the server remember the user is logged in?

### Option 1: Sessions (Server-side storage)
```javascript
// Server stores session data
sessions = {
  "session123": { userId: 1, email: "john@example.com" }
}

// Client gets session ID
response.cookies.set("sessionId", "session123")

// On future requests, server checks:
const sessionId = request.cookies.sessionId;
const user = sessions[sessionId]; // Found? User is logged in
```

### Option 2: JWT Tokens (Stateless)
```javascript
// Server creates signed token containing user info
const token = jwt.sign(
  { userId: 1, email: "john@example.com" }, 
  "secret_key"
);

// Client stores token (localStorage/cookies)
// On future requests, server verifies:
const decoded = jwt.verify(token, "secret_key"); // Valid? User is logged in
```

**Sessions vs JWT:**
- Sessions: Server remembers everything, more secure, can revoke instantly
- JWT: Stateless, scales better, client holds all info

---

## HTTP Status Codes

Think of HTTP status codes like **traffic lights for web communication**:

### The Categories:
- **2xx = Green Light** ✅ "Success, everything worked"
- **4xx = Yellow Light** ⚠️ "Stop, client made a mistake" 
- **5xx = Red Light** 🚨 "Stop, server broke something"

### Specific Codes We Use:

**400 (Bad Request)** - "You sent me garbage data"
```typescript
// User forgot to include email
{ password: "secret123" } // Missing email!
return res.status(400).json({ error: 'Email is required' });
```

**409 (Conflict)** - "That thing already exists"
```typescript
// Trying to register john@test.com twice
return res.status(409).json({ error: 'User already exists' });
```

**201 (Created)** vs **200 (OK)**
```typescript
// 201 = "I made something new for you"
return res.status(201).json({ user: newUser }); // Registration

// 200 = "Here's what you asked for" 
return res.status(200).json({ user: existingUser }); // Login
```

**500 (Internal Server Error)** - "I messed up, not you"
```typescript
// Database crashed, our code has a bug, etc.
return res.status(500).json({ error: 'Something went wrong on our end' });
```

---

## Async/Await Deep Dive

### The Restaurant Analogy

**Synchronous (blocking) approach:**
```javascript
// You sit down and wait
const menu = getMenu(); // Wait 2 minutes for menu
const order = makeOrder(menu); // Wait 20 minutes for food
const bill = payBill(order); // Wait 3 minutes for bill
// Total: 25 minutes of just sitting and waiting
```

**Asynchronous (non-blocking) approach:**
```javascript
// You can do other things while waiting
const menu = await getMenu(); // Get menu, meanwhile chat with friends
const order = await makeOrder(menu); // Order food, meanwhile check your phone  
const bill = await payBill(order); // Pay bill, meanwhile plan next activity
```

### Why Database Operations Need Async

**Database calls take time:**
```javascript
// This takes 50-200ms - that's FOREVER in computer time!
const user = await knex('users').where('email', email).first();
```

**Without async/await, your server would freeze:**
```javascript
// BAD - This blocks everything!
const user = database.getUser(email); // Server frozen for 100ms
// No other users can make requests during this time!
```

**With async/await, server stays responsive:**
```javascript  
// GOOD - Server can handle other requests while waiting
const user = await database.getUser(email);
```

### The await Keyword Explained

```javascript
// await says: "Wait for this promise to finish, then continue"
const hashedPassword = await bcrypt.hash(password, 12);
console.log('Hashing is done!'); // This runs AFTER hashing completes

// Without await, this would be wrong:
const hashedPassword = bcrypt.hash(password, 12); // Returns a Promise, not the actual hash!
console.log(hashedPassword); // Prints: [object Promise] 🤔
```

---

## Return Statement Pattern

This is a **HUGE** source of bugs for beginners.

### The Deadly Mistake (Without Return):
```javascript
export const register = (req, res) => {
    const { email, password } = req.body;
    
    if (!email) {
        res.status(400).json({ error: 'Email required' }); // Sent response
        // BUT FUNCTION CONTINUES EXECUTING! 😱
    }
    
    // This code still runs even after sending the error!
    const user = await createUser(email, password);
    res.status(201).json({ user }); // SECOND RESPONSE! 💥
}
```

**What happens:**
1. User sends request without email
2. Server sends error response: `{ error: 'Email required' }`  
3. Function keeps running (no `return`)
4. Server tries to send success response
5. **CRASH**: "Cannot set headers after they are sent to the client"

### The Correct Pattern (With Return):
```javascript
export const register = (req, res) => {
    const { email, password } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email required' }); 
        // EXIT FUNCTION HERE ✅
    }
    
    // This code only runs if email exists
    const user = await createUser(email, password);
    return res.status(201).json({ user }); // Also return here
}
```

### Early Return Pattern

This pattern is called **"early return"** or **"guard clauses"**:

```javascript
export const register = (req, res) => {
    // Guard clause 1
    if (!req.body.email) {
        return res.status(400).json({ error: 'Email required' });
    }
    
    // Guard clause 2  
    if (!req.body.password) {
        return res.status(400).json({ error: 'Password required' });
    }
    
    // Guard clause 3
    if (req.body.password.length < 6) {
        return res.status(400).json({ error: 'Password too short' });
    }
    
    // Only the "happy path" code remains at the bottom
    // All error cases have already exited
    const user = await createUser(req.body.email, req.body.password);
    return res.status(201).json({ user });
}
```

**Benefits:**
- **Prevents double responses** (the #1 beginner mistake)
- **Reduces nesting** (no deeply nested if-else)
- **Makes logic clearer** (handle bad cases first, good case last)
- **Easier to debug** (each return is a clear exit point)

---

## Try-Catch Error Handling

Think of try-catch like **insurance for your code**.

### Why We Need Try-Catch in Controllers

**Dangerous operations that can fail:**
- Database queries (connection lost, query syntax error)
- Password hashing (memory issues, bcrypt failure)  
- External API calls (network timeout, service down)
- File operations (disk full, permissions)

### The Two Types of Errors

**1. Expected Errors (Handle with if-statements):**
```javascript
// These we can predict and handle gracefully
if (!email) {
    return res.status(400).json({ error: 'Email required' });
}

if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
}
```

**2. Unexpected Errors (Handle with try-catch):**
```javascript
try {
    // Anything could go wrong here!
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await knex('users').insert({...});
    
} catch (error) {
    // Database server crashed? Network went down? Out of memory?
    // We don't know what happened, so handle it generically
    console.error('Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
}
```

### The Security Rule: Never Expose Internal Errors

**WRONG - Security vulnerability:**
```javascript
catch (error) {
    // This exposes database schema, file paths, internal details!
    return res.status(500).json({ error: error.message }); // 🚨 DANGEROUS
}

// User might see: "SQLITE_ERROR: table users has no column named 'pasword'"
// Now they know: we use SQLite, table structure, we have a typo in our code
```

**CORRECT - Generic error message:**
```javascript
catch (error) {
    console.error('Registration error:', error); // Log for developers
    return res.status(500).json({ 
        error: 'Internal server error' // Generic message for users
    });
}
```

---

## Separation of Concerns

This is the **most important architectural concept**.

### The Restaurant Analogy (Complete Version)

**Bad Restaurant (Everything in one place):**
```javascript
// authController.js - DOING TOO MUCH!
export const register = async (req, res) => {
    const { email, password } = req.body;
    
    // Validation logic mixed in
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    
    // Database connection mixed in
    const db = require('knex')({ /* config */ });
    
    // Password hashing logic mixed in
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Database query mixed in
    const user = await db('users').insert({ email, password: hashedPassword });
    
    return res.status(201).json({ user });
};
```

**Problems:**
- ❌ **Hard to test** - How do you test just the validation?
- ❌ **Hard to reuse** - What if you need password hashing elsewhere?
- ❌ **Hard to maintain** - One file does too many different things
- ❌ **Hard to debug** - Where do you look when something breaks?

### The Proper Restaurant (Separated Responsibilities)

**1. Controller = Waiter** (Handles HTTP stuff only)
```javascript
// controllers/authController.js
export const register = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Just validate inputs and call service
        const result = await authService.registerUser(email, password);
        
        return res.status(201).json(result);
    } catch (error) {
        if (error.type === 'VALIDATION_ERROR') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};
```

**2. Service = Kitchen Manager** (Business logic)
```javascript
// services/authService.js
export const registerUser = async (email, password) => {
    // Validate business rules
    await validateUserInput(email, password);
    
    // Check if user exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        throw new Error('User already exists');
    }
    
    // Hash password and create user
    const hashedPassword = await passwordUtils.hash(password);
    const newUser = await userRepository.create(email, hashedPassword);
    
    return { user: newUser };
};
```

**3. Repository = Kitchen Staff** (Database operations)
```javascript
// repositories/userRepository.js
export const findByEmail = async (email) => {
    return await knex('users').where('email', email).first();
};

export const create = async (email, hashedPassword) => {
    const [user] = await knex('users').insert({
        email,
        password: hashedPassword
    }).returning('*');
    
    return user;
};
```

**4. Utils = Kitchen Tools** (Specific utilities)
```javascript
// utils/passwordUtils.js
export const hash = async (password) => {
    return await bcrypt.hash(password, 12);
};

export const compare = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
```

### Why This Separation Matters

**Benefits:**
- **Single Responsibility**: Each layer has one job
- **Testability**: Test each piece independently
- **Reusability**: Use password utils anywhere
- **Maintainability**: Know where to look for bugs

---

## Middleware Fundamentals

Think of middleware as **security guards at a building entrance**:

### The Office Building Scenario
```
User Request → Security Guard 1 → Security Guard 2 → Your Office (Controller)
                    ↓                    ↓                    ↓
               Check ID Badge      Check Appointment     Handle Meeting
```

**Each guard has a specific job:**
- Guard 1: "Do you have a valid ID badge?" (Authentication)
- Guard 2: "Are you allowed in this specific room?" (Authorization)  
- Your Office: "Let's discuss business" (Your Controller)

**If any guard says NO, the person never reaches your office!**

### Basic Middleware Structure

Every middleware function has this signature:
```javascript
const myMiddleware = (req, res, next) => {
    // Do some work
    // Then either:
    
    // 1. Allow request to continue
    next(); // "Go to the next function"
    
    // OR
    
    // 2. Stop request and send response
    return res.status(401).json({ error: 'Access denied' });
};
```

**The `next()` function is the key!**
- Call `next()` = "This request is OK, pass it along"
- Don't call `next()` = "Stop here, send a response"

### Middleware Execution Flow

```javascript
app.post('/api/protected-route',
    loggerMiddleware,       // 1st guard
    authMiddleware,         // 2nd guard  
    validationMiddleware,   // 3rd guard
    myController            // Final destination
);
```

**Example Flow:**

**Step 1: Logger Middleware**
```javascript
const loggerMiddleware = (req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date()}`);
    next(); // ✅ Allow request to continue
};
```

**Step 2: Auth Middleware**
```javascript  
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    
    if (!token) {
        // ❌ STOP HERE - Don't call next()
        return res.status(401).json({ error: 'No token provided' });
    }
    
    // Token exists, verify it
    const user = verifyToken(token);
    if (!user) {
        // ❌ STOP HERE 
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    // ✅ Token is valid, attach user to request
    req.user = user;
    next(); // Continue to next middleware
};
```

**Different Scenarios:**

**Success Path:**
```
Request → Logger (next) → Auth (next) → Validation (next) → Controller ✅
```

**No Token:**
```
Request → Logger (next) → Auth (STOP) → 401 Response ❌
                                      ↑
                             Validation and Controller never run
```

---

## Authentication Middleware

Authentication middleware is like a **bouncer checking IDs at a nightclub**.

### The Problem It Solves

Without middleware, you'd repeat this code in EVERY protected route:
```javascript
// ❌ BAD - Repeating code everywhere
const getUserProfile = (req, res) => {
    // Check token in every controller 😩
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    
    // Finally do the actual work...
    return res.json({ profile: user });
};
```

### The Middleware Solution

**Write the auth logic ONCE:**
```javascript
// middleware/authMiddleware.js
const authMiddleware = (req, res, next) => {
    // 1. Get token from request
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Access token is required' 
        });
    }
    
    try {
        // 2. Verify token (could be JWT, session, etc.)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Attach user info to request object
        req.user = decoded; // Now ALL controllers can access req.user!
        
        // 4. Allow request to continue
        next();
        
    } catch (error) {
        return res.status(401).json({ 
            error: 'Invalid or expired token' 
        });
    }
};
```

**Now your controllers are clean:**
```javascript
// ✅ GOOD - Controllers focus on business logic only
const getUserProfile = (req, res) => {
    // req.user is already available thanks to middleware!
    return res.json({ profile: req.user });
};
```

### How to Use Auth Middleware

**Option 1: Protect individual routes**
```javascript
// Only these specific routes require authentication
app.get('/api/profile', authMiddleware, getUserProfile);
app.put('/api/profile', authMiddleware, updateProfile);

// These routes are public (no middleware)
app.post('/api/login', loginController);
app.post('/api/register', registerController);
```

**Option 2: Protect all routes under a path**
```javascript
// Everything under /api/protected/* requires auth
app.use('/api/protected', authMiddleware);

// These automatically require auth:
app.get('/api/protected/profile', getUserProfile);    
app.get('/api/protected/dashboard', getDashboard);
```

### Different Types of Auth Middleware

**1. Basic Authentication Check**
```javascript
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};
```

**2. Role-Based Authorization**
```javascript  
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
```

**3. Resource Ownership Check**
```javascript
const requireOwnership = (req, res, next) => {
    const resourceUserId = req.params.userId;
    
    if (req.user.id !== resourceUserId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    next();
};
```

---

## Custom Middleware

### The Basic Template
```javascript
const myCustomMiddleware = (req, res, next) => {
    // 1. Do some work (validate, check, modify request)
    
    // 2. Either continue or stop
    if (everythingIsOK) {
        next(); // ✅ Continue to next middleware/controller
    } else {
        return res.status(400).json({ error: 'Something wrong' }); // ❌ Stop here
    }
};
```

### Example 1: Request Logger
```javascript
const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip;
    
    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
    
    // Always continue - we just want to log, not block
    next();
};

// Use it:
app.use(requestLogger); // Logs every request
```

### Example 2: Rate Limiting Middleware
```javascript
// Simple in-memory rate limiting
const requestCounts = {}; // In production, use Redis

const rateLimiter = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const clientIP = req.ip;
        const now = Date.now();
        
        // Clean old entries
        if (!requestCounts[clientIP]) {
            requestCounts[clientIP] = { count: 0, resetTime: now + windowMs };
        }
        
        // Reset counter if window expired
        if (now > requestCounts[clientIP].resetTime) {
            requestCounts[clientIP] = { count: 0, resetTime: now + windowMs };
        }
        
        // Check if over limit
        if (requestCounts[clientIP].count >= maxRequests) {
            return res.status(429).json({ 
                error: 'Too many requests. Try again later.' 
            });
        }
        
        // Increment counter and continue
        requestCounts[clientIP].count++;
        next();
    };
};

// Use it: Max 5 requests per minute
app.use('/api/auth', rateLimiter(5, 60 * 1000));
```

### Example 3: Input Validation Middleware
```javascript
const validateRegistration = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    
    // Email validation
    if (!email) {
        errors.push('Email is required');
    } else if (!email.includes('@')) {
        errors.push('Email must be valid');
    }
    
    // Password validation  
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    
    // If errors exist, stop and send them
    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors 
        });
    }
    
    // Validation passed, continue
    next();
};

// Use it:
app.post('/api/register', validateRegistration, registerController);
```

---

## Complete Architecture

### The Complete Auth Stack
```
HTTP Request
     ↓
🛡️ Middleware Layer
   - Rate Limiting
   - Request Logging  
   - Input Validation
   - Authentication Check
     ↓
🎯 Controller Layer  
   - Handle HTTP requests/responses
   - Call service functions
     ↓  
⚙️ Service Layer
   - Business logic
   - Password hashing
   - User creation/validation
     ↓
💾 Repository Layer
   - Database operations
```

### File Structure
```
src/
├── middleware/
│   ├── index.js              # Export all middleware
│   ├── authMiddleware.js     # JWT verification
│   ├── validation.js         # Input validation
│   ├── rateLimiter.js        # Rate limiting
│   └── errorHandler.js       # Global error handling
├── controllers/
│   ├── authController.js     # Login/register
│   └── userController.js     # User operations
├── services/
│   ├── authService.js        # Auth business logic
│   └── userService.js        # User business logic
├── repositories/
│   └── userRepository.js     # Database operations
├── utils/
│   └── passwordUtils.js      # bcrypt utilities
└── routes/
    ├── authRoutes.js         # Public auth routes
    └── userRoutes.js         # Protected user routes
```

### Complete Example Flow

**Public Routes (No Auth Required):**
```javascript
// src/routes/authRoutes.js
router.post('/register', 
    rateLimiter(5, 15 * 60 * 1000), // Max 5 attempts per 15 minutes
    validateRegistration,            // Check email/password format
    register                        // Create user
);

router.post('/login',
    rateLimiter(10, 15 * 60 * 1000), // Max 10 attempts per 15 minutes
    validateLogin,                   // Check credentials format
    login                           // Verify user
);
```

**Protected Routes (Auth Required):**
```javascript
// src/routes/userRoutes.js
router.get('/profile', 
    authMiddleware,     // Must be logged in
    getProfile         // Get user data
);

router.put('/profile',
    authMiddleware,     // Must be logged in  
    validateProfileUpdate, // Check input format
    updateProfile      // Update user data
);

router.delete('/users/:userId',
    authMiddleware,     // Must be logged in
    requireOwnership,   // Must own the account
    requirePasswordConfirmation, // Extra security
    deleteAccount      // Remove user
);
```

### The Power of This Architecture

**1. Reusability**
- Same auth middleware used everywhere
- Password utils available throughout app

**2. Composability**  
- Stack different middleware as needed
- Mix and match security layers

**3. Separation of Concerns**
- **Middleware**: Cross-cutting concerns (auth, logging, rate limiting)
- **Controllers**: HTTP handling
- **Services**: Business logic  
- **Repositories**: Data access

Each layer has ONE job and does it well!

---

## Summary

You now have a complete understanding of Node.js authentication:

1. **Fundamentals**: Authentication vs authorization, password hashing
2. **Architecture**: Clean separation of concerns across layers  
3. **Controllers**: HTTP handling with proper error patterns
4. **Middleware**: Reusable security guards for your routes
5. **Security**: Proper error handling, rate limiting, input validation

The key is building a **layered, secure, maintainable** system where each piece has a single responsibility.