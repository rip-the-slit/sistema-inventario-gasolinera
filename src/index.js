import AuthService from "./services/AuthService";
import { checkRoles, createProxy } from "./createProxy";
import { RouteConfig, Router } from "./Router";
import renderDashboardPage from "./routes/DashboardPage";
import renderLoginPage from "./routes/LoginPage";
import "./index.css";

const rootContainer = document.getElementById("app");

const authService = new AuthService();

const { state: authServiceWrapper } = createProxy(
  authService,
  authService
);

const router = new Router(
  {
    "/404": new RouteConfig(() => console.log("404"), checkRoles([null])),
    "/": new RouteConfig(
      () =>
        renderLoginPage(authServiceWrapper, rootContainer, () =>
          router.navigate("/dashboard")
        ),
      checkRoles([null])
    ),
    "/dashboard": new RouteConfig(
      () => renderDashboardPage(authService.getCurrentUser(), rootContainer, () => router.navigate("/login")),
      checkRoles([null, "employee", "admin"])
    ),
  },
  authService
);

router.init();
