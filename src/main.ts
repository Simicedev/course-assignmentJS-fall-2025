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
import { editPostPageDisplay } from "./pages/edit";

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
    <nav class="c-navbar">
      <ul class="c-nav-menu" id="js-nav-menu">
          <li role="link" aria-current="page" class="c-nav-item"><a href="/" data-link>Home</a></li>
          <li role="link" aria-current="page" class="c-nav-item"><a href="/profiles" data-link>Profiles</a></li>
          <li role="link" aria-current="page" class="c-nav-item"><a href="/me" data-link>My Profile</a></li>
      </ul>

      <div class="c-nav-right">
          <div class="flex gap-2 items-center">
            ${
              loggedIn
                ? `<span class="muted flex items-center gap-1">Logged in as <span class="font-bold text-white"> ${name ?? "User"}</span></span>
                    <button id=\"logout-btn\" class=\"bg-red-500 text-white rounded px-3 py-2 font-semibold cursor-pointer hover:opacity-100 opacity-70\">Logout</button>`
                : `<span class="flex items-center"></span>
                    <a href=\"/login\" data-link>LogIn</a>
                    <a href=\"/register\" data-link>Register</a>`
            }
          </div>
          <div class="c-nav-toggle">
            <div class="c-hamburger" id="js-hamburger">
              <span class="c-bar"></span>
              <span class="c-bar"></span>
              <span class="c-bar"></span>
            </div>
          </div>
        </div>
    </nav>
    `;

    const hamburgerEl = document.querySelector("#js-hamburger");
    const navMenuEl = document.querySelector("#js-nav-menu");

    if (hamburgerEl && navMenuEl) {
      hamburgerEl.addEventListener("click", () => {
        hamburgerEl.classList.toggle("active");
        navMenuEl.classList.toggle("active");
      });

      document.querySelectorAll(".c-nav-link").forEach((n) =>
        n.addEventListener("click", () => {
          hamburgerEl.classList.remove("active");
          navMenuEl.classList.remove("active");
        })
      );
    }

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
  },
  {
    path: "/edit/:id",
    view: (params) => {
      renderNav();
      editPostPageDisplay(params?.id!);
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
