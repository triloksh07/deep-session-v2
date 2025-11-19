// app/(authed)/dashboard/sessions/SessionLogClient.tsx
"use client";
import { useState } from "react";

export default function SessionLog({ initialSessions }: { initialSessions: any[] }) {
  const [data] = useState(initialSessions);
  return <div>{/* render sessions */}</div>;
}
