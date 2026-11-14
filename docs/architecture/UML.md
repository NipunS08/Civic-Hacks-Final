# UML Diagrams — CivicLens

> [Documentation index](../README.md)

All diagrams use Mermaid syntax. Render at https://mermaid.live or in VS Code
with the Mermaid Preview extension.

---

## 1. Use Case Diagram

```mermaid
graph LR
    Resident((Resident))
    Visitor((Visitor))
    Scheduler((Cron / Scheduler))
    CivicLens[CivicLens System]

    Visitor --> UC1[Browse public feed]
    Visitor --> UC2[View item detail + Say-Window]
    Visitor --> UC3[View Sources & Data page]

    Resident --> UC1
    Resident --> UC2
    Resident --> UC4[Create account]
    Resident --> UC5[Verify email]
    Resident --> UC6[Set alert preferences]
    Resident --> UC7[Receive deadline alert]
    Resident --> UC8[Export / delete account data]

    Scheduler --> UC9[Ingest Toronto Open Data]
    Scheduler --> UC10[Match alerts + dispatch]
    Scheduler --> UC11[Run check-links]
```

---

## 2. Architecture / Component Diagram

```mermaid
graph TB
    subgraph Browser
        UI[Next.js React UI]
        UI -->|fetch| FeedAPI[/api route]
    end

    subgraph Next.js App Server
        Feed[/feed page]
        Item[/item/[id] page]
        Auth[/auth/* pages]
        Account[/account page]
        Ingest[/api/ingest]
        Proxy[proxy.ts - session refresh]
    end

    subgraph Adapters
        TOAdapter[toronto-opendata.ts]
    end

    subgraph External APIs
        CKAN[Toronto CKAN API]
        TMMIS[TMMIS secure.toronto.ca - 403 blocked]
    end

    subgraph Supabase
        SupaAuth[Supabase Auth]
        SupaDB[(Postgres + RLS)]
    end

    subgraph Alert Channels
        Console[Console - dev]
        Resend[Resend email]
    end

    Feed --> TOAdapter
    Item --> TOAdapter
    Ingest --> TOAdapter
    TOAdapter --> CKAN
    TOAdapter -.->|source links point here| TMMIS

    Auth --> SupaAuth
    Account --> SupaDB
    Proxy --> SupaAuth

    Ingest --> SupaDB
    AlertJob[Alert Job - planned] --> SupaDB
    AlertJob --> Console
    AlertJob --> Resend
```

---

## 3. Sequence Diagram — User Signup Flow

```mermaid
sequenceDiagram
    participant U as Resident
    participant App as Next.js
    participant SB as Supabase Auth
    participant Email as Email Service

    U->>App: POST /auth/signup (email, password)
    App->>SB: auth.signUp({ email, password })
    SB->>SB: Hash password (bcrypt)
    SB->>Email: Send verification email
    SB-->>App: { user: ..., session: null }
    App-->>U: "Check your email" message

    U->>Email: Click verification link
    Email->>App: GET /auth/verify?token=...
    App->>SB: auth.getSession() (token in URL hash)
    SB-->>App: { session: { user: { email_confirmed_at: ... } } }
    App->>SB: profiles INSERT (via DB trigger)
    App-->>U: Redirect to /account
```

---

## 4. Sequence Diagram — Alert Flow

```mermaid
sequenceDiagram
    participant Cron as Scheduler (cron)
    participant Ingest as /api/ingest
    participant CKAN as Toronto CKAN API
    participant DB as Supabase DB
    participant AlertJob as Alert Matcher
    participant Channel as Channel (email/console)
    participant U as Resident

    Cron->>Ingest: GET /api/ingest (every 6h)
    Ingest->>CKAN: datastore_search (meetings)
    CKAN-->>Ingest: 1445 meeting rows
    Ingest->>CKAN: datastore_search (votes)
    CKAN-->>Ingest: 1000 vote rows
    Ingest->>DB: UPSERT meetings, agenda_items

    AlertJob->>DB: SELECT items WHERE meeting_date BETWEEN now AND now+3d
    DB-->>AlertJob: Items with approaching deadlines
    AlertJob->>DB: SELECT alert_preferences matching items
    DB-->>AlertJob: User preferences
    AlertJob->>DB: CHECK notification_log (avoid duplicates)
    AlertJob->>Channel: sendAlert(user.email, message)
    Channel-->>U: Email: "3 days left to comment on..."
    AlertJob->>DB: INSERT notification_log (content_hash)
```

---

## 5. ER Diagram

```mermaid
erDiagram
    municipalities {
        text id PK
        text name
        text province
        text platform
        text portal_url
        text timezone
    }

    meetings {
        uuid id PK
        text municipality_id FK
        text committee
        text committee_code
        text meeting_number
        date date
        text start_time
        text end_time
        text location
        text status
        text source_url
        timestamptz retrieved_at
    }

    agenda_items {
        uuid id PK
        text municipality_id FK
        uuid meeting_id FK
        text item_number
        text title
        text description
        text committee
        text committee_code
        date meeting_date
        text ward
        text stage
        text content_hash
        text source_url
        timestamptz retrieved_at
    }

    participation {
        uuid id PK
        uuid item_id FK
        text method
        timestamptz deadline
        text deadline_source_excerpt
        text instructions_url
        text source_url
        timestamptz retrieved_at
    }

    vote_records {
        uuid id PK
        uuid item_id FK
        text committee
        date vote_date
        text motion_type
        text result
        text source_url
    }

    profiles {
        uuid id PK
        text municipality_id FK
        text ward
        float lat
        float lng
        int alert_radius_m
    }

    alert_preferences {
        uuid id PK
        uuid user_id FK
        text municipality_id FK
        text[] topics
        text ward
        int radius_m
        text[] channels
        boolean digest
    }

    channel_consent {
        uuid id PK
        uuid user_id FK
        text channel
        boolean opted_in
        timestamptz consent_at
    }

    notification_log {
        uuid id PK
        uuid user_id FK
        uuid item_id FK
        text channel
        timestamptz sent_at
        text content_hash
    }

    municipalities ||--o{ meetings : "has"
    municipalities ||--o{ agenda_items : "has"
    meetings ||--o{ agenda_items : "contains"
    agenda_items ||--o{ participation : "has"
    agenda_items ||--o{ vote_records : "has"
    agenda_items ||--o{ notification_log : "triggered"
    profiles ||--o{ alert_preferences : "has"
    profiles ||--o{ channel_consent : "records"
    profiles ||--o{ notification_log : "received"
```
