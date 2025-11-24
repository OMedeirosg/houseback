# Session/Token Authentication Guide for Login Flows

This guide explains session-based and token-based authentication patterns for your login system.

## Overview of Authentication Methods

### 1. Session-Based Authentication (Server-Side State)
- Server stores session data in memory/database/Redis
- Client gets session ID in cookie
- Stateful approach

### 2. Token-Based Authentication (Stateless)
- Server creates signed tokens (JWT)
- Client stores token in localStorage/cookies
- Stateless approach

---

## Session-Based Authentication Flow

### How Sessions Work

```
1. User Login → 2. Validate Credentials → 3. Create Session → 4. Send Session ID → 5. Store Session ID
```

### Session Login Implementation

```typescript
// src/services/session-auth.ts
import { v4 as uuidv4 } from 'uuid';

// In-memory session store (use Redis in production)
const sessions: Record<string, { userId: string; email: string; createdAt: Date }> = {};

export const createSession = (userId: string, email: string): string => {
    const sessionId = uuidv4();
    sessions[sessionId] = {
        userId,
        email,
        createdAt: new Date()
    };
    return sessionId;
};

export const validateSession = (sessionId: string) => {
    const session = sessions[sessionId];
    if (!session) return null;
    
    // Check if session expired (24 hours)
    const expirationTime = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - session.createdAt.getTime() > expirationTime) {
        delete sessions[sessionId];
        return null;
    }
    
    return session;
};

export const destroySession = (sessionId: string): boolean => {
    if (sessions[sessionId]) {
        delete sessions[sessionId];
        return true;
    }
    return false;
};
```

### Session Login Controller

```typescript
// src/controllers/session-login.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/connection';
import { createSession } from '../services/session-auth';

export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await db('users').where('email', email).first();
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create session
        const sessionId = createSession(user.id, user.email);

        // Set cookie with session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,    // Prevent XSS attacks
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'strict', // CSRF protection
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;
        
        return res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
```

### Session Authentication Middleware

```typescript
// src/middleware/session-auth.ts
import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../services/session-auth';

export interface AuthenticatedRequest extends Request {
    user?: { userId: string; email: string };
}

export const sessionAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const session = validateSession(sessionId);
    
    if (!session) {
        return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // Attach user info to request
    req.user = {
        userId: session.userId,
        email: session.email
    };

    next();
};
```

---

## Token-Based Authentication (JWT)

### Installing JWT Dependencies

```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### JWT Service Implementation

```typescript
// src/services/jwt-auth.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

export const generateToken = (userId: string, email: string): string => {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

export const verifyToken = (token: string): JWTPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
};

export const refreshToken = (oldToken: string): string | null => {
    const decoded = verifyToken(oldToken);
    if (!decoded) return null;
    
    // Generate new token with same user data
    return generateToken(decoded.userId, decoded.email);
};
```

### JWT Login Controller

```typescript
// src/controllers/jwt-login.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/connection';
import { generateToken } from '../services/jwt-auth';

export const jwtLoginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await db('users').where('email', email).first();
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email);

        // Return user data and token
        const { password: _, ...userWithoutPassword } = user;
        
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
```

### JWT Authentication Middleware

```typescript
// src/middleware/jwt-auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../services/jwt-auth';

export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}

export const jwtAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = decoded;
    next();
};
```

---

## Complete Login Flow Examples

### Frontend Client Examples

#### Using Sessions (Cookie-based)
```typescript
// Login request
const loginWithSession = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: includes cookies
        body: JSON.stringify({ email, password })
    });

    if (response.ok) {
        const data = await response.json();
        console.log('Logged in:', data.user);
        // Session cookie is automatically stored by browser
    }
};

// Authenticated request
const getProfile = async () => {
    const response = await fetch('/api/user/profile', {
        credentials: 'include' // Includes session cookie
    });
    
    return response.json();
};
```

#### Using JWT Tokens
```typescript
// Login request
const loginWithJWT = async (email: string, password: string) => {
    const response = await fetch('/api/auth/jwt-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    });

    if (response.ok) {
        const data = await response.json();
        
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        console.log('Logged in:', data.user);
    }
};

// Authenticated request
const getProfileJWT = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch('/api/user/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return response.json();
};
```

---

## Route Setup Examples

### Session-Based Routes
```typescript
// src/routes/auth.ts
import express from 'express';
import { loginController } from '../controllers/session-login';
import { sessionAuthMiddleware } from '../middleware/session-auth';

const router = express.Router();

// Public routes
router.post('/login', loginController);

// Protected routes
router.get('/profile', sessionAuthMiddleware, (req, res) => {
    res.json({ user: req.user });
});

router.post('/logout', sessionAuthMiddleware, (req, res) => {
    const sessionId = req.cookies.sessionId;
    destroySession(sessionId);
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
});

export default router;
```

### JWT-Based Routes
```typescript
// src/routes/jwt-auth.ts
import express from 'express';
import { jwtLoginController } from '../controllers/jwt-login';
import { jwtAuthMiddleware } from '../middleware/jwt-auth';

const router = express.Router();

// Public routes
router.post('/jwt-login', jwtLoginController);

// Protected routes  
router.get('/profile', jwtAuthMiddleware, (req, res) => {
    res.json({ user: req.user });
});

router.post('/refresh', jwtAuthMiddleware, (req, res) => {
    const newToken = refreshToken(req.headers.authorization!.split(' ')[1]);
    res.json({ token: newToken });
});

export default router;
```

---

## Security Best Practices

### Session Security
```typescript
// Secure session configuration
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' // CSRF protection
    }
}));
```

### JWT Security
```typescript
// Environment variables for JWT
// .env file
JWT_SECRET=your-super-long-random-secret-key-at-least-256-bits
JWT_EXPIRES_IN=24h
```

### Rate Limiting
```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const loginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 attempts per window
    message: {
        error: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Usage
router.post('/login', loginRateLimit, loginController);
```

---

## Sessions vs JWT Comparison

| Feature | Sessions | JWT |
|---------|----------|-----|
| **Storage** | Server-side | Client-side |
| **State** | Stateful | Stateless |
| **Scalability** | Requires sticky sessions | Easily scalable |
| **Security** | More secure (server controls) | Less secure (client holds data) |
| **Performance** | Database/Redis lookup | No server lookup |
| **Logout** | Instant invalidation | Cannot invalidate until expiry |
| **Data Size** | Unlimited session data | Limited by token size |

### When to Use Which?

**Use Sessions when:**
- Maximum security is required
- You need instant logout/revocation
- You have smaller scale applications
- You store lots of user data in session

**Use JWT when:**
- You need to scale across multiple servers
- Building APIs for mobile apps
- Implementing microservices
- Performance is critical

---

## Integration with Your Existing Code

### Adding Login to Your Current Setup

```typescript
// Update your existing auth controller
// src/controllers/auth.ts

// Add login method alongside your existing registerController
export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validation using your existing schema pattern
    const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    });

    const validatedData = loginSchema.safeParse({ email, password });

    if (!validatedData.success) {
        return res.status(400).json({ message: validatedData.error.message });
    }

    try {
        // Find user in your existing database
        const user = await db('users').where('email', email).first();
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Use bcrypt (you already have this)
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Choose your auth method:
        // Option 1: JWT Token
        const token = generateToken(user.id, user.email);
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });

        // Option 2: Session (alternative)
        // const sessionId = createSession(user.id, user.email);
        // res.cookie('sessionId', sessionId, { httpOnly: true });
        // return res.status(200).json({
        //     message: 'Login successful',
        //     user: { id: user.id, name: user.name, email: user.email }
        // });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
```

This guide provides both session and token-based authentication patterns. Choose the approach that best fits your application's requirements. JWT is more common for modern web applications and mobile APIs, while sessions are great for traditional web applications requiring maximum security.