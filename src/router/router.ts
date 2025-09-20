export type Params = Record<string, string>;
export type View = (params?: Params) => void;

export type Route = {
  path: string; // e.g. "/", "/profiles", "/profiles/:name"
  view: View;
};

function matchPath(
  pattern: string,
  pathname: string
): { matched: boolean; params: Params } {
  if (pattern === pathname) return { matched: true, params: {} };

  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length)
    return { matched: false, params: {} };

  const params: Params = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const patternPart = patternSegments[i];
    const pathPart = pathSegments[i];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
}

export class Router {
  private routes: Route[];
  private notFound: View;

  constructor(routes: Route[], _outlet: HTMLElement, notFound: View) {
    this.routes = routes;
    this.notFound = notFound;

    window.addEventListener("popstate", () => this.resolve());
    // Global link hijack
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      const isInternal = href.startsWith("/") && !link.target;
      if (!isInternal) return;
      e.preventDefault();
      this.navigate(href);
    });
  }

  navigate(path: string) {
    history.pushState({ path }, "", path);
    this.resolve();
  }

  resolve() {
    const pathname = window.location.pathname;
    for (const route of this.routes) {
      const { matched, params } = matchPath(route.path, pathname);
      if (matched) {
        route.view(params);
        return;
      }
    }
    this.notFound();
  }
}
