# AI Ecommerce — Product Recommendation Flow

## Current State: Browse and Search

The current implementation focuses on core ecommerce functionality rather than AI-powered recommendations. Here's what exists and where it's heading.

## Current Browse Flow

**Book Discovery:**
- Browse all books with pagination
- Search by title, author, and genre
- View book details (cover image, price, availability, description)
- Filter by genre category

The search is implemented through Django's ORM with `icontains` lookups — standard SQL LIKE queries. For a bookstore catalog (hundreds to thousands of books), this is sufficient. As the catalog grows, full-text search with PostgreSQL `tsvector` (like Vectorless RAG uses) would improve relevance.

**Cart and Wishlist:**
- Add books to cart with quantity validation (capped to available stock)
- Move items to wishlist for later
- Persistent across sessions — cart survives login/logout
- Both frontend (disabled buttons) and backend (capped PATCH) quantity enforcement

## The Checkout Flow

The checkout flow is where product decisions converge:

1. **Cart Review:** Customer reviews items, adjusts quantities, sees total
2. **Stock Validation:** Backend validates all quantities against current inventory
3. **Order Creation:** Order is created, stock deducted immediately
4. **Payment:** Razorpay modal handles payment
5. **Confirmation:** Order confirmed, confirmation page with summary

At each step, the system ensures the customer can only purchase what's actually available. This is critical for ecommerce — nothing frustrates customers more than completing payment only to learn their item was out of stock.

## AI Recommendations: The Roadmap

The current system doesn't have AI-powered recommendations, but the architecture is designed to support them:

### Short-Term: Collaborative Filtering

The simplest recommendation approach: "Customers who bought X also bought Y." With order history data in the database, implementing collaborative filtering requires:

- Build an item-item similarity matrix from order data
- For each book, find books frequently purchased together
- Display "Frequently Bought Together" on book detail pages

This is a well-understood technique that works well for bookstores where purchase patterns are strong signals.

### Medium-Term: Content-Based Recommendations

Use book metadata (title, author, genre, description) to recommend similar books:

- Embed book descriptions using a text embedding model
- For each book, find the most similar books by cosine similarity
- Display "Similar Books" on book detail pages
- Update similarities when new books are added

Content-based recommendations work well for new books that have no purchase history (the "cold start" problem for collaborative filtering).

### Long-Term: LLM-Powered Recommendations

Use the LLM to generate personalized recommendations:

- Analyze customer's order history and wishlist
- Understand reading preferences from genres and authors
- Generate natural language recommendations: "Based on your interest in science fiction, you might enjoy..."
- Integrate with the voice agent: "Haney, what should I read next?"

LLM recommendations can capture subtle patterns — thematic similarities, writing style preferences, reading level matching — that simple similarity metrics miss.

### Hybrid Approach

The best recommendation systems combine multiple signals:

- Collaborative filtering for "what similar customers bought"
- Content-based for "what's similar to what you're viewing"
- LLM for "understanding your taste and suggesting accordingly"
- Popularity for "what's trending" (new customers with no history)

The architecture supports all of these — order history is structured data, book metadata is available, and LLM integration is already established through the voice agent.

## Inventory Intelligence (Future)

Beyond recommendations, AI could improve inventory management:

- **Demand forecasting:** Predict which books will be popular based on trends
- **Restocking alerts:** Automatically flag low-stock items that are frequently purchased
- **Price optimization:** Suggest pricing based on demand and competitor analysis
- **Seasonal recommendations:** Adjust homepage features based on time of year (textbooks in August, gift books in December)
