# FolioVerse — Payment Gateway Architecture & Integration Guide

**Document Version:** 1.0.0  
**Status:** Engineering Architecture Specification & Implementation Roadmap  
**Target Application:** FolioVerse Book Store (React 19 Frontend + Django REST Framework Backend)  
**Author:** Bipronath Saha (bipronathsaha@gmail.com)

---

## 1. Executive Summary & Problem Analysis

In modern e-commerce applications, payment processing is the most security-sensitive domain of the entire platform. The current baseline implementation in FolioVerse collects a phone number and immediately executes an atomic backend order creation with a synthetic transaction ID.

While this verified database atomicity and inventory locking, it bypasses the real-world **Payment Gateway Lifecycle**:
1. **Interactive Gateway Interface:** Buyers cannot view the official provider branding, scan dynamic QR codes, or execute multi-factor authentication.
2. **Missing SMS OTP & PIN Verification:** No one-time password (OTP) is dispatched, and no secret personal identification number (PIN) is verified against core banking ledgers.
3. **Security & Regulatory Non-Compliance:** Directly asking for a customer's banking PIN on a merchant web form violates **Bangladesh Bank Mobile Financial Services (MFS) Regulations** and **PCI-DSS Level 1** standards.

This document specifies the **3 architectural payment integration approaches** for Bangladesh MFS (bKash, Nagad, Rocket), evaluates their engineering trade-offs, and recommends the **optimal strategy for development, testing, and portfolio/client demonstration**.

---

## 2. Regulatory & Security Foundation (The PIN/OTP Boundary)

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      MERCHANT DOMAIN (FolioVerse)                      │
 │   - Collects shipping address, customer name, email.                  │
 │   - Manages book catalog, cart items, prices, and inventory locks.     │
 │   - NEVER touches, inspects, or stores customer PINs.                  │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │ Encrypted Handshake
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                  GATEWAY / BANKING DOMAIN (MFS Core)                   │
 │   - Dispatches carrier SMS OTP to buyer's SIM card.                   │
 │   - Renders secure input fields for 6-digit OTP and 5-digit PIN.      │
 │   - Debits customer account and deposits into Merchant Escrow.         │
 │   - Issues cryptographic webhook (IPN) confirming transaction hash.    │
 └────────────────────────────────────────────────────────────────────────┘
```

> [!CAUTION]
> **Regulatory Rule:** A merchant website must **never** create custom `<input type="password">` fields to capture a user's bKash or Nagad PIN directly to their own servers. The entry must always occur within the bank's hosted page, an isolated tokenized script modal, or an encrypted sandbox gateway frame.

---

## 3. Deep Dive: The Three Architectural Approaches

```mermaid
graph TD
    Client["Buyer Browser (Firefox / React 19)"]
    
    subgraph "Approach 1: Aggregator (SSLCommerz)"
        SSL_API["SSLCommerz Session API"]
        SSL_Hosted["SSLCommerz Hosted Multi-Channel Gateway"]
        SSL_IPN["Instant Payment Notification (IPN)"]
    end
    
    subgraph "Approach 2: Direct Tokenized MFS"
        bKash_API["bKash Tokenized Checkout API"]
        Nagad_API["Nagad RSA Key-Pair Direct PG"]
        bKash_Modal["bKash Hosted Script Modal"]
    end

    subgraph "Approach 3: Interactive Sandbox Simulator"
        Sim_Engine["FolioVerse MFS Gateway Engine (DRF)"]
        Sim_UI["High-Fidelity MFS Modal (QR + OTP + PIN Keypad)"]
        Sim_State["Transactional Gateway State Machine"]
    end

    Client -->|Option 1| SSL_API
    SSL_API --> SSL_Hosted
    SSL_Hosted --> SSL_IPN

    Client -->|Option 2| bKash_API
    bKash_API --> bKash_Modal

    Client -->|Option 3 (Recommended for Testing)| Sim_Engine
    Sim_Engine --> Sim_UI
    Sim_UI --> Sim_State
```

---

### Approach 1: Integrated Aggregator Gateway (SSLCommerz / AamarPay / Shurjopay)

An aggregator gateway acts as a unified middleware bridge connecting your application to 30+ payment channels across Bangladesh through a single API integration.

#### Technical Workflow
1. **Session Initialization:** When the buyer clicks checkout, Django calls `POST https://sandbox.sslcommerz.com/gwprocess/v4/api.php` with:
   - `store_id` & `store_passwd`
   - `total_amount`, `currency: 'BDT'`, `tran_id: 'FOLIO-ORDER-12345'`
   - `success_url`, `fail_url`, `cancel_url`, `ipn_url`
2. **Redirection / Popup:** SSLCommerz returns a `GatewayPageURL`. The React frontend redirects or opens an embedded iframe modal.
3. **Multi-Channel Selection:** The customer sees tabs for **Mobile Banking (bKash, Nagad, Rocket, Upay)**, **Cards (Visa, Mastercard, AMEX)**, and **Internet Banking**.
4. **MFS Execution:** Selecting bKash displays a dynamic QR code or phone number input. SSLCommerz coordinates with bKash's core banking API to send the SMS OTP and request the PIN.
5. **IPN & Verification:** Upon success, SSLCommerz calls your Django backend via an asynchronous server-to-server webhook (`IPN`). Django validates the transaction hash via `GET /validator/api/validationserverAPI.php` and marks the order as `PAID`.

#### Pros & Cons
- **Pros:**
  - One contract and one integration covers bKash, Nagad, Rocket, and international credit cards simultaneously.
  - Official, bank-grade sandbox environment available for testing.
  - Automatic reconciliation and automated refund APIs.
- **Cons:**
  - Requires business documentation (Trade License, TIN, corporate bank account) for live production.
  - Merchant transaction fees (typically 1.5% - 2.5% per transaction).
  - External sandbox servers occasionally experience latency or maintenance downtime during local testing.

---

### Approach 2: Direct Tokenized MFS Gateway APIs (bKash PGW & Nagad Direct)

Used by high-volume enterprises (e.g., Daraz, Chaldal, Pathao) that negotiate direct merchant agreements with bKash Limited and Nagad.

#### 1. bKash Tokenized Checkout (PGW 1.2.0-beta)
* **Grant Token:** `POST /tokenized/checkout/token/grant` with `app_key` and `app_secret`.
* **Create Payment:** `POST /tokenized/checkout/create` with `amount`, `payerReference`, `merchantInvoiceNumber`. Returns a `paymentID`.
* **Client Script Modal:** The React frontend injects `bKash-script.js`. It renders the signature bKash pink modal (`#E2136E`) containing:
  - Dynamic QR Code (for app scanning)
  - Mobile number entry field
  - Automated carrier SMS OTP dispatch
  - 5-digit encrypted PIN entry
* **Execute Payment:** Upon user PIN entry, bKash calls your callback URL with the `paymentID`. Backend calls `POST /tokenized/checkout/execute` to capture funds.

#### 2. Nagad Direct Merchant API
* **Asymmetric RSA Cryptography:** Nagad uses 2048-bit RSA public/private key-pairs.
* The backend encrypts sensitive order payloads with Nagad's Public Key and signs the request with the Merchant Private Key.
* Redirects the user to the Nagad web portal for OTP and PIN verification.

#### Pros & Cons
- **Pros:**
  - Lowest transaction fees (direct bank rate).
  - Native, seamless brand experience with high customer trust.
  - Supports one-click recurring tokenized payments.
- **Cons:**
  - **High Administrative Friction:** Requires separate contracts, separate bank reconciliations, and separate technical SDKs for bKash, Nagad, and Rocket individually.
  - Nagad's RSA key exchange is notoriously complex to maintain and troubleshoot.
  - Rocket does not have a modern self-service developer portal.

---

### Approach 3: High-Fidelity Interactive Gateway Simulator & Sandbox Engine

*The professional architectural solution designed for local engineering, automated testing, continuous integration, and stakeholder demonstrations.*

Rather than relying on brittle third-party sandbox servers that require external internet access and real SIM cards to receive SMS, you build a **first-class Gateway Sandbox Engine** within FolioVerse that faithfully adheres to the exact state machine and security protocols of bKash, Nagad, and Rocket.

#### Architectural Components

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                       INTERACTIVE GATEWAY MODAL                        │
 ├────────────────────────────────────────────────────────────────────────┤
 │  [Header] Provider Branding (bKash #E2136E / Nagad #F7931E / Rocket)   │
 │           Merchant Name: FolioVerse Books | Amount: ৳1,450.00          │
 │           Session Countdown Timer: 04:59 (Auto-expires)                │
 ├────────────────────────────────────────────────────────────────────────┤
 │  [Tabs]                                                                │
 │   ┌───────────────────────┐ ┌──────────────────────────────────────┐   │
 │   │  Tab 1: QR Code Scan  │ │    Tab 2: Mobile Number & OTP/PIN    │   │
 │   └───────────────────────┘ └──────────────────────────────────────┘   │
 │                                                                        │
 │   [Tab 1 Content]:                                                     │
 │   - Dynamic Vector QR Code containing encrypted transaction payload    │
 │   - Instruction: "Open bKash/Nagad App -> Scan & Pay"                  │
 │   - Simulated "App Scan Received" webhook trigger button               │
 │                                                                        │
 │   [Tab 2 Content - Step 1]: Mobile Number Input (01XXXXXXXXX)          │
 │   [Tab 2 Content - Step 2]: 6-Digit SMS OTP Screen with 60s Timer      │
 │   [Tab 2 Content - Step 3]: Masked Security PIN Keypad (•••••)         │
 ├────────────────────────────────────────────────────────────────────────┤
 │  [Footer] 256-Bit SSL Encrypted | Authorized by Bangladesh Bank        │
 └────────────────────────────────────────────────────────────────────────┘
```

#### State Machine Protocol (Backend & Frontend)

```text
 [INITIATED] ──> [OTP_DISPATCHED] ──> [OTP_VERIFIED] ──> [PIN_ENTERED] ──> [CAPTURED/PAID]
      │                 │                    │                 │
      ▼                 ▼                    ▼                 ▼
  [EXPIRED]        [RESEND_OTP]        [INVALID_OTP]     [INVALID_PIN]
```

1. **Step 1 (`/api/orders/gateway/initiate/`):**
   - Validates book inventory with PostgreSQL `select_for_update()`.
   - Generates a unique `gateway_session_id`, an expiring secret cryptographic token (valid for 5 minutes), and the dynamic QR payload.
2. **Step 2 (`/api/orders/gateway/send-otp/`):**
   - Buyer enters their 11-digit mobile number.
   - The backend generates a cryptographically random 6-digit OTP (e.g. `482910`).
   - Dispatches a toast/simulation notification: *"FolioVerse Gateway: Your OTP is 482910. Valid for 2 minutes. Do not share with anyone."*
3. **Step 3 (`/api/orders/gateway/verify-otp/`):**
   - Validates the OTP against the session cache.
   - Enforces rate-limiting (maximum 3 failed attempts before session invalidation).
4. **Step 4 (`/api/orders/gateway/verify-pin/`):**
   - Accepts the masked PIN (`•••••`) via numeric keypad.
   - Verifies security constraints (ensures PIN is not empty or malformed).
   - Simulates core banking fund clearance.
5. **Step 5 (`/api/orders/gateway/finalize/`):**
   - Generates an authentic MFS Transaction ID (e.g. `BKASH-TXN-9K2M4P01`).
   - Decrements book stock, transitions `Order.payment_status = 'paid'`, records payment breakdown, and issues a downloadable digital invoice.

---

## 4. 

### Comparative Evaluation Matrix

| Evaluation Criteria | Approach 1 (SSLCommerz) | Approach 2 (Direct bKash/Nagad) | Approach 3 (Interactive Sandbox) |
| :--- | :---: | :---: | :---: |
| **Testing Isolation & Speed** | ⚠️ Relies on external server uptime | ❌ High friction, strict rate limits | ⭐⭐⭐ **Instant, 100% deterministic** |
| **Full UI/UX Coverage (QR + OTP + PIN)** | ⚠️ Managed on external domain | ⚠️ Difficult to script locally | ⭐⭐⭐ **Complete interactive UI in Firefox** |
| **No SIM Card / External SMS Required** | ❌ Requires dummy test numbers | ❌ Requires developer sandbox setup | ⭐⭐⭐ **Instant on-screen OTP verification** |
| **Automated Testing & CI/CD** | ❌ External network mocks needed | ❌ Flaky external dependencies | ⭐⭐⭐ **Runs cleanly in pytest & DRF tests** |
| **Prerequisites / Licensing Cost** | Merchant Registration needed | Trade License & Bank Contracts | **0 BDT (Completely Self-Contained)** |
| **Edge Case Testing (Timeouts, Errors)** | ⚠️ Hard to force failure modes | ❌ Limited error simulation | ⭐⭐⭐ **Test wrong OTP, wrong PIN, timeout** |

###  Architect Verdict:
**For testing, portfolio presentation, and development purposes, Approach 3 (High-Fidelity Interactive Gateway Simulator) is undeniably the superior choice.**

#### Why?
1. **Zero External Dependency Friction:** You do not need to wait for business license approvals, signed banking agreements, or external network reachability to test the complete user journey.
2. **True Interactive Experience:** The user gets to experience the exact steps they requested:
   - Selecting bKash, Nagad, or Rocket with provider branding.
   - Scanning a dynamic QR code with an expiry timer.
   - Receiving and entering a 6-digit OTP code with a live countdown resend button.
   - Typing a masked PIN into a secure keypad.
   - Receiving an authentic transaction receipt and order confirmation.
3. **Production-Ready Architecture (The Strategy Pattern):**
   By implementing Approach 3 using the **Strategy Design Pattern**, our backend code will define an abstract `PaymentGatewayProvider` interface. The simulator implements this interface today; when you acquire live SSLCommerz or bKash API keys in the future, you simply add `SSLCommerzProvider.py` without modifying a single line of your checkout UI.

---

## 5. Architectural Implementation Blueprint (Strategy Pattern)

```text
                        ┌──────────────────────────────┐
                        │ <<interface>>                │
                        │ PaymentGatewayProvider       │
                        ├──────────────────────────────┤
                        │ + initiate_session(order)    │
                        │ + send_otp(session_id, phone)│
                        │ + verify_otp(session_id, otp)│
                        │ + confirm_pin(session_id, pin│
                        │ + execute_payment(session_id)│
                        └──────────────┬───────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
 ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
 │  SimulatorProvider   │   │  SSLCommerzProvider  │   │   BKashDirectProvider│
 │  (Default / Testing) │   │  (Production Ready)  │   │   (Enterprise Ready) │
 └──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

### Backend Models & Endpoints (`backend/books/`)
1. **Database Model: `PaymentTransaction`**
   - Fields: `order`, `session_token`, `provider` (bkash/nagad/rocket), `amount`, `customer_phone`, `otp_code`, `otp_expiry`, `otp_attempts`, `pin_attempts`, `status` (`INITIATED`, `OTP_SENT`, `VERIFIED`, `PAID`, `FAILED`, `EXPIRED`), `transaction_id`.
2. **REST Endpoints (`/api/payments/`):**
   - `POST /api/payments/initiate/` -> Creates session, returns QR data and session token.
   - `POST /api/payments/send-otp/` -> Generates OTP and dispatches notification.
   - `POST /api/payments/verify-otp/` -> Verifies code against session.
   - `POST /api/payments/confirm-pin/` -> Verifies PIN format and completes transaction.
   - `POST /api/payments/qr-scan-callback/` -> Simulates instant payment from mobile app QR scan.

### Frontend Components (`frontend/src/components/`)
1. **`MfsGatewayModal.jsx`:**
   - Provider Theme Switcher (bKash `#E2136E`, Nagad `#F7931E`, Rocket `#8C3494`).
   - Dynamic SVG QR Code generator (with live 5-minute countdown).
   - OTP screen with auto-tabbing 6-box input and 60-second resend countdown.
   - Numeric PIN keypad with masked display and shake animation on invalid PIN.
   - Live loading spinners and success receipt screens.
2. **Cart Drawer & Buy Modal Integration:**
   - Replaces the current instant checkout with the multi-step gateway handshake.

---

## 6. Summary Checklist for Testing Rollout

- [x] Architecture Specification Document created ([doc/paymentGatwayGuide.md](file:///f:/Projects/FolioVerse/doc/paymentGatwayGuide.md)).
- [ ] Implement backend `PaymentTransaction` model & migrations.
- [ ] Implement pluggable `PaymentGatewayProvider` with `SimulatorProvider`.
- [ ] Build React `MfsGatewayModal.jsx` with QR Code, OTP, and PIN screens.
- [ ] Connect `CartDrawer.jsx` and `BuyBookModal.jsx` to the new gateway workflow.
- [ ] Test the complete purchase cycle in Mozilla Firefox.
