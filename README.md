
-----

# DeepSession v2

A modern, offline-first web application designed to help you track and analyze your deep work and focus sessions. Built with a robust architecture for real-time, cross-device synchronization.

This project is the successor to `v0`, migrating from a simple MVP to a scalable, professional-grade application.

## ✨ Core Features

  * **Offline-First:** Start, stop, and manage your timer with zero internet connection. All data syncs automatically when you're back online.
  * **Real-Time Cross-Device Sync:** Start a timer on your desktop and see it ticking live on your phone.
  * **Robust Session Timer:** The timer survives browser reloads and tab closures, using `v0` timer engine (`PersistentTimer.ts`).
  * **Secure Authentication:** Sign in with Email/Password, Google, or GitHub.
  * **Session History & Data Adapter:** A detailed log of all past sessions. The app correctly adapts and displays data from your `v0` database.
  * **Goal Tracking:** Create, track, and manage your daily, weekly, or monthly focus goals.
  * **Data Analytics:** Visualize your productivity with charts and graphs.
  * **Data Export:** Download your session and goal data as JSON or CSV.

-----

## 🚀 Architecture & Tech Stack

This project uses a modern, scalable architecture designed for a robust user experience by cleanly separating server-side and client-side state.

  * **Framework:** [Next.js](https://nextjs.org/) (with Turbopack)
  * **UI:** [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
  * **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
  * **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication & Firestore)

### State Management

This app's state is managed in three distinct layers:

1.  **Server State (TanStack Query):**
    All server-side *lists* (e.g., your log of finished sessions, your list of goals) are managed by **[TanStack Query v5](https://tanstack.com/query/latest)**. This gives us powerful caching, request de-duplication, and automatic background refetching.

2.  **Live Client State (Zustand):**
    The *live timer* and its immediate state (`isActive`, `onBreak`, `startTime`) are managed in a global **[Zustand](https://zustand-demo.pmnd.rs/)** store. This provides a fast, optimistic UI that is decoupled from components.

3.  **Real-time & Offline Sync (Firebase):**
    We use **Firebase's `onSnapshot` listener** to create a 2-way sync between the `active_sessions/{userId}` document in Firestore and our Zustand store.

      * **Offline-First:** Thanks to `persistentLocalCache`, when you start a session offline, the Zustand action calls `setDoc()`, which writes *instantly* to the local cache. The `onSnapshot` listener hears this local change and updates the UI immediately.
      * **Cross-Device Sync:** When another device updates the document, `onSnapshot` hears the server change and updates the store, keeping all devices in sync.

-----

## 🏁 Getting Started

### 1\. Environment Variables

Create a `.env.local` file in the root of the project and add your Firebase project configuration:

```env
NEXT_PUBLIC_API_KEY=...
NEXT_PUBLIC_AUTH_DOMAIN=...
NEXT_PUBLIC_PROJECT_ID=...
NEXT_PUBLIC_STORAGE_BUCKET=...
NEXT_PUBLIC_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_APP_ID=...
NEXT_PUBLIC_MEASUREMENT_ID=...
```

### 2\. Set Up Firebase

1.  **Enable Authentication:** In your Firebase project, enable the **Email/Password**, **Google**, and **GitHub** sign-in providers.
2.  **Enable Firestore:** Create a Firestore database.
3.  **Set Up Security Rules:** You must add rules to allow users to read/write their own data.
    ```firestore
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // Users can only read/write their own profile
        match /users/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }

        // Users can only manage their own finished sessions
        match /sessions/{sessionId} {
          allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
          allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        }
        
        // Users can only manage their own goals
        match /goals/{goalId} {
          allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
          allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        }

        // Users can only manage their *own* single active session
        match /active_sessions/{userId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```
4.  **Create Indexes:** You must create composite indexes for your queries to work:
      * `sessions` collection: `userId` (Ascending), `started_at` (Descending)
      * `goals` collection: `userId` (Ascending), `createdAt` (Descending)

### 3\. Install Dependencies and Run

This project uses `pnpm`.

```bash
# Install dependencies
pnpm install

# Run the development server (with Turbopack)
pnpm dev
```

*(This command is from `package.json`)*

-----

## 🗺️ Future Roadmap

  * [✔️] **Toast Notifications:** Add user feedback for actions (e.g., "Session Saved\!", "Error").
  * [ ] **Picture-in-Picture (PiP):** Add a PiP mode for the timer on desktop.
  * [ ] **Mobile Notifications:** Implement session controls via the mobile notification panel.
  * [ ] **UI/Theme Refinement:** Continue to refine the design, themes, and user experience.

  * [ ] **Data-Adapter Refactor:** Fully move data-adapter logic from hooks into `lib/adapter.ts` to be used by all parts of the app.