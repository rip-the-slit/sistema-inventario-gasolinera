import AuthService from "./services/AuthService";
import InventoryService from "./services/InventoryService";
import TicketService from "./services/TicketService";
import ReportService from "./services/ReportService";
import { checkRoles, createProxy } from "./createProxy";
import { RouteConfig, Router } from "./Router";
import renderDashboardPage from "./routes/DashboardPage";
import renderLoginPage from "./routes/LoginPage";
import "./index.css";
import renderAssignPage from "./routes/AssignPage";
import renderTicketPage from "./routes/TicketPage";
import renderSupplyPage from "./routes/SupplyPage";

const rootContainer = document.getElementById("app");

const authService = new AuthService();
const inventoryService = new InventoryService();
const ticketService = new TicketService([], inventoryService);
const reportService = new ReportService();

const { state: authServiceWrapper } = createProxy(authService, authService);
const { state: ticketServiceWrapper } = createProxy(ticketService, authService);
const { state: inventoryServiceWrapper } = createProxy(
  inventoryService,
  authService
);
const { state: reportServiceWrapper } = createProxy(reportService, authService);

const router = new Router(
  {
    "/404": new RouteConfig(() => console.log("404"), checkRoles([null])),
    "/": new RouteConfig(
      () =>
        renderLoginPage(authServiceWrapper, rootContainer, () =>
          router.navigate("/dashboard")
        ),
      checkRoles([null, "employee", "admin"])
    ),
    "/dashboard": new RouteConfig(
      () => renderDashboardPage(authService.getCurrentUser(), rootContainer),
      checkRoles([null, "employee", "admin"])
    ),
    "/asignar": new RouteConfig(
      () =>
        renderAssignPage(
          ticketServiceWrapper,
          inventoryService.isSupplied(),
          authService.getCurrentUser(),
          rootContainer,
          (verificationCode) =>
            router.navigate(`/ticket?verificationCode=${verificationCode}`)
        ),
      checkRoles([null, "employee", "admin"])
    ),
    "/ticket": new RouteConfig(
      ({ verificationCode }) =>
        renderTicketPage(
          ticketServiceWrapper,
          reportServiceWrapper,
          rootContainer,
          verificationCode
        ),
      checkRoles([null, "employee", "admin"])
    ),
    "/surtir": new RouteConfig(
      () => renderSupplyPage(inventoryServiceWrapper, rootContainer),
      checkRoles(["employee", "admin"])
    ),
  },
  authService
);

router.init();
