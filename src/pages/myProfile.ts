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
    <section class="flex flex-col gap-1">
      <img src="${banner}" alt="banner" class="w-full max-h-48 object-cover block rounded-t-2xl"/>
      <div class="flex items-center gap-4 text-white text-shadow-2xs">
        <img src="${avatar}" alt="${
          profile.name
        }" width="96px" height="96px" class="max-w-24 h-24 rounded-full border-3 shadow-xs border-white object-cover"/>
        <div class="flex flex-col">
          <h2 class="text-lg font-bold">${profile.name}</h2>
          ${profile.bio ? `<p>${profile.bio}</p>` : ""}
          <small>
            Posts: ${profile._count?.posts ?? 0} · Followers: ${
              profile._count?.followers ?? 0
            } · Following: ${profile._count?.following ?? 0}
          </small>
        </div>
      </div>
    </section>
  `;
}

function composerHtml() {
  return `
    <section class="flex flex-col justify-center items-center mx-auto">
      <h3 class="text-lg font-bold">Create a new post</h3>
      <form id="my-post-new" class="flex flex-col gap-2 w-full max-w-2xl mx-auto  bg-(--panel) backdrop-blur-md border border-blue-500 p-6 rounded-2xl shadow-md text-white" id="login-form">
        <input class="p-2 rounded border border-gray-300" type="text" name="title" placeholder="Title" required>
        <input class="p-2 rounded border border-gray-300" type="url" name="media" placeholder="Image URL (optional)">
        <input class="p-2 rounded border border-gray-300" type="text" name="tags" placeholder="tags,comma,separated">
        <textarea class="p-2 rounded border border-gray-300 min-h-48" name="body" type="text" placeholder="Body"></textarea>
        <div class="flex justify-center items-center w-full">
          <button class="bg-blue-500 text-white flex rounded px-3 py-2 font-semibold cursor-pointer hover:opacity-100 min-w-4/12 opacity-70 justify-center" type="submit">Create</button>
        </div>
      </form>
    </section>
  `;
}

function postCardHtml(post: PostModel) {
  const media = normalizeMedia((post as any).media);
  return `
    <article class="flex flex-col max-w-[400px] gap-2 p-3 border rounded-2xl border-gray-100" data-post="${post.id}">
      <div>
        <h3>
          <a href="/posts/${post.id}" data-link>${post.title}</a>
          <small>#${post.id}</small>
        </h3>
      </div>
      <div class="flex justify-center items-center w-full">
        ${
          media
            ? `<img src="${media.url}" alt="${media.alt}" class="flex w-full object-cover"/>`
            : ""
        }
      </div>
      <div class="flex gap-2 justify-center items-center flex-wrap">${post.body ? `<p>${post.body}</p>` : ""}</div>
      <div class="flex gap-2 justify-center items-center flex-wrap">
        <button data-delete="${post.id}" class="bg-red-500 text-white rounded px-3 py-2 font-semibold cursor-pointer hover:opacity-100 opacity-80">Delete</button>
        <a href="/edit/${post.id}" data-link><button data-edit="${post.id}" class="bg-blue-500 text-white rounded px-3 py-2 font-semibold cursor-pointer hover:opacity-100 opacity-70">Edit</button></a>
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
    list.className = "c-posts-container";
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
