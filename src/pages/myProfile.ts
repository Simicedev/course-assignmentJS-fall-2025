import {
  getProfile,
  getProfilePosts,
  type Profile,
} from "../services/socialApi";
import {
  createPost,
  updatePost,
  deletePost,
  type PostModel,
} from "../services/postsApi";
import {
  isAuthenticated,
  getUserName,
} from "../storage/authentication";

const outletId = "app-content";

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts: { className?: string; html?: string } = {}
) {
  const el = document.createElement(tag);
  if (opts.className) el.className = opts.className;
  if (opts.html) el.innerHTML = opts.html;
  return el;
}

export async function renderMyProfile() {
  // Guard: must be logged in
  if (!isAuthenticated()) {
    history.pushState({ path: "/login" }, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
    return;
  }

  const username = getUserName();
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `<p>Loading your profile…</p>`;

  try {
    const [profile, postsResult] = await Promise.all([
      getProfile(username!, { posts: false, followers: true, following: true }),
      getProfilePosts(username!, { limit: 50, page: 1 }),
    ]);

    const posts: PostModel[] = Array.isArray(postsResult.data)
      ? (postsResult.data as any)
      : (Array.isArray(postsResult as any) ? (postsResult as any) : []);

    const container = h("section", { className: "my-profile" });
    container.innerHTML = `
      <header style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <img src="${
            profile.banner || "https://placehold.co/800x160"
          }" alt="banner" style="width:100%;max-height:160px;object-fit:cover"/>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-top:-40px;">
          <img src="${
            profile.avatar || "https://placehold.co/96x96"
          }" alt="avatar" width="96" height="96" style="border-radius:50%;border:3px solid #fff;background:#fff"/>
          <div>
            <h1 style="margin:0;">${profile.name}</h1>
            ${profile.bio ? `<p style=\"margin:4px 0\">${profile.bio}</p>` : ""}
            <small>Followers: ${profile._count?.followers ?? 0} · Following: ${
      profile._count?.following ?? 0
    }</small>
          </div>
        </div>
      </header>
      <section style="margin:24px 0;">
        <h2>Create Post</h2>
        <form id="my-new-post" style="display:flex;flex-direction:column;gap:6px;max-width:480px;">
          <input name="title" placeholder="Title" required />
          <input name="media" placeholder="Image URL (optional)" />
          <input name="tags" placeholder="tags,comma,separated" />
          <textarea name="body" placeholder="Body"></textarea>
          <button type="submit">Publish</button>
        </form>
      </section>
      <section>
        <h2>Your Posts</h2>
        <div id="my-posts-list"></div>
      </section>
    `;

    root.innerHTML = "";
    root.append(container);

    const listEl = container.querySelector<HTMLDivElement>("#my-posts-list")!;

    function renderPostsList(list: PostModel[]) {
      listEl.innerHTML = "";
      if (!list.length) {
        listEl.innerHTML = `<p class="muted">You haven't posted yet.</p>`;
        return;
      }
      list.forEach((post) => {
        const article = h("article", { className: "my-post-card" });
        article.style.border = "1px solid #ddd";
        article.style.padding = "8px";
        article.style.margin = "8px 0";
        article.dataset.postId = String(post.id);
        article.innerHTML = `
          <h3 style="margin-top:0">${post.title} <small>#${post.id}</small></h3>
          ${
            post.media
              ? `<img src="${post.media}" alt="media" style="max-width:240px;display:block;margin:4px 0">`
              : ""
          }
          ${post.body ? `<p>${post.body}</p>` : ""}
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
            <button data-action="edit" data-id="${post.id}">Edit</button>
            <button data-action="delete" data-id="${post.id}">Delete</button>
          </div>
        `;
        listEl.append(article);
      });
    }

    renderPostsList(posts);

    // Create post form
    const createForm = container.querySelector<HTMLFormElement>("#my-new-post");
    createForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(createForm);
      const title = String(fd.get("title") || "").trim();
      const body = String(fd.get("body") || "");
      const mediaRaw = String(fd.get("media") || "").trim();
      const tagsRaw = String(fd.get("tags") || "").trim();
      if (!title) return;
      await createPost({
        title,
        body,
        media: mediaRaw || undefined,
        tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()) : undefined,
      });
      createForm.reset();
      // Refresh posts from server after creation
      const updated = await getProfilePosts(username!, { limit: 50, page: 1 });
      const updatedList: PostModel[] = Array.isArray(updated.data)
        ? (updated.data as any)
        : [];
      renderPostsList(updatedList);
    });

    // Event delegation for edit/delete
    listEl.addEventListener("click", async (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("button[data-action]") as
        | HTMLButtonElement
        | null;
      if (!btn) return;
      const action = btn.dataset.action!;
      const id = Number(btn.dataset.id);
      if (action === "delete") {
        if (!confirm("Delete this post?")) return;
        await deletePost(id);
        const updated = await getProfilePosts(username!, { limit: 50, page: 1 });
        const updatedList: PostModel[] = Array.isArray(updated.data)
          ? (updated.data as any)
          : [];
        renderPostsList(updatedList);
      } else if (action === "edit") {
        const article = listEl.querySelector<HTMLElement>(
          `article[data-post-id="${id}"]`
        );
        if (!article) return;
        const originalTitle = article.querySelector("h3")?.childNodes[0]
          .textContent?.trim() || "";
        const originalBody = article.querySelector("p")?.textContent || "";
        // Basic inline edit form
        article.innerHTML = `
          <form data-edit-form style="display:flex;flex-direction:column;gap:6px;">
            <input name="title" value="${originalTitle.replace(/"/g, "&quot;")}" required />
            <textarea name="body">${originalBody.replace(
              /</g,
              "&lt;"
            )}</textarea>
            <div style="display:flex;gap:8px;">
              <button type="submit">Save</button>
              <button type="button" data-cancel>Cancel</button>
            </div>
          </form>
        `;
        const form = article.querySelector<HTMLFormElement>(
          "form[data-edit-form]"
        )!;
        form.addEventListener("submit", async (ev) => {
          ev.preventDefault();
            const fd = new FormData(form);
            const title = String(fd.get("title") || "").trim();
            const body = String(fd.get("body") || "");
            if (!title) return;
            await updatePost(id, { title, body });
            const refreshed = await getProfilePosts(username!, {
              limit: 50,
              page: 1,
            });
            const refreshedList: PostModel[] = Array.isArray(refreshed.data)
              ? (refreshed.data as any)
              : [];
            renderPostsList(refreshedList);
        });
        form.querySelector<HTMLButtonElement>("button[data-cancel]")?.addEventListener(
          "click",
          async () => {
            const refreshed = await getProfilePosts(username!, {
              limit: 50,
              page: 1,
            });
            const refreshedList: PostModel[] = Array.isArray(refreshed.data)
              ? (refreshed.data as any)
              : [];
            renderPostsList(refreshedList);
          }
        );
      }
    });
  } catch (err: any) {
    root.innerHTML = `<p style="color:red">${
      err?.message || "Failed to load your profile"
    }</p>`;
  }
}
