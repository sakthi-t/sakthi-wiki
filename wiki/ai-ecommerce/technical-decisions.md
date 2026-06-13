# AI Ecommerce — Technical Decisions

Every integration and architectural choice in this project represents a deliberate tradeoff. Here's the reasoning behind the key decisions.

## Decision 1: Django + DRF over FastAPI

**The choice:** Django with Django REST Framework for the backend, rather than FastAPI (which was used in the RAG projects).

**Why:** Django provides a complete backend framework with built-in admin, ORM, authentication, and a mature ecosystem. For an ecommerce application with multiple models, admin interfaces, and complex business logic, Django's "batteries included" approach reduces the amount of custom code needed.

The Django admin is particularly valuable — it gives admins a ready-made interface for managing books, orders, and users without building a separate admin frontend. This alone saved weeks of development time.

**The tradeoff:** Django is synchronous by default, while FastAPI is async-native. For an ecommerce application with moderate traffic, Django's sync performance is adequate. If the application needed to handle thousands of concurrent requests, FastAPI's async architecture would be more appropriate.

## Decision 2: Clerk for Authentication

**The choice:** Use Clerk as an external authentication service rather than Django's built-in auth.

**Why:** Clerk provides OAuth (Google, GitHub), email/password auth, session management, and user profiles out of the box. Integrating it means:
- No password storage or security concerns
- Social login with minimal code
- Pre-built React components for sign-in/sign-up flows
- JWKS-based JWT verification for stateless API authentication

The alternative — building all of this in Django — would require significantly more code and ongoing security maintenance.

**The tradeoff:** Clerk is an external dependency with its own pricing. User data is split between Clerk (authentication) and Django (profile, orders). The auto-registration pattern (`get_or_create_user_from_clerk`) bridges this gap but adds complexity.

## Decision 3: Inventory Deduction at Checkout (Not Payment)

**The choice:** Deduct inventory when the order is created, before payment is confirmed.

**Why:** During the payment flow (Razorpay modal), there's a window where the customer is entering payment details. If inventory isn't deducted until payment completes, another customer could purchase the same item during this window. For limited-stock items, this creates overselling.

Deducting at checkout guarantees: if you can add it to your cart and initiate checkout, the stock is reserved for you.

**The tradeoff:** Abandoned checkouts hold inventory that could be sold to others. The mitigation is the order cancellation flow — if an order is cancelled or expires, inventory is restored. A more sophisticated system would add a checkout timeout (e.g., release held inventory after 15 minutes of inactivity).

## Decision 4: Voice Over Text for AI Support

**The choice:** Build a voice-enabled support agent rather than a text chatbot.

**Why:** Voice interaction is more personal and engaging for customer support. A customer frustrated about a delayed order will feel more heard talking to a human-like voice than typing into a chat window. The Vapi SDK abstracts away WebRTC complexity, making voice integration feasible.

Additionally, voice support captures richer data — tone of voice, hesitation, frustration — that would be lost in text. Future sentiment analysis can leverage this.

**The tradeoff:** Voice development is harder to test and debug than text. WebRTC quality degrades on localhost, making development frustrating. Voice API costs are higher than text. And some users prefer text for quick questions.

## Decision 5: Django App Separation

**The choice:** Split functionality across 8 Django apps (users, books, cart, wishlist, orders, payments, support, vapi_support) rather than a monolithic structure.

**Why:** Each app handles a single business domain. The cart app doesn't know about payments. The books app doesn't know about orders. This separation:
- Makes the codebase navigable — find cart logic in the cart app
- Enables independent testing of each domain
- Allows future extraction of apps into microservices if needed
- Prevents circular dependencies between domains

**The tradeoff:** More files and imports. A simple feature might touch 3-4 apps. But the clarity benefit outweighs the file count overhead for any non-trivial application.

## Decision 6: Cloudinary for Media

**The choice:** Use Cloudinary for book cover image storage rather than local file storage or Backblaze B2.

**Why:** Cloudinary provides on-the-fly image transformations — resize, crop, format conversion, quality optimization. The frontend can request a 200px thumbnail or a 1200px hero image from the same source URL by changing URL parameters. This eliminates the need for image processing pipelines.

**The tradeoff:** Cloudinary is more expensive than raw object storage for simple storage. But the transformation capabilities justify the cost for an image-heavy application like a bookstore.

## Decision 7: Razorpay for Payments

**The choice:** Use Razorpay for INR payments rather than Stripe.

**Why:** Razorpay has better support for Indian payment methods (UPI, net banking, Indian cards) and INR currency handling. For a bookstore targeting Indian customers, Razorpay provides higher payment success rates than international alternatives.

**The tradeoff:** Razorpay is India-specific. Expanding to international markets would require adding Stripe or another international payment processor alongside Razorpay.

## Decision 8: Soft User Deactivation

**The choice:** Deactivate users (set `is_active = False`) rather than deleting them.

**Why:** Deleting users would cascade to orders, support sessions, transcripts — valuable business data. Soft deactivation:
- Preserves all historical data
- Blocks deactivated users at the authentication layer (not at individual endpoints)
- Allows reactivation if needed
- Maintains data integrity for analytics

**The tradeoff:** Deactivated users still consume database space. A future enhancement could add a purge mechanism for long-deactivated users, with data export before deletion.
