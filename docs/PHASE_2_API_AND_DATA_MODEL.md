# KIVORA — PHASE 2 API & DATA MODEL SPECIFICATION
## Comprehensive Reference for Communication, Messaging, Invitations, Saved Items & Smart Alerts

**Alembic Migration ID:** `3354a2dad2da`  
**Revision Date:** October 12, 2026  
**ORM:** SQLAlchemy 2.0  
**Validation:** Pydantic v2  

---

## 1. Database Schema & Models

### 1.1 `notifications`
Stores persistent in-app notifications for authenticated users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique notification ID (`ntf-...`) |
| `user_id` | VARCHAR(36) | FOREIGN KEY (`users.id` ON DELETE CASCADE), INDEX | Recipient user |
| `notification_type` | VARCHAR(50) | NOT NULL, INDEX | Event category (e.g., `INVITATION_RECEIVED`, `APPLICATION_ACCEPTED`) |
| `title` | VARCHAR(150) | NOT NULL | Concise headline |
| `message` | TEXT | NOT NULL | Human-readable content |
| `resource_type` | VARCHAR(50) | NULLABLE | Related entity type (`BRIEF`, `APPLICATION`, `ENGAGEMENT`, `MESSAGE`) |
| `resource_id` | VARCHAR(60) | NULLABLE | Related entity primary key |
| `link_url` | VARCHAR(255) | NULLABLE | Internal frontend navigation route |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT FALSE, INDEX | Read status flag |
| `read_at` | DATETIME | NULLABLE | UTC timestamp when marked read |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW, INDEX | Dispatch timestamp |

**Indexes:**
- `ix_notifications_user_id`
- `ix_notifications_is_read`
- `ix_notifications_created_at`
- `ix_notifications_notification_type`

---

### 1.2 `conversations`
Represents an authorized discussion context between a brand and a creator.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique conversation ID (`conv-...`) |
| `engagement_id` | VARCHAR(36) | FOREIGN KEY (`engagements.id` ON DELETE SET NULL), NULLABLE, INDEX | Linked project engagement |
| `brief_id` | VARCHAR(36) | FOREIGN KEY (`briefs.id` ON DELETE SET NULL), NULLABLE, INDEX | Linked campaign brief |
| `brand_id` | VARCHAR(36) | FOREIGN KEY (`brand_profiles.id` ON DELETE CASCADE), NOT NULL, INDEX | Participating brand |
| `creator_id` | VARCHAR(36) | FOREIGN KEY (`creator_profiles.id` ON DELETE CASCADE), NOT NULL, INDEX | Participating creator |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW, INDEX | Latest activity timestamp |

**Table Constraints:**
- `uq_conversation_pair`: UNIQUE(`brand_id`, `creator_id`, `brief_id`)

---

### 1.3 `messages`
Persistent, text-sanitized peer messages within an authorized conversation.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique message ID (`msg-...`) |
| `conversation_id` | VARCHAR(36) | FOREIGN KEY (`conversations.id` ON DELETE CASCADE), NOT NULL, INDEX | Parent conversation |
| `sender_id` | VARCHAR(36) | FOREIGN KEY (`users.id` ON DELETE CASCADE), NOT NULL, INDEX | Authenticated sender user ID |
| `content` | TEXT | NOT NULL | Sanitized text message body (max 4,000 chars) |
| `is_read` | BOOLEAN | NOT NULL, DEFAULT FALSE, INDEX | Read indicator |
| `read_at` | DATETIME | NULLABLE | UTC timestamp when read |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW, INDEX | Dispatch timestamp |

**Indexes:**
- `ix_messages_conversation_id`
- `ix_messages_sender_id`
- `ix_messages_created_at`

---

### 1.4 `saved_creators`
Brand bookmarks for creator talent.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique bookmark ID (`sc-...`) |
| `user_id` | VARCHAR(36) | FOREIGN KEY (`users.id` ON DELETE CASCADE), NOT NULL, INDEX | Owning brand user |
| `creator_id` | VARCHAR(36) | FOREIGN KEY (`creator_profiles.id` ON DELETE CASCADE), NOT NULL, INDEX | Bookmarked creator |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW | Timestamp added |

**Table Constraints:**
- `uq_user_saved_creator`: UNIQUE(`user_id`, `creator_id`)

---

### 1.5 `saved_briefs`
Creator bookmarks for campaign opportunities.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique bookmark ID (`sb-...`) |
| `user_id` | VARCHAR(36) | FOREIGN KEY (`users.id` ON DELETE CASCADE), NOT NULL, INDEX | Owning creator user |
| `brief_id` | VARCHAR(36) | FOREIGN KEY (`briefs.id` ON DELETE CASCADE), NOT NULL, INDEX | Bookmarked brief |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW | Timestamp added |

**Table Constraints:**
- `uq_user_saved_brief`: UNIQUE(`user_id`, `brief_id`)

---

### 1.6 `alert_preferences`
Per-user preferences configuring smart opportunity discovery.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique preferences ID (`ap-...`) |
| `user_id` | VARCHAR(36) | FOREIGN KEY (`users.id` ON DELETE CASCADE), UNIQUE, NOT NULL, INDEX | Owning user |
| `is_enabled` | BOOLEAN | NOT NULL, DEFAULT TRUE | Master toggle for alerts |
| `min_budget` | FLOAT | NULLABLE | Minimum campaign budget threshold |
| `preferred_categories` | JSON | NULLABLE | List of category slugs |
| `preferred_content_types` | JSON | NULLABLE | List of content formats (`VIDEO`, `IMAGE`, etc.) |
| `email_alerts_enabled` | BOOLEAN | NOT NULL, DEFAULT TRUE | Email notification toggle |
| `in_app_alerts_enabled` | BOOLEAN | NOT NULL, DEFAULT TRUE | In-app notification toggle |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW | Update timestamp |

---

### 1.7 `opportunity_alerts`
Deduplicated record of generated opportunity matches.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(36) | PRIMARY KEY | Unique alert ID (`alt-...`) |
| `user_id` | VARCHAR(36) | FOREIGN KEY (`users.id` ON DELETE CASCADE), NOT NULL, INDEX | Recipient creator user |
| `brief_id` | VARCHAR(36) | FOREIGN KEY (`briefs.id` ON DELETE CASCADE), NOT NULL, INDEX | Matched campaign brief |
| `match_score` | FLOAT | NOT NULL | Compatibility score (0.0 to 100.0) |
| `match_reasons` | JSON | NOT NULL | Explainable criteria justification strings |
| `is_viewed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Viewed state |
| `created_at` | DATETIME | NOT NULL, DEFAULT UTC_NOW, INDEX | Generation timestamp |

**Table Constraints:**
- `uq_user_brief_opportunity`: UNIQUE(`user_id`, `brief_id`)

---

## 2. API Endpoint Specification

### 2.1 Notifications (`/api/notifications`)
- `GET /api/notifications`: Returns paginated notifications for current user (`skip`, `limit`, `unread_only`).
- `GET /api/notifications/unread-count`: Returns `{ "unread_count": <int> }`.
- `PATCH /api/notifications/{id}/read`: Marks a single owned notification as read (`200 OK`). Returns `404` if nonexistent or owned by another user.
- `PATCH /api/notifications/read-all`: Marks all notifications for the current user as read (`200 OK`).
- `DELETE /api/notifications/{id}`: Deletes a single owned notification (`204 No Content`).

### 2.2 Creator Invitations (`/api/engagements`)
- `POST /api/engagements/invite`: Brand invites creator to an owned brief. Validates ownership, active brief state, and duplicate prevention. Creates `Application` with `status="INVITED"`.
- `GET /api/engagements/my-invitations`: Authenticated creator views received invitations.
- `GET /api/engagements/brief-invitations/{brief_id}`: Brand views invitations sent for a specific brief.
- `POST /api/engagements/invitations/{id}/accept`: Creator accepts invitation. Transitions status to `ACCEPTED`, provisions `Engagement(status="KICKOFF")`, creates `Conversation`, and notifies brand.
- `POST /api/engagements/invitations/{id}/decline`: Creator declines invitation with optional feedback. Transitions status to `DECLINED` and notifies brand.

### 2.3 Peer-to-Peer Messaging (`/api/messages`)
- `GET /api/messages/conversations`: Lists conversations where current user is the participating creator or brand with unread count and latest message preview.
- `GET /api/messages/conversations/{id}/messages`: Paginated message history. Verifies current user membership; returns `404` to non-members.
- `POST /api/messages/conversations/{id}/messages`: Dispatches message. Enforces membership, validates payload size (1–4,000 characters), HTML-escapes content to prevent stored XSS, updates conversation `updated_at`, and notifies recipient.
- `PATCH /api/messages/conversations/{id}/read`: Marks incoming messages in conversation as read.
- `GET /api/messages/unread-count`: Aggregate unread message count across all user conversations.

### 2.4 Saved Items Bookmarks (`/api/saved`)
- `POST /api/saved/briefs/{brief_id}`: Creator bookmarks brief (idempotent). Rejects brands with `403`. Ensures brief is published (`404` on draft briefs).
- `DELETE /api/saved/briefs/{brief_id}`: Creator removes brief bookmark.
- `GET /api/saved/briefs`: Creator lists saved briefs with populated brief summaries.
- `GET /api/saved/briefs/{brief_id}/status`: Returns `{ "is_saved": true/false }`.
- `POST /api/saved/creators/{creator_id}`: Brand bookmarks creator (idempotent). Rejects creators with `403`.
- `DELETE /api/saved/creators/{creator_id}`: Brand removes creator bookmark.
- `GET /api/saved/creators`: Brand lists saved creator talent cards.
- `GET /api/saved/creators/{creator_id}/status`: Returns `{ "is_saved": true/false }`.

### 2.5 Smart Opportunity Alerts (`/api/alerts`)
- `GET /api/alerts/preferences`: Retrieves current user alert preferences or provisions default.
- `PUT /api/alerts/preferences`: Updates budget thresholds, preferred content types, categories, and notification channels.
- `GET /api/alerts/opportunities`: Lists matched opportunities for creator (`skip`, `limit`, `unviewed_only`).
- `POST /api/alerts/refresh`: On-demand deterministic matching run scoring active briefs against creator profile and preferences. Deduplicates existing alerts.
- `PATCH /api/alerts/opportunities/{id}/view`: Marks alert as viewed.
