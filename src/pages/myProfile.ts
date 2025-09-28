import { createHTML } from "../services/utils";
import { isAuthenticated, getUserName } from "../storage/authentication";
import {
  getProfile,
  getProfilePosts,
  type Profile
} from "../services/socialApi";
import { createPost, deletePost, type PostModel } from "../services/postsApi";

const outletId = "app-content";

function normalizeMedia(media: any): { url: string; alt: string } | null {
  if (!media) return null;
  if (typeof media === "string") return { url: media, alt: "media" };
  const url = media?.url ?? "";
  if (!url) return null;
  return { url, alt: media?.alt ?? "media" };
}

function headerHtml(profile: Profile) {
  const avatar =
    (profile as any)?.avatar?.url ||
    (profile as any)?.avatar ||
    "https://placehold.co/96x96";
  const banner =
    (profile as any)?.banner?.url ||
    (profile as any)?.banner ||
    "https://placehold.co/800x200";
  return `
    <header class="my-profile-header">
      <img src="${banner}" alt="banner" class="my-profile-banner"/>
      <div class="my-profile-header-info">
        <img src="${avatar}" alt="${
          profile.name
        }" width="96" height="96" class="my-profile-avatar"/>
        <div>
          <h2>${profile.name}</h2>
          ${profile.bio ? `<p>${profile.bio}</p>` : ""}
          <small>
            Posts: ${profile._count?.posts ?? 0} · Followers: ${
              profile._count?.followers ?? 0
            } · Following: ${profile._count?.following ?? 0}
          </small>
        </div>
      </div>
    </header>
  `;
}

function composerHtml() {
  return `
    <section class="my-profile-composer">
      <h3>Create a new post</h3>
      <form id="my-post-new">
        <input name="title" placeholder="Title" required>
        <input name="media" placeholder="Image URL (optional)">
        <input name="tags" placeholder="tags,comma,separated">
        <textarea name="body" placeholder="Body"></textarea>
        <button type="submit">Create</button>
      </form>
    </section>
  `;
}

function postCardHtml(post: PostModel) {
  const media = normalizeMedia((post as any).media);
  return `
    <article class="c-posts-card" data-post="${post.id}">
      <div>
        <h3>${post.title} <small>#${post.id}</small></h3>
      </div>
      <div class="c-posts-media">
        ${
          media
            ? `<img src="${media.url}" alt="${media.alt}" class="c-posts-img"/>`
            : ""
        }
      </div>
      <div class="c-posts-body">${post.body ? `<p>${post.body}</p>` : ""}</div>
      <div class="c-posts-actions">
        <button data-delete="${post.id}">Delete</button>
        <a href="/edit/${post.id}" data-link><button data-edit="${post.id}">Edit</button></a>
      </div>
    </article>
  `;
}

export async function renderMyProfile() {
  const root = document.getElementById(outletId);
  if (!root) return;

  if (!isAuthenticated()) {
    const el = createHTML(`
      <section>
        <h1>My Profile</h1>
        <p class="muted">You must be logged in to view this page.</p>
        <p><a href="/login" data-link>Go to Login</a></p>
      </section>
    `);
    if (el) root.replaceChildren(el);
    else root.textContent = "You must be logged in to view this page.";
    return;
  }

  const name = getUserName();
  if (!name) {
    root.textContent = "Missing user info. Please login again.";
    return;
  }

  root.textContent = "Loading your profile…";
  try {
    const [profile, posts] = await Promise.all([
      getProfile(name, { posts: true, followers: true, following: true }),
      getProfilePosts(name, { limit: 20, page: 1 })
    ]);

    const container = document.createElement("section");
    container.className = "my-profile";

    const header = createHTML(headerHtml(profile));
    const composer = createHTML(composerHtml());
    const list = document.createElement("div");
    list.className = "my-profile-posts c-posts-container";
    posts.forEach((p: any) => {
      const item = createHTML(postCardHtml(p as PostModel));
      if (item) list.appendChild(item);
    });

    container.append(
      ...(header ? [header] : []),
      ...(composer ? [composer] : []),
      list
    );
    root.replaceChildren(container);

    // Create handler
    const form = container.querySelector(
      "#my-post-new"
    ) as HTMLFormElement | null;
    form?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const title = String(fd.get("title") || "").trim();
      if (!title) return;
      const mediaUrl = String(fd.get("media") || "").trim();
      const media = mediaUrl ? { url: mediaUrl, alt: "Post media" } : undefined;
      const tagsStr = String(fd.get("tags") || "").trim();
      const tags = tagsStr
        ? tagsStr
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;
      const body = String(fd.get("body") || "");
      const submitBtn = form.querySelector(
        "button[type=submit]"
      ) as HTMLButtonElement | null;
      if (submitBtn) submitBtn.disabled = true;
      try {
        await createPost({ title, media, tags, body });
        form.reset();
        await renderMyProfile();
      } catch (e: any) {
        alert(e?.message || "Failed to create post");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    // Delete handlers
    container
      .querySelectorAll<HTMLButtonElement>("button[data-delete]")
      .forEach((btn) => {
        btn.addEventListener("click", async () => {
          const postId = Number(btn.dataset.delete);
          if (!postId) return;
          btn.disabled = true;
          try {
            await deletePost(postId);
            await renderMyProfile();
          } catch (e: any) {
            alert(e?.message || "Failed to delete post");
          } finally {
            btn.disabled = false;
          }
        });
      });
  } catch (e: any) {
    root.innerHTML = `<p style="color:red">${
      e?.message || "Failed to load profile"
    }</p>`;
  }
}
