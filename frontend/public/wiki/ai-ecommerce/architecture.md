# AI Ecommerce — Architecture

## System Design

The architecture is a classic three-tier web application enhanced with AI services. Let's walk through each layer.

```
Customer Browser
     │
     ▼
React Frontend (Vite) ──→ Django REST API (:8000) ──→ PostgreSQL (Neon)
     │                           │                          │
     │                    ┌──────┼──────┐              Cloudinary
     │                    │      │      │              (Book Images)
     │                    ▼      ▼      ▼
     │                 Clerk   Vapi   Razorpay
     │                 (Auth)  (AI)   (Payments)
     │
     └── Clerk Auth ──→ JWT ──→ Django verifies JWT against JWKS
```

## Frontend Architecture

The React frontend uses a modern stack:

**Routing:** React Router 7 manages navigation between pages — Home, Browse, Book Detail, Cart, Wishlist, Orders, and Admin Dashboard.

**State Management:** TanStack Query 5 handles all server state. Book listings, cart contents, order history, and admin data are fetched, cached, and kept in sync without manual state management. This eliminates an entire category of bugs (stale data, inconsistent UI state).

**Authentication:** Clerk provides the complete auth UI — sign-in, sign-up, user profile — and manages JWT tokens. The React app receives a token after authentication and attaches it to every API request via an Axios interceptor. No auth state to manually manage.

**Styling:** Tailwind CSS 4 with utility classes. The UI is clean and modern without custom CSS files.

## Backend Architecture

The Django backend is organized around REST API principles:

**Authentication Flow:**
1. Customer authenticates through Clerk on the frontend
2. Clerk issues a JWT token
3. React attaches the token as `Authorization: Bearer <token>` on every request
4. Django's `ClerkJWTAuthentication` class extracts the token, validates it against Clerk's JWKS endpoint, and extracts the `sub` (clerk_user_id)
5. Django calls `get_or_create_user_from_clerk()` — creating or updating the Django User + UserProfile
6. If the user is deactivated (`UserProfile.is_active = False`), returns `PermissionDenied` at the authentication layer
7. `IsAdminUser` permission class verifies admin endpoints server-side

**Key Design Decisions:**
- **JWT validation on every request** — never trust the client
- **Auto-registration** — users are created in Django on first API call
- **Role sync from Clerk** — admin status comes from Clerk metadata, verified server-side
- **Soft deactivation** — users are deactivated, not deleted; orders and sessions are preserved

## Database Design

The database schema supports the full ecommerce workflow:

```
User ──1:1── UserProfile (clerk_user_id, role, is_active)
  │
  ├──1:N── Cart ──1:N── CartItem ──N:1── Book
  ├──1:N── Wishlist ──N:1── Book
  ├──1:N── Order ──1:N── OrderItem (book snapshot)
  └──1:N── SupportSession ──1:N── TranscriptMessage
```

Key schema decisions:

**OrderItem stores a snapshot:** When an order is placed, OrderItem captures `book_title` and `book_price` at that moment. If the book's price changes later, old orders show the original price. This is essential for accurate order history.

**Soft references to books:** OrderItem has a nullable foreign key to Book (`SET_NULL` on delete). If a book is removed from inventory, orders referencing it retain the snapshot data (title, price) but lose the book link.

**SupportSession captures ratings:** After a voice support call, the webhook delivers a rating (1-5), feedback text, transcript, and AI-generated summary. All are stored for admin review.

## The Payment Flow

The checkout and payment flow is carefully designed to prevent overselling:

1. **Cart validation:** Before creating a Razorpay order, cart items are validated against current stock
2. **Inventory deduction at checkout:** Stock is deducted immediately when the order is created — not after payment. This prevents overselling during payment delays
3. **Razorpay order creation:** A payment order is created in INR with the total amount
4. **Payment modal:** Customer completes payment in the Razorpay modal
5. **Signature verification:** Frontend calls `/verify-payment/` with Razorpay's `payment_id`, `order_id`, and `signature`
6. **Server-side verification:** Django verifies the signature cryptographically before updating order status to `paid`
7. **Cancellation restores inventory:** If an order is cancelled, all book quantities are restored

The decision to deduct inventory at checkout rather than payment is deliberate. During the payment delay (user entering card details, OTP verification), another customer could purchase the same book. Deducting at checkout guarantees availability.

## The Voice Support Flow

```
Customer clicks "Call Haney"
     │
     ▼
POST /api/vapi/start-session/
     │  Django builds context: customer name, email, all orders
     │
     ▼
Vapi Web SDK initializes with context variables
     │  customer_name, ctx_info (order history), vapi_conversation_id
     │
     ▼
Haney answers (ElevenLabs TTS + Deepgram STT + GPT-4.1)
     │
     ├── Customer asks about order → Haney checks ctx_info → responds
     ├── Customer gives rating (1-5) → Vapi extracts structured output
     └── Call ends
          │
          ▼
Webhook POST → Django receives payload
     │  /api/vapi/webhook/
     ├── Transcript stored → TranscriptMessage per speaker
     ├── Rating stored → SupportSession.rating
     ├── Summary stored → AI-generated call summary
     └── Duration recorded → SupportSession.duration_seconds
          │
          ▼
Admin Dashboard → View summary, rating, full transcript
```

The context injection (`ctx_info` containing all orders) makes Haney genuinely helpful. When a customer says "Where's my order?", Haney can respond with the specific order details without asking for an order number. This is the difference between a generic chatbot and a context-aware AI agent.
