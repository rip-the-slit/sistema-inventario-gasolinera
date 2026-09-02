import AuthService from "./AuthService";
import { checkRoles, createProxy } from "./createProxy";
import { RouteConfig, Router } from "./Router";
import renderLoginPage from "./routes/LoginPage";

const authService = new AuthService();

const { status: authServiceWrapper, subscribe: subscribeToAuth } = createProxy(
  authService,
  authService
);

const router = new Router(
  {
    "/404": new RouteConfig(() => console.log("404"), checkRoles([null])),
    "/": new RouteConfig(
      () => renderLoginPage(authServiceWrapper, subscribeToAuth),
      checkRoles([null])
    ),
  },
  authService
);
