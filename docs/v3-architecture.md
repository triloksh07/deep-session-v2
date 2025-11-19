## DeepSession - v3 architecture

```sh
app/
├── (auth)/             <-- For login/signup pages
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
│
├── (authed)/           <-- Your main app lives here
│   ├── layout.tsx      <-- **The new "Dashboard Shell"**
│   ├── dashboard/
│   │   └── page.tsx    <-- (This is your old 'Dashboard' tab)
│   ├── sessions/
│   │   └── page.tsx    <-- (This is your old 'Sessions' tab)
│   ├── goals/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   └── export/
│       └── page.tsx
│
├── layout.tsx          <-- Root layout (ThemeProvider, Toaster, etc.)
└── page.tsx            <-- The new "Home" page (e.g., marketing or redirect)
```