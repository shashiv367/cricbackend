# Cricapp Backend API Documentation

## Base URL
`http://localhost:4000/api` (or your configured port)

## Authentication
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### POST `/api/auth/signup`
Create a new user account with role selection.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user|player|umpire",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user",
    "fullName": "John Doe"
  }
}
```

### POST `/api/auth/login`
Login and get access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user",
    "fullName": "John Doe"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### GET `/api/auth/profile`
Get current user's profile (requires auth).

**Response:**
```json
{
  "profile": {
    "id": "user-id",
    "full_name": "John Doe",
    "username": "user@example.com",
    "phone": "+1234567890",
    "role": "user"
  }
}
```

### PUT `/api/auth/profile`
Update current user's profile (requires auth).

**Request Body:**
```json
{
  "fullName": "John Updated",
  "phone": "+9876543210",
  "email": "newemail@example.com"
}
```

---

## Location Endpoints (All roles)

### GET `/api/locations`
List all locations (requires auth).

**Response:**
```json
{
  "locations": [
    {
      "id": "loc-id",
      "name": "Wankhede Stadium",
      "address": "...",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    }
  ]
}
```

### POST `/api/locations`
Create or get location (requires auth).

**Request Body:**
```json
{
  "name": "Eden Gardens",
  "address": "Optional address",
  "city": "Kolkata",
  "state": "West Bengal",
  "country": "India"
}
```

---

## Player Endpoints

### GET `/api/players`
List all registered players (requires auth).

**Response:**
```json
{
  "players": [
    {
      "id": "player-id",
      "full_name": "Virat Kohli",
      "username": "virat@example.com",
      "phone": "+1234567890",
      "role": "player"
    }
  ]
}
```

### GET `/api/players/:playerId/stats`
Get player statistics (requires auth).

**Response:**
```json
{
  "player": {
    "id": "player-id",
    "name": "Virat Kohli"
  },
  "batting": {
    "totalRuns": 12000,
    "totalBalls": 15000,
    "totalFours": 500,
    "totalSixes": 200,
    "matches": 50,
    "strikeRate": "80.00"
  },
  "bowling": {
    "totalWickets": 50,
    "totalOvers": 200,
    "totalRunsConceded": 1200,
    "matches": 30,
    "economy": "6.00",
    "average": "24.00"
  }
}
```

### PUT `/api/players/:playerId/profile`
Update player profile (requires auth).

---

## Umpire Endpoints (Umpire role required)

### POST `/api/umpire/matches`
Create a new match.

**Request Body:**
```json
{
  "teamAName": "India",
  "teamBName": "Australia",
  "locationId": "loc-id",
  "locationName": "New Location",
  "overs": 20,
  "date": "2024-01-15T10:00:00Z"
}
```

**Response:**
```json
{
  "message": "Match created successfully",
  "matchId": "match-id"
}
```

### GET `/api/umpire/matches`
List all matches created by the umpire.

**Response:**
```json
{
  "matches": [
    {
      "id": "match-id",
      "team_a": { "id": "...", "name": "India" },
      "team_b": { "id": "...", "name": "Australia" },
      "status": "live",
      "overs": 20,
      "location": { "id": "...", "name": "Wankhede" }
    }
  ]
}
```

### GET `/api/umpire/matches/:matchId`
Get match details with score and player stats.

**Response:**
```json
{
  "match": {
    "id": "match-id",
    "team_a": { "id": "...", "name": "India" },
    "team_b": { "id": "...", "name": "Australia" },
    "score": {
      "team_a_score": 150,
      "team_a_wkts": 3,
      "team_a_overs": 18.5,
      "team_b_score": 120,
      "team_b_wkts": 5,
      "team_b_overs": 15.0,
      "team_a_run_rate": 7.89,
      "team_b_run_rate": 8.00
    },
    "playerStats": [...]
  }
}
```

### PUT `/api/umpire/matches/:matchId/score`
Update match score.

**Request Body:**
```json
{
  "teamAScore": 150,
  "teamAWkts": 3,
  "teamAOvers": 18.5,
  "teamBScore": 120,
  "teamBWkts": 5,
  "teamBOvers": 15.0,
  "target": 151
}
```

### POST `/api/umpire/matches/:matchId/players`
Add player to match.

**Request Body:**
```json
{
  "playerId": "player-id",
  "teamId": "team-id",
  "playerName": "Player Name"
}
```

### PUT `/api/umpire/matches/:matchId/player-stats/:playerStatId`
Update player stats in match.

**Request Body:**
```json
{
  "runs": 50,
  "balls": 40,
  "fours": 5,
  "sixes": 2,
  "wickets": 0,
  "overs": 0
}
```

---

## User Endpoints (All authenticated users)

### GET `/api/user/matches`
List all matches (like Cricbuzz).

**Query Parameters:**
- `status` (optional): Filter by status (live, completed, etc.)
- `limit` (optional): Limit results (default: 50)

**Response:**
```json
{
  "matches": [
    {
      "id": "match-id",
      "team_a": { "id": "...", "name": "India" },
      "team_b": { "id": "...", "name": "Australia" },
      "status": "live",
      "score": {
        "team_a_score": 150,
        "team_a_wkts": 3,
        "team_a_overs": 18.5,
        "team_a_run_rate": 7.89
      }
    }
  ]
}
```

### GET `/api/user/matches/:matchId/scoreboard`
Get detailed match scoreboard.

**Response:**
```json
{
  "match": {
    "id": "match-id",
    "team_a": { "id": "...", "name": "India" },
    "team_b": { "id": "...", "name": "Australia" },
    "score": {...},
    "team_a_stats": [
      {
        "player_name": "Virat Kohli",
        "runs": 50,
        "balls": 40,
        "strike_rate": 125.00,
        "wickets": 0
      }
    ],
    "team_b_stats": [...]
  }
}
```

---

## Error Responses

All endpoints may return error responses:

```json
{
  "error": true,
  "message": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error







