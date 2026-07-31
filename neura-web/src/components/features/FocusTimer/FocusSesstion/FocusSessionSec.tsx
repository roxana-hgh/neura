import { useState } from "react";
import FocusTimer from "../Timer/FocusTimer";
import SessionStats from "../components/SessionStats";

import SessionSaveDialog from "../components/SessionSaveDialog";
import SessionHistory from "../components/SessionHistory";


interface PendingSession { duration: number; startTime: Date; endTime: Date; }

function FocusSession() {
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);

  return (
    <div className="w-full min-h-screen ">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-center font-medium text-base mb-2 dark:text-neutral-200">Neura Focus Mode</h2>
        <FocusTimer onSessionComplete={setPendingSession} />
      </div>

      <div className="py-6 p-2 md:px-4 mx-auto grid gap-6">
        <SessionStats />
        <SessionHistory />
      </div>

      <SessionSaveDialog pendingSession={pendingSession} onClose={() => setPendingSession(null)} />
    </div>
  );
}

export default FocusSession;