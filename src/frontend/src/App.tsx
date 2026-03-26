import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ColorSetupModal } from "./components/ColorSetupModal";
import { Layout } from "./components/Layout";
import { useColorTheme } from "./hooks/useColorTheme";
import { AdminPage } from "./pages/AdminPage";
import { DatasetDetailPage } from "./pages/DatasetDetailPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { SubmitPage } from "./pages/SubmitPage";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const datasetDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dataset/$id",
  component: DatasetDetailPage,
});

const submitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/submit",
  component: SubmitPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  datasetDetailRoute,
  submitRoute,
  profileRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

import { Outlet } from "@tanstack/react-router";

export default function App() {
  // Apply saved colors on every load
  useColorTheme();

  return (
    <>
      <RouterProvider router={router} />
      <ColorSetupModal />
    </>
  );
}
