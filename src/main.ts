import "./styles/style.css";
import { renderProfilesList, renderProfileDetail } from "./pages/profile";
import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { renderPosts } from "./pages/posts";
import { renderSinglePost } from "./pages/singlePost";
import { renderMyProfile } from "./pages/myProfile";

import {
  isAuthenticated,
  getUserName,
  clearAuth,
  emitAuthChanged
} from "./storage/authentication";
import { Router, type Route } from "./router/router";

// Only register the service worker in production to avoid interfering with Vite HMR in dev
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Register our service worker file
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

function renderNav() {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;

  // Render nav state (login/register vs logged-in message)
  const nav = document.getElementById("js-primary-nav");
  if (nav) {
    const loggedIn = isAuthenticated();
    const name = getUserName();
    nav.innerHTML = `
      <a href="/" data-link>Home</a>
  <a href="/profiles" data-link>Profiles</a>
  <a href="/me" data-link>My Profile</a>
      ${
        loggedIn
          ? `<span style=\"margin-left:auto\" class=\"muted\">Logged in as ${
              name ?? "User"
            }</span>
           <button id=\"logout-btn\" class=\"btn btn-secondary\" style=\"margin-left:8px\">Logout</button>`
          : `<span style=\"margin-left:auto\"></span>
           <a href=\"/login\" data-link>Login</a>
           <a href=\"/register\" data-link>Register</a>`
      }
    `;

    document.getElementById("logout-btn")?.addEventListener("click", () => {
      clearAuth();
      emitAuthChanged();
      history.pushState({ path: "/" }, "", "/");
      // Let the router re-resolve the route
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
  }
}

function notFoundView() {
  const outlet = document.getElementById("app-content");
  if (!outlet) return;
  outlet.innerHTML = `<h1>404 - Page Not Found</h1>`;
}

// Define routes using the Router class
const routes: Route[] = [
  {
    path: "/",
    view: () => {
      renderNav();
      // Root now shows the posts feed directly
      renderPosts();
    }
  },
  {
    path: "/posts/:id",
    view: (params) => {
      renderNav();
      renderSinglePost(params?.id!);
    }
  },
  {
    path: "/profiles",
    view: () => {
      renderNav();
      renderProfilesList();
    }
  },
  {
    path: "/profiles/:name",
    view: (params) => {
      renderNav();
      renderProfileDetail(params?.name!);
    }
  },
  {
    path: "/me",
    view: () => {
      renderNav();
      renderMyProfile();
    }
  },
  {
    path: "/login",
    view: () => {
      renderNav();
      renderLogin();
    }
  },
  {
    path: "/register",
    view: () => {
      renderNav();
      renderRegister();
    }
  }
];

const outletEl = document.getElementById("app-content")!;
const router = new Router(routes, outletEl, () => {
  renderNav();
  notFoundView();
});

// Re-render nav on auth changes (router will render page content on navigation events)
window.addEventListener("auth:changed", () => {
  renderNav();
});

// Initial resolution
router.resolve();
