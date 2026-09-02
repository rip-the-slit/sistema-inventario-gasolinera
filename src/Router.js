export class RouteConfig {
  constructor(handler, allowRoute) {
    this.handler = handler;
    this.allowRoute = allowRoute;
  }
}

export class Router {
  constructor(routes, authService) {
    this.routes = routes;
    this.currentRoute = null;
    this.authService = authService;

    window.addEventListener("popstate", () => this.handleRoute());
    document.addEventListener("click", (e) => {
      if (e.target.matches("a[data-link]")) {
        e.preventDefault();
        this.navigate(e.target.getAttribute("href"));
      }
    });
  }

  navigate(path) {
    history.pushState({}, "", path);
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname || "/";
    const route = this.routes[path] || this.routes["/404"];

    if (route) {
      if (route.allowRoute(this.authService.getCurrentUser().role)) {
        route.handler()
      } else {
        this.navigate("/")
      }
      this.currentRoute = path
    } else {
      console.error("Ruta no encontrada:", path);
    }
  }

  init() {
    this.handleRoute();
  }
}
