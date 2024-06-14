import ReactDOM from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import App from "./App.tsx";
import Diff from "./Diff.tsx";
import Playground from "./Playground.tsx";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/app" />,
  },
  {
    path: "/app",
    element: <App />,
  },
  {
    path: "/app/snapshot",
    element: <App snapshot />,
  },
  {
    path: "/app/embed",
    element: <App embedded />,
  },
  {
    path: "/diff",
    element: <Diff />,
  },
  {
    path: "/playground",
    element: <Playground />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
