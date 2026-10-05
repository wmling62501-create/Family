import { AppLayout } from "./components/layout/app-layout";
import { ProtectedRoute } from "./components/layout/protected-route";
import Activities from "./pages/Activities";
import ActivityDetail from "./pages/ActivityDetail";
import ActivityEdit from "./pages/ActivityEdit";
import ActivityNew from "./pages/ActivityNew";
import Admin from "./pages/Admin";
import Index from "./pages/Index";
import Login from "./pages/Login";
import MemberDetail from "./pages/MemberDetail";
import Members from "./pages/Members";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Tree from "./pages/Tree";

export const routers = [
  {
    path: "/login",
    name: "login",
    element: <Login />,
  },
  {
    path: "/reset-password",
    name: "resetPassword",
    element: <ResetPassword />,
  },
  {
    path: "/",
    name: "app",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, name: "home", element: <Index /> },
      { path: "activities", name: "activities", element: <Activities /> },
      { path: "activities/new", name: "activityNew", element: <ActivityNew /> },
      {
        path: "activities/:id",
        name: "activityDetail",
        element: <ActivityDetail />,
      },
      {
        path: "activities/:id/edit",
        name: "activityEdit",
        element: <ActivityEdit />,
      },
      { path: "members", name: "members", element: <Members /> },
      { path: "members/:id", name: "memberDetail", element: <MemberDetail /> },
      { path: "tree", name: "tree", element: <Tree /> },
      {
        path: "admin",
        name: "admin",
        element: (
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
  /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
  {
    path: "*",
    name: "404",
    element: <NotFound />,
  },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
