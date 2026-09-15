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

    window.addEventListener("hashchange", () => this.handleRoute());
    document.addEventListener("click", (e) => {
      const closestLink = e.target.closest("a[data-link]")
      if (closestLink) {
        e.preventDefault();
        this.navigate(closestLink.getAttribute("href"));
      }
    });
  }

  navigate(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    if (window.location.hash === `#${normalizedPath}`) {
      this.handleRoute();
      return;
    }

    window.location.hash = normalizedPath;
  }

  handleRoute() {
    const hashPath = window.location.hash.slice(1) || "/";
    const url = new URL(hashPath, window.location.origin);
    const path = url.pathname || "/";
    const params = Object.fromEntries(url.searchParams.entries());
    const route = this.routes[path] || this.routes["/404"];
    const userRole = this.authService.getCurrentUser()?.role ?? null;

    if (route) {
      if (route.allowRoute(userRole)) {
        route.handler(params);
      } else {
        const fallbackPath = userRole === null ? "/" : "/dashboard";
        if (path !== fallbackPath) this.navigate(fallbackPath);
      }
      this.currentRoute = path;
    } else {
      console.error("Ruta no encontrada:", path);
    }
  }

  init() {
    this.handleRoute();
  }
}
