[Ver001.000]
# JWT Authentication System

## Overview

This document describes the JWT authentication system implemented for the SATOR API.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  FastAPI Server │────▶│   PostgreSQL    │
│                 │     │                 │     │                 │
│ - Bearer Token  │◀────│ - JWT Verify    │◀────│ - Users Table   │
│ - Auto-refresh  │     │ - RBAC Check    │     │ - Refresh Store │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Components

### 1. Backend (Python/FastAPI)

**Files:**
- `src/auth/auth_utils.py` - JWT token handling, password hashing
- `src/auth/auth_schemas.py` - Pydantic models for auth
- `src/auth/auth_routes.py` - Login, register, refresh endpoints
- `migrations/018_users_auth.sql` - Database schema

**Features:**
- JWT access tokens (15 min expiry)
- JWT refresh tokens (7 day expiry)
- Bcrypt password hashing
- RBAC permissions system
- Token revocation on logout

### 2. Frontend (TypeScript/React)

**Files:**
- `apps/website-v2/src/lib/api-client.ts` - API client with Bearer token injection
- `apps/website-v2/src/stores/authStore.ts` - Zustand auth state store

**Features:**
- Automatic token storage in localStorage
- Automatic Bearer token injection on API requests
- Automatic token refresh before expiry
- Automatic logout on 401 errors

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create new account | No |
| POST | `/auth/login` | Login, get tokens | No |
| POST | `/auth/refresh` | Refresh access token | No (refresh token) |
| POST | `/auth/logout` | Revoke refresh token | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| PATCH | `/auth/me` | Update profile | Yes |
| POST | `/auth/password/change` | Change password | Yes |
| POST | `/auth/password/reset-request` | Request reset email | No |
| POST | `/auth/password/reset` | Reset with token | No |

### Protected Services

All service endpoints now require authentication where appropriate:

**Tokens API:**
- `GET /api/tokens/balance` - Requires auth (your balance)
- `GET /api/tokens/balance/{user_id}` - Public (any user's balance)
- `POST /api/tokens/claim-daily` - Requires auth

**Forum API:**
- `GET /api/forum/threads` - Public (optional auth for personalization)
- `POST /api/forum/threads` - Requires auth
- `POST /api/forum/threads/{id}/posts` - Requires auth

**Fantasy API:**
- `GET /api/fantasy/leagues` - Public
- `POST /api/fantasy/leagues` - Requires auth
- `GET /api/fantasy/teams/my` - Requires auth

**Challenges API:**
- `GET /api/challenges/daily` - Public
- `POST /api/challenges/{id}/submit` - Requires auth
- `GET /api/challenges/user/streak` - Requires auth

**Wiki API:**
- `GET /api/wiki/articles` - Public
- `POST /api/wiki/articles` - Requires auth

**OPERA API:**
- `GET /api/opera/tournaments` - Public
- All admin endpoints require `admin` permission

## Environment Variables

```bash
# Required for JWT
JWT_SECRET_KEY=your-secret-key-min-32-characters

# Optional (defaults shown)
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

### Permissions Table (RBAC)
```sql
CREATE TABLE user_permissions (
    user_id VARCHAR(50) REFERENCES users(id),
    permission VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, permission)
);
```

Default permissions for new users:
- `user` - Basic user access
- `forum_read` - Read forum posts
- `forum_write` - Create posts/threads
- `fantasy_play` - Participate in fantasy leagues

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    token TEXT NOT NULL,
    user_id VARCHAR(50) REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE
);
```

## Usage Examples

### Login
```typescript
import { authApi } from '@/lib/api-client';

const { user, tokens } = await authApi.login('username', 'password');
// Tokens automatically stored, user in auth store
```

### Making Authenticated Requests
```typescript
import { tokensApi, forumApi } from '@/lib/api-client';

// Tokens automatically injected
const balance = await tokensApi.getBalance();
const threads = await forumApi.getThreads(1);
```

### Using Auth Store
```typescript
import { useAuthStore, useUser, useIsAuthenticated } from '@/stores/authStore';

// In components
const user = useUser();
const isAuthenticated = useIsAuthenticated();

// Actions
const { login, logout } = useAuthStore();
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Storage**: Tokens stored in localStorage (XSS risk) - consider httpOnly cookies for production
3. **Token Expiry**: Short-lived access tokens (15 min) with refresh tokens (7 days)
4. **Password Policy**: Minimum 8 characters, bcrypt hashed
5. **Rate Limiting**: Implement rate limiting on auth endpoints (planned)
6. **CORS**: Configured for GitHub Pages and localhost

## Migration

Run migration to create auth tables:
```bash
psql $DATABASE_URL -f packages/shared/api/migrations/018_users_auth.sql
```

Default admin user created:
- Username: `admin`
- Password: `admin123` (change immediately!)

## Testing

```bash
# Start the API
cd packages/shared/api
python main.py

# Test endpoints
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test12345","password_confirm":"test12345"}'

curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test12345"}'

# Use token
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer <access_token>"
```
