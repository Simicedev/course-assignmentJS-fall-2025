import {
  listPosts,
  reactToPost,
  commentOnPost,
  type PostModel
} from "../services/postsApi";
import { isAuthenticated } from "../storage/authentication";
import { createHTML } from "../services/utils";
import { getAuthor } from "./singlePost";

const outletId = "app-content";

// Pagination state (module scope)
let postsPage = 1;
const POSTS_PAGE_SIZE = 12;
let hasNextPage = true; // heuristic
// Search state
let searchQuery = "";
let searchInFlight = 0; // increment to invalidate stale responses
let searchDebounce: number | null = null;
const SEARCH_PAGE_LIMIT = 25; // server page size for streaming search
const SEARCH_MAX_PAGES = 40; // safety cap
let searchPage = 1;
let accumulatedPosts: PostModel[] = [];

// Generic pagination control builder (exported for reuse in other pages)
export function createPaginationControls(options: {
  page: number;
  hasNext: boolean;
  hasPrev?: boolean; // auto derived if omitted (page > 1)
  onPrev: () => Promise<void> | void;
  onNext: () => Promise<void> | void;
  label?: string; // aria-label override
}): HTMLElement {
  const { page, hasNext, onPrev, onNext, label } = options;
  const hasPrev = options.hasPrev ?? page > 1;
  const nav = document.createElement("section");
  nav.className = "c-pagination";
  nav.setAttribute("aria-label", label || "Pagination");
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Prev";
  prevBtn.className = "c-pagination-btn";
  prevBtn.disabled = !hasPrev;
  prevBtn.addEventListener("click", async () => {
    if (prevBtn.disabled) return;
    await onPrev();
  });
  const status = document.createElement("span");
  status.className = "c-pagination-status";
  status.textContent = `Page ${page}`;
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.className = "c-pagination-btn";
  nextBtn.disabled = !hasNext;
  nextBtn.addEventListener("click", async () => {
    if (nextBtn.disabled) return;
    await onNext();
  });
  nav.append(prevBtn, status, nextBtn);
  return nav;
}

function renderPaginationControls(
  container: HTMLElement,
  rerender: () => Promise<void>
) {
  container.innerHTML = "";
  const nav = createPaginationControls({
    page: postsPage,
    hasNext: hasNextPage,
    onPrev: async () => {
      if (postsPage === 1) return;
      postsPage -= 1;
      await rerender();
    },
    onNext: async () => {
      if (!hasNextPage) return;
      postsPage += 1;
      await rerender();
    },
    label: "Posts pagination"
  });
  container.appendChild(nav);
}

export async function renderPosts() {
  const root = document.getElementById(outletId);
  if (!root) return;
  if (!isAuthenticated()) {
    const guestEl = createHTML(`
      <section>
        <h1>Posts</h1>
        <p class="muted">You must be logged in to view and create posts.</p>
        <p><a href="/login" data-link>Go to Login</a> or <a href="/register" data-link>Create an account</a>.</p>
    `);
    if (guestEl) root.replaceChildren(guestEl);
    else root.textContent = "You must be logged in to view and create posts.";

    const onAuth = async () => {
      window.removeEventListener("auth:changed", onAuth);
      await renderPosts();
    };
    window.addEventListener("auth:changed", onAuth);
    return;
  }
  function normalizeMedia(media: any): { url: string; alt: string } | null {
    if (!media) return null;
    if (typeof media === "string") return { url: media, alt: "media" };
    const url = media?.url ?? "";
    if (!url) return null;
    return { url, alt: media?.alt ?? "media" };
  }

  function postCardHtml(post: PostModel): string {
    const media = normalizeMedia((post as any).media);
    const comments = post._count?.comments ?? 0;
    const reactions = post._count?.reactions ?? 0;
    const { name, avatar } = getAuthor(post);
    const avatarImg = avatar
      ? `<img src="${avatar}" alt="${name}" class="c-singlePost-avatar-img"/>`
      : "";
    return `
      <div class="c-posts-card" ">
        <div>
          <a href="/profiles/${encodeURIComponent(
            name
          )}" data-link>${avatarImg} ${name}</a>
          <h3><a href="/posts/${post.id}" data-link>${post.title}</a>
          <small>#${post.id}</small></h3>
        </div>
        <div class="c-posts-media">
        ${
          media
            ? `<img src="${media.url}" alt="${media.alt}" class="c-posts-img"/>`
            : ""
        }
        </div>
        <div class="c-posts-body">
        ${post.body ? `<p>${post.body}</p>` : ""}
        </div>

        <div class="c-posts-meta">
          <div>
            <p> <small>Reactions: ${reactions}</small></p>
            <p class="c-posts-meta-info"><small>Comments: ${comments} </small></p>
          </div>
          <div class="c-posts-reactions">
            <button data-react="👍" data-id="${post.id}">👍</button>
            <button data-react="❤️" data-id="${post.id}">❤️</button>
          </div>
        </div>
        <div class="c-posts-actions">
          
          <form data-comment="${post.id}" style="display:inline-flex;gap:4px">
            <input name="body" placeholder="Comment"> <button>Add</button>
          </form>
          
        </div>
      </div>
    `;
  }

  function searchBarHtml(): string {
    return `
      <section class="c-posts-search-header">
        <h1>Posts</h1>
        <div class="c-posts-search-bar" id="posts-search-bar">
          <label for="posts-search-input">Search posts:</label>
          <input id="posts-search-input" type="text" placeholder="Type to search posts…" />
          <button type="button" id="posts-search-clear" hidden>Clear</button>
        </div>
        <div id="posts-search-status" class="c-posts-search-status" aria-live="polite"></div>
      </section>`;
  }

  const header = createHTML(searchBarHtml()) as HTMLElement | null;
  const list = document.createElement("div");
  list.className = "c-posts-container";
  const paginationMount = document.createElement("div");
  paginationMount.id = "posts-pagination";

  async function refresh() {
    const posts = await listPosts({
      page: postsPage,
      limit: POSTS_PAGE_SIZE,
      include: { author: true, comments: true, reactions: true }
    });
    hasNextPage = posts.length === POSTS_PAGE_SIZE; // heuristic
    list.replaceChildren();
    posts.forEach((post: PostModel) => {
      const item = createHTML(postCardHtml(post)) as HTMLElement | null;
      if (!item) return;
      list.append(item);

      item.addEventListener("click", (ev) => {
        const target = ev.target as HTMLElement;
        if (target.closest("button, form, input, textarea, a")) return;
        const href = `/posts/${post.id}`;
        history.pushState({ path: href }, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
    });

    // wire reactions
    list
      .querySelectorAll<HTMLButtonElement>("button[data-react]")
      .forEach((buttonEl) => {
        buttonEl.addEventListener("click", async () => {
          const postId = Number(buttonEl.dataset.id);
          const symbol = buttonEl.dataset.react!;
          await reactToPost(postId, symbol);
          await refresh();
        });
      });

    list
      .querySelectorAll<HTMLFormElement>("form[data-comment]")
      .forEach((commentForm) => {
        commentForm.addEventListener("submit", async (event) => {
          event.preventDefault();
          const postId = Number(commentForm.dataset.comment);
          const formData = new FormData(commentForm);
          const body = String(formData.get("body") || "");
          if (!body) return;
          await commentOnPost(postId, { body });
          await refresh();
        });
      });

    renderPaginationControls(paginationMount, refresh);
  }

  root.replaceChildren();
  if (header) root.append(header);
  root.append(list, paginationMount);

  // Streaming search logic
  function resetStreaming() {
    searchPage = 1;
    accumulatedPosts = [];
  }

  async function runStreamingSearch() {
    const q = searchQuery.trim();
    if (!q) {
      // fallback to paginated default list
      postsPage = 1;
      await refresh();
      return; // ensure we stop streaming logic when query cleared
    }
    const listEl = list;
    const statusEl = document.getElementById("posts-search-status");
    const thisSearch = ++searchInFlight;
    resetStreaming();
    listEl.replaceChildren(createHTML(`<p class='c-loading'>Searching…</p>`)!);
    statusEl && (statusEl.textContent = "Searching titles…");
    const qLower = q.toLowerCase();
    while (searchPage <= SEARCH_MAX_PAGES) {
      if (thisSearch !== searchInFlight) return; // aborted by new query
      let batch: PostModel[] = [];
      try {
        batch = await listPosts({
          page: searchPage,
          limit: SEARCH_PAGE_LIMIT,
          include: { author: true, comments: true, reactions: true }
        });
      } catch (e: any) {
        if (thisSearch !== searchInFlight) return;
        listEl.replaceChildren(
          createHTML(
            `<p class='c-error'>Search failed: ${e?.message || "Unknown error"}</p>`
          )!
        );
        statusEl && (statusEl.textContent = "");
        return;
      }
      if (thisSearch !== searchInFlight) return;
      if (searchPage === 1) listEl.replaceChildren();
      if (!batch.length) {
        // no more pages to scan
        if (!accumulatedPosts.length) {
          listEl.replaceChildren(
            createHTML(
              `<p class='c-empty'>No matching titles for \"${q.split("<").join("&lt;")}\"</p>`
            )!
          );
          statusEl && (statusEl.textContent = "");
        } else {
          statusEl &&
            (statusEl.textContent = `Found ${accumulatedPosts.length} title match${accumulatedPosts.length === 1 ? "" : "es"}`);
        }
        return;
      }
      const matched = batch.filter((p) =>
        (p.title || "").toLowerCase().includes(qLower)
      );
      if (matched.length) {
        accumulatedPosts.push(...matched);
      }
      // Append only matched posts
      const frag = document.createDocumentFragment();
      matched.forEach((p) => {
        const item = createHTML(postCardHtml(p));
        if (item) frag.appendChild(item);
      });
      if (frag.childNodes.length) listEl.appendChild(frag);
      // Wire newly added reactions & comments for the batch only
      // (Re)wire reactions for all current cards (cheap; could be optimized to just new nodes)
      listEl
        .querySelectorAll<HTMLButtonElement>("button[data-react]")
        .forEach((btn) => {
          btn.onclick = async () => {
            const postId = Number(btn.dataset.id);
            const symbol = btn.dataset.react!;
            await reactToPost(postId, symbol);
            if (searchQuery.trim()) {
              runStreamingSearch(); // restart to refresh counts
            } else {
              await refresh();
            }
          };
        });
      // (Re)wire comment forms
      listEl
        .querySelectorAll<HTMLFormElement>("form[data-comment]")
        .forEach((frm) => {
          frm.onsubmit = async (ev) => {
            ev.preventDefault();
            const postId = Number(frm.dataset.comment);
            const formData = new FormData(frm);
            const body = String(formData.get("body") || "");
            if (!body) return;
            await commentOnPost(postId, { body });
            if (searchQuery.trim()) runStreamingSearch();
            else refresh();
          };
        });
      const moreComing = batch.length === SEARCH_PAGE_LIMIT;
      if (moreComing) {
        statusEl &&
          (statusEl.textContent = `Found ${accumulatedPosts.length} match${accumulatedPosts.length === 1 ? "" : "es"}… (scanning more)`);
      } else {
        if (!accumulatedPosts.length) {
          listEl.replaceChildren(
            createHTML(
              `<p class='c-empty'>No matching titles for \"${q.split("<").join("&lt;")}\"</p>`
            )!
          );
          statusEl && (statusEl.textContent = "");
        } else {
          statusEl &&
            (statusEl.textContent = `Found ${accumulatedPosts.length} title match${accumulatedPosts.length === 1 ? "" : "es"}`);
        }
        return;
      }
      searchPage += 1;
      await new Promise((r) => setTimeout(r, 20));
    }
    const statusEl2 = document.getElementById("posts-search-status");
    if (!accumulatedPosts.length) {
      listEl.replaceChildren(
        createHTML(
          `<p class='c-empty'>No matching titles for \"${q.split("<").join("&lt;")}\"</p>`
        )!
      );
      statusEl2 && (statusEl2.textContent = "");
    } else {
      statusEl2 &&
        (statusEl2.textContent = `Showing first ${accumulatedPosts.length} title match${accumulatedPosts.length === 1 ? "" : "es"} (cap reached)`);
    }
  }

  function scheduleStreamingSearch() {
    if (searchDebounce) window.clearTimeout(searchDebounce);
    searchDebounce = window.setTimeout(() => runStreamingSearch(), 250);
  }

  // Wire search inputs
  const searchInput = header?.querySelector(
    "#posts-search-input"
  ) as HTMLInputElement | null;
  const clearBtn = header?.querySelector(
    "#posts-search-clear"
  ) as HTMLButtonElement | null;
  const statusText = header?.querySelector(
    "#posts-search-status"
  ) as HTMLElement | null;
  statusText && (statusText.textContent = "Type to search posts…");

  searchInput?.addEventListener("input", () => {
    if (!searchInput) return;
    const val = searchInput.value;
    clearBtn && (clearBtn.hidden = val.length === 0);
    searchQuery = val;
    if (!val.trim()) {
      searchInFlight++; // cancel active search
      statusText && (statusText.textContent = "");
      postsPage = 1;
      refresh();
      return;
    }
    scheduleStreamingSearch();
  });

  clearBtn?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    searchQuery = "";
    clearBtn.hidden = true;
    searchInFlight++; // cancel
    statusText && (statusText.textContent = "");
    postsPage = 1;
    refresh();
    searchInput.focus();
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (searchInput.value) {
        searchInput.value = "";
        searchQuery = "";
        clearBtn && (clearBtn.hidden = true);
        searchInFlight++;
        statusText && (statusText.textContent = "");
        postsPage = 1;
        refresh();
      } else searchInput.blur();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      // immediate search
      searchInFlight++; // invalidate prior
      searchQuery = searchInput.value.trim();
      runStreamingSearch();
    }
  });

  await refresh();
}
