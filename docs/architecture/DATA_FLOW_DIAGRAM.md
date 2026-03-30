[Ver001.000] [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

# System Architecture & Data Flow Diagram
## NJZiteGeisTe Platform - Visual Reference

---

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["📱 Client Layer"]
        Web["🌐 Web App\nReact + Vite"]
        Ext["🔌 Browser Ext\n(Planned)"]
        Mobile["📲 Mobile\n(Planned)"]
        Wiki["📚 Wiki\n(Merged)"]
    end
    
    subgraph Edge["🌐 Edge Layer"]
        Vercel["⚡ Vercel Edge\nCDN + SSR"]
    end
    
    subgraph API["🔧 API Layer (Render)"]
        FastAPI["🐍 FastAPI\nPython 3.11+"]
        
        subgraph Endpoints["API Endpoints"]
            V1["/v1/* REST"]
            WS["/ws/* WebSocket"]
            Health["/health"]
            Admin["/admin/*"]
        end
        
        subgraph Middleware["Middleware"]
            RateLimit["⏱️ Rate Limit\nSlowAPI"]
            CircuitBreaker["🛡️ Circuit Breaker\nCustom"]
            Auth["🔐 Auth\nJWT + OAuth"]
        end
    end
    
    subgraph Data["💾 Data Layer"]
        Postgres["🐘 PostgreSQL\nSupabase"]
        Redis["⚡ Redis\nUpstash"]
        S3["📦 S3 Storage\nSupabase"]
        ML["🤖 ML Models\nTensorFlow.js"]
    end
    
    subgraph External["🌍 External Services"]
        Pandascore["📊 Pandascore API\nEsports Data"]
        OAuth["🔑 OAuth\nGoogle/Discord/GitHub"]
        Godot["🎮 Godot Sim\n(External Repo)"]
        Kaggle["📈 Kaggle\nML Training"]
    end
    
    Client --> Vercel
    Vercel --> FastAPI
    FastAPI --> Endpoints
    Endpoints --> Middleware
    Middleware --> Data
    API --> External
```

---

## Data Flow: SATOR Analytics Pipeline

```mermaid
flowchart LR
    subgraph Sources["📥 Data Sources"]
        PC["Pandascore API\nOfficial Data"]
        User["User Inputs\nPredictions"]
    end
    
    subgraph Ingestion["🔄 Ingestion"]
        ETL["ETL Pipeline\nPython/async"]
        Cache["Redis Cache\nTTL: 1hr"]
    end
    
    subgraph Processing["⚙️ SATOR Processing"]
        Raw["Raw Stats"]
        SimR["SimRating\nEngine v2"]
        Conf["Confidence\nScoring"]
        Rank["Ranking\nAlgorithm"]
    end
    
    subgraph Storage["💾 Storage"]
        DB["PostgreSQL\nPlayers/Matches"]
        Cache2["Redis\nLeaderboards"]
    end
    
    subgraph Output["📤 Output"]
        Profiles["Player Profiles"]
        Leaderboards["Leaderboards"]
        API["API Response\n/v1/analytics"]
    end
    
    PC --> ETL
    User --> ETL
    ETL --> Cache
    Cache --> Raw
    Raw --> SimR
    SimR --> Conf
    Conf --> Rank
    Rank --> DB
    Rank --> Cache2
    DB --> Profiles
    Cache2 --> Leaderboards
    Profiles --> API
    Leaderboards --> API
```

---

## Data Flow: ROTAS Simulation Pipeline

```mermaid
flowchart LR
    subgraph Input["🎯 Input"]
        Teams["Team Composition"]
        Maps["Map Selection"]
        Econ["Economy State"]
    end
    
    subgraph Engine["🎮 ROTAS Engine"]
        Sim["Match Simulation\nGodot/Deterministic"]
        Model["Outcome\nModeling"]
        CI["Confidence\nIntervals"]
    end
    
    subgraph Validation["✅ Validation"]
        Bench["VCT Benchmark\n>65% Accuracy"]
        Unit["Unit Tests\nGUT Framework"]
        Int["Integration\nAPI Tests"]
    end
    
    subgraph Output["📊 Output"]
        Predictions["Match Predictions"]
        XePlayer["X-ePlayer\nEmulation"]
        Viz["Visualizations\nLensing/MapView"]
    end
    
    Input --> Engine
    Engine --> Validation
    Validation --> Output
```

---

## SATOR/ROTAS Data Lineage

```mermaid
flowchart TB
    subgraph Raw["Raw Data"]
        R1["Player Stats\nK/D/A, ACS"]
        R2["Match Results\nRounds, Scores"]
        R3["Team Data\nRosters, Rankings"]
    end
    
    subgraph SATOR_Transform["SATOR Transformations"]
        T1["Normalization\n0-100 Scale"]
        T2["SimRating v2\n5-Component Formula"]
        T3["Confidence\nBootstrap CI"]
        T4["Ranking\nML Model"]
    end
    
    subgraph ROTAS_Transform["ROTAS Transformations"]
        T5["Simulation\nDeterministic Run"]
        T6["Outcome\nProbability"]
        T7["Prediction\nConfidence"]
    end
    
    subgraph Consumption["Data Consumption"]
        C1["Player Profiles"]
        C2["Leaderboards"]
        C3["Match Cards"]
        C4["Predictions"]
    end
    
    R1 --> T1
    R2 --> T1
    R3 --> T1
    
    T1 --> T2
    T2 --> T3
    T3 --> T4
    
    T2 --> T5
    T5 --> T6
    T6 --> T7
    
    T4 --> C1
    T4 --> C2
    T7 --> C3
    T7 --> C4
```

---

## Circuit Breaker State Machine

```mermaid
stateDiagram-v2
    [*] --> Closed : Initial State
    
    Closed --> Open : Failures >= Threshold
    Closed --> Closed : Success
    
    Open --> HalfOpen : Timeout Expired
    Open --> Open : Request Rejected
    
    HalfOpen --> Closed : Success
    HalfOpen --> Open : Failure
    
    note right of Closed
        Normal Operation
        Requests flow through
    end note
    
    note right of Open
        Failing Fast
        Return cached/error
    end note
    
    note right of HalfOpen
        Testing Recovery
        Limited requests
    end note
```

---

## Authentication Flow (TeXeT Layer)

```mermaid
sequenceDiagram
    participant User
    participant Web as Web App
    participant API as FastAPI
    participant OAuth as OAuth Provider
    participant DB as PostgreSQL
    
    User->>Web: Click Login
    Web->>API: GET /auth/oauth/{provider}
    API->>API: Generate State (CSRF)
    API->>OAuth: Redirect to OAuth
    OAuth->>User: Login Prompt
    User->>OAuth: Credentials
    OAuth->>API: Callback + Code
    API->>OAuth: Exchange Code for Token
    OAuth->>API: Access Token
    API->>OAuth: Get User Info
    OAuth->>API: User Profile
    API->>DB: Create/Update User
    DB->>API: User Record
    API->>API: Generate JWT
    API->>Web: Set HttpOnly Cookie
    Web->>User: Authenticated!
```

---

## WebSocket Real-Time Flow

```mermaid
sequenceDiagram
    participant Client
    participant LB as Load Balancer
    participant API as FastAPI
    participant Redis as Redis Pub/Sub
    participant Panda as Pandascore
    
    Client->>LB: WSS Connect /ws/live
    LB->>API: Upgrade Connection
    API->>Redis: Subscribe to channels
    
    loop Live Match Updates
        Panda->>API: Webhook Match Event
        API->>Redis: Publish event
        Redis->>API: Broadcast to subscribers
        API->>Client: Match Update JSON
    end
    
    Client->>API: Disconnect
    API->>Redis: Unsubscribe
```

---

## Error Handling & Fallback Flow

```mermaid
flowchart TD
    Request[API Request] --> CheckCircuit{Circuit State?}
    
    CheckCircuit -->|Closed| TryAPI[Call External API]
    CheckCircuit -->|Open| Fallback[Return Fallback Data]
    CheckCircuit -->|HalfOpen| TryLimited[Try with Limits]
    
    TryAPI --> Success{Success?}
    Success -->|Yes| Cache[Cache Result]
    Success -->|No| RecordFail[Record Failure]
    
    RecordFail --> CheckThreshold{Threshold Reached?}
    CheckThreshold -->|Yes| OpenCircuit[Open Circuit]
    CheckThreshold -->|No| ReturnError[Return Error]
    
    TryLimited --> TestResult{Success?}
    TestResult -->|Yes| CloseCircuit[Close Circuit]
    TestResult -->|No| ReopenCircuit[Reopen Circuit]
    
    Cache --> ReturnSuccess[Return Data]
    Fallback --> ReturnCached[Return Cached]
    CloseCircuit --> ReturnSuccess
    OpenCircuit --> ReturnError
    ReopenCircuit --> ReturnError
```

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Dev["Development"]
        Local["Localhost\nVite Dev Server"]
        Docker["Docker Compose\nLocal DB/Redis"]
    end
    
    subgraph Staging["Staging"]
        VercelStaging["Vercel Preview"]
        RenderStaging["Render Staging"]
        SupabaseStaging["Supabase Staging"]
    end
    
    subgraph Production["Production"]
        VercelProd["Vercel Edge\n(Global CDN)"]
        RenderProd["Render\n(US East)"]
        SupabaseProd["Supabase\n(Multi-region)"]
        UpstashProd["Upstash Redis\n(Global)"]
    end
    
    Dev --> Staging
    Staging --> Production
```

---

*Document Version: 001.000*  
*Last Updated: 2026-03-30*
