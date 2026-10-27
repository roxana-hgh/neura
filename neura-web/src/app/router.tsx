import { createBrowserRouter } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/features/dashboard/pages/DashboardPage";
import TasksPage from "@/features/tasks/pages/TasksPage";
import AllLists from "@/features/tasks/pages/AllListsPage";
import SingleList from "@/features/tasks/pages/SingleListPage";
import AllNotesPage from "@/features/notes/pages/AllNotesPage";
import SingleNotes from "@/features/notes/pages/SingleNotePage";
import FocusTimerPage from "@/features/focus/pages/FocusTimerPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignUpPage from "@/features/auth/pages/SignUpPage";
import AddEditNotePage from "@/features/notes/pages/AddEditNotePage";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import GuestRoute from "@/features/auth/components/GuestRoute";
import { CalendarPage } from "@/features/tasks/pages/CalendarPage";
import SettingPage from "@/features/settings/pages/SettingsPage";
import AssistantPage from "@/features/assistant/pages/AssistantPage";
import { HabitsPage } from "@/features/habits/pages/HabitsPage";


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
      { path: "note/:id", element: <SingleNotes /> },
      { path: "notes/add", element: <AddEditNotePage /> },
      { path: "note/:id/edit", element: <AddEditNotePage /> },
      { path: "settings", element: <SettingPage /> },
      { path: "focus", element: <FocusTimerPage /> },
      { path: "habits", element: <HabitsPage /> },
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