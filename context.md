# PulsePay - Project Context & Build Guide

---

## 🚀 Vision & Mission

PulsePay is an AI-powered emergency payment platform designed for health crises, blending fintech and health utility. It enables instant, secure, and verifiable payments during emergencies, leveraging blockchain, AI, and modern authentication. The platform is built for hackathon speed, investor-grade modularity, and real-world scalability.

---

## 🏗️ Optimal File Structure

```
pulsepay/
├── app/                # Expo React Native app (mobile)
│   ├── assets/
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   ├── theme/
│   ├── types/
│   ├── App.tsx
│   └── ...
├── web/                # Next.js frontend (web)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── services/
│   ├── theme/
│   ├── types/
│   ├── public/
│   └── ...
├── api/                # FastAPI backend (or Next.js API routes)
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── models/
│   ├── utils/
│   ├── templates/
│   └── ...
├── contracts/          # Smart contracts (Solidity)
│   ├── PulsePay.sol
│   ├── deploy/
│   └── ...
├── .env                # Root environment variables (never commit)
├── .env.example        # Example env file for contributors
├── README.md           # Full instructions
├── context.md          # This file (project context)
├── image.png           # Logo (see end of this file)
└── ...
```

---

## 🎨 Color Scheme & Branding (Inspired by Logo)

- **Primary Gradient:**
  - Pink (#E573B7) → Purple (#7B61FF) → Gold (#FFD166)
- **Accent:**
  - White (#FFFFFF), Deep Blue (#232946), Soft Shadow (#1A1A2E)
- **Typography:**
  - Headings: "Inter", "Montserrat", or "Poppins", bold
  - Body: "Inter", "Roboto", or system font
- **Logo Usage:**
  - Always display logo on landing, auth, and success screens
  - Use logo colors for call-to-action buttons and highlights
- **Animations:**
  - Heartbeat pulse on logo (CSS/React Native animation)
  - Smooth fade-in for modals and notifications
  - Button hover: gradient shift, slight scale up
  - Payment success: confetti or pulse effect

---

## 🧩 Key Dependencies

### Web (Next.js)
- next, react, react-dom
- typescript
- tailwindcss, postcss, autoprefixer
- ethers, wagmi, walletconnect
- @supabase/supabase-js
- axios, swr
- framer-motion (animations)
- dotenv
- openai (for OpenAI API)
- @heroicons/react (icons)

### Mobile (Expo/React Native)
- expo, react-native, react-navigation
- expo-router
- @walletconnect/react-native-dapp
- @supabase/supabase-js
- ethers
- axios
- react-native-reanimated
- react-native-svg
- lottie-react-native (animations)
- dotenv

### Backend (FastAPI)
- fastapi
- uvicorn
- python-dotenv
- httpx
- openai
- supabase-py
- flask-mail (for custom emails)
- jinja2 (email templates)
- telesignsdk
- idanalyzer

### Smart Contracts
- solidity (PulsePay.sol)
- hardhat or foundry (deployment)
- ethers (interaction)

---

## 🔑 Environment Variables (.env)

- `OPENAI_API_KEY` (OpenAI API)
- `SUPABASE_URL` (Supabase project URL)
- `SUPABASE_ANON_KEY` (Supabase anon key)
- `ALCHEMY_API_KEY` (Alchemy RPC)
- `INFURA_API_KEY` (Infura RPC)
- `TELESIGN_API_KEY` (Telesign)
- `IDANALYZER_API_KEY` (IDAnalyzer)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` (Flask Mail)
- `NEXT_PUBLIC_*` for public web envs
- `EXPO_PUBLIC_*` for public mobile envs

**Best Practice:**
- Never commit `.env` files. Use `.env.example` for contributors.
- Load envs using `dotenv` (web, mobile, backend).

---

## 🗂️ Required Pages & Screens

### Web (Next.js)
- `/` (Landing)
- `/login` (Auth)
- `/register` (Sign up)
- `/pay` (Payment)
- `/success` (Payment confirmation)
- `/profile` (User dashboard)
- `/history` (Payment history)
- `/admin` (Admin dashboard, if needed)
- `/api/*` (API routes if not using FastAPI)

### Mobile (Expo)
- `HomeScreen` (Landing)
- `LoginScreen` (Auth)
- `RegisterScreen` (Sign up)
- `PaymentScreen` (Payment)
- `SuccessScreen` (Confirmation)
- `ProfileScreen` (User info)
- `HistoryScreen` (Payment history)
- `AdminScreen` (Admin, optional)

---

## 👤 Account Types

- **User:**
  - Can send/receive payments, view history, manage profile
- **Admin:**
  - Can view all transactions, manage users, moderate fraud/ID checks
- **Guest:**
  - Limited access, can view landing and info pages

---

## 🔌 API Integrations

### 1. Supabase
- Auth (email/password, magic link)
- Database (users, payments, logs)
- Realtime (optional)

### 2. Flask Mail (for non-Supabase emails)
- Custom email templates (Jinja2)
- Transactional emails (payment confirmation, alerts)

### 3. OpenAI API (via OpenRouter)
- ID text extraction
- Fraud scoring
- Eligibility checks

### 4. Telesign
- Device/email/phone fraud scoring

### 5. IDAnalyzer
- Global ID verification

### 6. Blockchain (ethers.js, WalletConnect)
- Payment flows (Base/Polygon testnet)
- Smart contract interaction

---

## ✉️ Custom Email Templates (Jinja2/Flask Mail)

- `welcome.html` (Welcome new user)
- `payment_confirmation.html` (Payment receipt)
- `alert.html` (Fraud/ID issues)
- Use logo and color scheme for branding
- Responsive, accessible design

---

## 🛡️ Security & Compliance

- Use HTTPS everywhere
- Store secrets in env vars only
- Validate all user input (backend & frontend)
- Use Supabase RLS (Row Level Security)
- Log all payment attempts and fraud checks
- GDPR/CCPA ready (data export/delete endpoints)

---

## 🧱 Clean Architecture Principles

- **Separation of Concerns:** UI, business logic, data access
- **Reusable Components:** Shared UI and logic modules
- **Type Safety:** TypeScript everywhere
- **API Layer:** Centralized API calls (services/)
- **Hooks:** For state, auth, payments
- **Testing:** Unit and integration tests (Jest, React Testing Library, Pytest)
- **CI/CD:** Vercel (web), EAS (mobile), GitHub Actions (optional)

---

## 📝 50-Step Build Plan

1. Create `pulsepay/` root directory
2. Add `context.md` (this file)
3. Add `image.png` (logo)
4. Scaffold `web/` with Next.js + TypeScript
5. Scaffold `app/` with Expo + TypeScript
6. Scaffold `api/` with FastAPI (or use Next.js API routes)
7. Scaffold `contracts/` with sample Solidity contract
8. Initialize git, add `.gitignore`, `.env.example`
9. Set up TailwindCSS in `web/`
10. Set up Expo Router in `app/`
11. Add color scheme and theme files in both `web/theme/` and `app/theme/`
12. Create shared UI components (Button, Card, Modal, etc.)
13. Implement logo animation (heartbeat pulse) in both web and app
14. Set up Supabase project, get URL and anon key
15. Add Supabase client config to both web and app
16. Implement Supabase auth (email/password, magic link)
17. Create user registration and login pages/screens
18. Add user profile and payment history pages/screens
19. Set up ethers.js and WalletConnect in both web and app
20. Create payment page/screen (connect wallet, enter amount, confirm)
21. Integrate testnet (Base/Polygon) via Alchemy/Infura
22. Implement payment confirmation page/screen
23. Add OpenAI API integration (via OpenRouter) for ID/fraud checks
24. Create backend endpoints for `/verify-id`, `/check-fraud`, `/process-payment`
25. Integrate Telesign for device/email/phone scoring
26. Integrate IDAnalyzer for global ID verification
27. Add Flask Mail for custom emails (non-Supabase)
28. Create Jinja2 email templates (welcome, payment, alert)
29. Add .env management and loading in all modules
30. Implement admin dashboard (web/app)
31. Add transaction logging and audit trail
32. Set up Row Level Security (RLS) in Supabase
33. Add GDPR/CCPA endpoints (data export/delete)
34. Implement error handling and user notifications
35. Add framer-motion and lottie animations
36. Write unit tests for core logic (web/app/api)
37. Write integration tests for payment and auth flows
38. Set up CI/CD (Vercel, EAS, GitHub Actions)
39. Deploy web app to Vercel, get shareable URL
40. Run Expo Go with `--tunnel`, share QR code
41. Build EAS apps for iOS/Android, share links
42. Deploy backend (Railway, Vercel, or other)
43. Deploy smart contract to testnet (Remix/Foundry)
44. Integrate contract address in web/app
45. Add payment success confetti/pulse animation
46. Polish UI/UX for hackathon/investor demo
47. Update README.md with all run/build/deploy steps
48. Add screenshots and demo video links
49. Review for security, compliance, and best practices
50. Submit to hackathon/investors with full documentation

---

## 🏆 Best Practices & Tips

- Use TypeScript for all code (web, app, backend)
- Keep styling consistent with logo and color scheme
- Modularize code for easy hackathon iteration
- Use testnets and test wallets for all blockchain flows
- Store all API keys in `.env`, never in code
- Use Supabase for all user and payment data
- Use OpenAI for all text-based verification/scoring
- Use Telesign and IDAnalyzer for robust fraud/ID checks
- Use custom email templates for branding
- Test on multiple devices (web, Expo Go, EAS builds)
- Keep README.md and context.md up to date

---

## 📦 Example .env.example

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=...
ALCHEMY_API_KEY=...
INFURA_API_KEY=...
TELESIGN_API_KEY=...
IDANALYZER_API_KEY=...
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=...
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🛠️ Key Functions & Modules

### Web/App
- `useAuth()` - Supabase auth hook
- `usePayment()` - Payment flow hook
- `useIDVerification()` - Calls OpenAI/IDAnalyzer
- `useFraudCheck()` - Calls Telesign
- `sendEmail()` - Calls Flask Mail API
- `apiClient.ts` - Centralized API calls
- `theme.ts` - Color and style constants
- `AnimatedLogo.tsx` - Heartbeat logo animation

### Backend
- `/verify-id` - POST, verifies ID via OpenAI/IDAnalyzer
- `/check-fraud` - POST, scores device/email/phone via Telesign
- `/process-payment` - POST, initiates payment
- `/send-email` - POST, sends custom email
- `/admin/*` - Admin endpoints

### Contracts
- `PulsePay.sol` - Accepts stablecoin, logs payments

---

## 🧑‍💻 Contributor Onboarding

1. Clone repo, copy `.env.example` to `.env`, fill in secrets
2. Install dependencies in `web/`, `app/`, and `api/`
3. Run web: `cd web && npm run dev`
4. Run mobile: `cd app && npx expo start --tunnel`
5. Run backend: `cd api && uvicorn main:app --reload`
6. Deploy web: `cd web && npx vercel`
7. Build mobile: `cd app && eas build -p ios|android`
8. Deploy backend: Railway/Vercel/other
9. Deploy contract: Remix/Foundry
10. Update docs/screenshots as you go

---

## 🖼️ Logo Reference

Place the following logo at the root as `image.png`:

```
image.png
```

---

## 📚 Further Reading & Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Expo Docs](https://docs.expo.dev/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [ethers.js Docs](https://docs.ethers.org/)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Telesign Docs](https://developer.telesign.com/)
- [IDAnalyzer Docs](https://developer.idanalyzer.com/)
- [Vercel Docs](https://vercel.com/docs)
- [EAS Build Docs](https://docs.expo.dev/eas/)
- [Remix IDE](https://remix.ethereum.org/)

---

## 🧩 3D Hero Implementation & Cross-Platform Notes

### 3D Hero (Pulse3DHero)
- Built with @react-three/fiber and @react-three/drei for a modern, animated 3D hero section.
- Uses a floating, glowing heart (TorusKnot placeholder) in PulsePay colors.
- Responsive, performant, and visually stunning for web.

### Cross-Platform (Web & App) Compatibility
- All UI libraries (shadcn/ui, lucide-react, framer-motion, chart.js, @react-three/fiber) are compatible with Next.js web.
- For Expo/React Native Web:
  - @react-three/fiber works in web builds, but for native mobile, use Expo GLView or a compatible wrapper.
  - Some charting/3D features may require polyfills or web-only guards (e.g., render 2D fallback or hide 3D/chart on native if needed).
  - Use feature detection or platform checks (`Platform.OS === 'web'`) to conditionally render advanced features.
- Always test both web and app builds after adding new features.
- Document any issues, workarounds, or platform-specific code in README and context.md.

### Best Practices
- Keep 3D and chart features in isolated components for easy swapping or fallback.
- Use web-only guards for features not supported on native.
- Regularly test with `npm run dev` (web) and `npx expo start --web` (Expo web) and on real devices.

---

## 🏁 You are now ready to build PulsePay!

Follow this context.md for every step. For questions, refer to the linked docs or ask your AI pair programmer.

---

# END OF CONTEXT 