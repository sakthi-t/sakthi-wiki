# AI Ecommerce — Project Overview

## An Online Bookstore with an AI Voice Agent

This is a full-stack ecommerce platform for an online bookstore, distinguished by its AI voice customer support agent named **Haney**. Built with Django, React, PostgreSQL, and several integrated services, it demonstrates how to combine traditional ecommerce functionality with modern AI capabilities.

## The Complete Ecommerce Experience

The platform covers the full ecommerce lifecycle:

**For Customers:**
- Browse and search books by title, author, and genre
- Add books to a persistent cart (survives login/logout)
- Save books to a wishlist for later
- Checkout with Razorpay payment integration (INR)
- Track order status from pending through delivery
- Call an AI voice agent for support — ask about orders, get status updates, leave ratings

**For Admins:**
- Manage book inventory with Cloudinary image uploads
- Process orders (view, update status, cancel with inventory restoration)
- Manage users (view, soft-deactivate/reactivate)
- Monitor AI support sessions with transcripts, ratings, and AI-generated summaries
- View analytics across all dimensions

## Why This Project Exists

Three goals drove this project:

**Demonstrate AI integration in ecommerce.** Most ecommerce platforms have basic chatbots. This project shows what's possible with a voice-enabled AI agent — context-aware support, automatic transcript logging, rating capture, and admin monitoring.

**Build a production-quality Django application.** Django is often taught with simple blog or todo apps. This project demonstrates patterns for building real applications: Clerk authentication, Razorpay payments, Cloudinary media, async webhook handling, and multi-service integration.

**Create a reference for full-stack development.** The combination of Django REST Framework (backend API), React + TypeScript (frontend), and multiple third-party services represents a realistic modern stack. The architecture decisions and integration patterns are applicable to many projects beyond ecommerce.

## The Voice Agent: Haney

The most distinctive feature is the AI voice support agent, also named Haney. It's powered by Vapi, which combines:

- **ElevenLabs** for text-to-speech — natural, human-like voice output
- **Deepgram** for speech-to-text — accurate transcription of customer speech
- **OpenAI GPT-4.1** for reasoning — understands customer questions and generates helpful responses

When a customer clicks "Call Haney," the backend builds a context payload — customer name, email, and all order history with status — and injects it into the voice agent's system prompt. This makes Haney context-aware: it knows who's calling, what they ordered, and where each order is in the fulfillment process.

After the call ends, a webhook delivers the transcript, rating, and AI-generated summary to Django, where it's stored for admin review. The entire interaction is captured and analyzable.

## Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Tailwind CSS 4, Vite |
| Backend | Django 6.0, Django REST Framework 3.17 |
| Database | PostgreSQL (Neon Serverless) |
| Auth | Clerk (JWKS + RS256 JWT verification) |
| Payments | Razorpay (INR) |
| Media | Cloudinary |
| AI Voice | Vapi + ElevenLabs TTS + Deepgram STT + GPT-4.1 |
| State Management | TanStack Query 5, React Router 7 |

## Project Structure

```
backend/
├── config/          # Django settings, URLs, WSGI/ASGI
└── apps/
    ├── users/       # Clerk auth integration, user profiles, admin user management
    ├── books/       # Book inventory, Cloudinary image uploads
    ├── cart/        # Persistent cart per authenticated user
    ├── wishlist/    # Persistent wishlist per user
    ├── orders/      # Order history, admin order management
    ├── payments/    # Razorpay payment integration
    ├── support/     # Support sessions, transcripts
    ├── vapi_support/# Vapi AI voice agent webhook handler
    └── common/      # Pagination, permissions, shared utilities
```

Each Django app handles a single domain — users, books, cart, orders, etc. This is the Django "separation of concerns" pattern at work: small, focused apps that are independently understandable.
