import {
  listPosts,
  createPost,
  reactToPost,
  commentOnPost,
  type PostModel
} from "../services/postsApi";
import { on as onSocket, emit as emitSocket } from "../realtime/socket";
import { isAuthenticated } from "../storage/authentication";
import { createHTML } from "../services/utils";
import { getAuthor } from "./singlePost";

const outletId = "app-content";

// Pagination state (module scope)
let postsPage = 1;
const POSTS_PAGE_SIZE = 10;
let hasNextPage = true; // heuristic; updated after each fetch

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
      </section>
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
  root.textContent = "Loading posts…";

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

  function headerHtml(): string {
    return `
      <section>
        <h1>Posts</h1>
        <form id="new-post">
          <input name="title" placeholder="Title" required>
          <input name="media" placeholder="Image URL (optional)">
          <input name="tags" placeholder="tags,comma,separated">
          <textarea name="body" placeholder="Body"></textarea>
          <button type="submit">Create</button>
        </form>
      </section>
    `;
  }

  const header = createHTML(headerHtml()) as HTMLElement | null;
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

  const newPost = header?.querySelector("#new-post") as HTMLFormElement | null;
  newPost?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(newPost);
    const title = String(formData.get("title") || "");
    const mediaUrl = String(formData.get("media") || "").trim();
    const media = mediaUrl ? { url: mediaUrl, alt: "Post media" } : undefined;
    const tagsStr = String(formData.get("tags") || "").trim();
    const tags = tagsStr
      ? tagsStr.split(",").map((tag) => tag.trim())
      : undefined;
    const body = String(formData.get("body") || "");
    await createPost({ title, media, tags, body });
    newPost.reset();
    // Optional: also emit a local signal for other connected tabs against the local server
    emitSocket("post:created", { title, body });
    // After creating a new post return to first page to show new post
    postsPage = 1;
    await refresh();
  });

  await refresh();
  onSocket("post:created", async () => {
    await refresh();
  });
}
