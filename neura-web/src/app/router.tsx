import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/features/dashboard/pages/DashboardPage";
import TasksPage from "@/features/tasks/pages/TasksPage";
import AllLists from "@/features/tasks/pages/AllListsPage";
import SingleList from "@/features/tasks/pages/SingleListPage";
import AllNotesPage from "@/features/notes/pages/AllNotesPage";
import NoteEditorPage from "@/features/notes/pages/NoteEditorPage";
import FocusTimerPage from "@/features/focus/pages/FocusTimerPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignUpPage from "@/features/auth/pages/SignUpPage";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import GuestRoute from "@/features/auth/components/GuestRoute";
import { CalendarPage } from "@/features/tasks/pages/CalendarPage";
import SettingPage from "@/features/settings/pages/SettingsPage";
import AssistantPage from "@/features/assistant/pages/AssistantPage";
import { HabitsPage } from "@/features/habits/pages/HabitsPage";
import { GoalsPage } from "@/features/goals/pages/GoalsPage";
import { GoalDetailPage } from "@/features/goals/pages/GoalDetailPage";
import { RemindersPage } from "@/features/reminders/pages/RemindersPage";
import { BrainstormsPage } from "@/features/brainstorms/pages/BrainstormsPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "lists", element: <AllLists /> },
      { path: "list/:id", element: <SingleList /> },
      { path: "notes", element: <AllNotesPage /> },
      { path: "note/:id", element: <NoteEditorPage /> },
      // Old URLs: notes are now written and edited on the same page
      { path: "notes/add", element: <Navigate to="/note/new" replace /> },
      { path: "note/:id/edit", element: <NoteEditorPage /> },
      { path: "settings", element: <SettingPage /> },
      { path: "focus", element: <FocusTimerPage /> },
      { path: "habits", element: <HabitsPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "goal/:id", element: <GoalDetailPage /> },
      { path: "reminders", element: <RemindersPage /> },
      { path: "brainstorms", element: <BrainstormsPage /> },
      { path: "assistant", element: <AssistantPage /> },
    ],
  },
  {
    path: "login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: "signup",
    element: (
      <GuestRoute>
        <SignUpPage />
      </GuestRoute>
    ),
  },
]);