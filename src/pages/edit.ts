import { createHTML } from "../services/utils";
import {
  getPost,
  updatePost,
  type PostModel,
  type UpdatePostBody
} from "../services/postsApi";

const outletId = "app-content";

function editFormHtml(post: PostModel) {
  const mediaUrl =
    (post as any)?.media?.url ||
    (typeof post.media === "string" ? post.media : "") ||
    "";
  const mediaAlt = (post as any)?.media?.alt || "";
  const tagsStr = Array.isArray(post.tags) ? post.tags.join(", ") : "";
  return `
    <section class="edit-post">
      <h1>Edit Post <small>#${post.id}</small></h1>
      <form id="edit-post-form">
        <label>
          <span>Title</span>
          <input name="title" required value="${post.title ?? ""}" />
        </label>
        <label>
          <span>Image URL</span>
          <input name="mediaUrl" value="${mediaUrl}" />
        </label>
        <label>
          <span>Image Alt</span>
          <input name="mediaAlt" value="${mediaAlt}" />
        </label>
        <label>
          <span>Tags (comma separated)</span>
          <input name="tags" value="${tagsStr}" />
        </label>
        <label>
          <span>Body</span>
          <textarea name="body">${post.body ?? ""}</textarea>
        </label>
        <div class="edit-post-actions">
          <button type="submit">Update Post</button>
          <a href="/me" data-link>Cancel</a>
        </div>
      </form>
    </section>
  `;
}

export async function editPostPageDisplay(postId: string) {
  const root = document.getElementById(outletId);
  if (!root) return;
  const idNum = Number(postId);
  if (!Number.isFinite(idNum)) {
    root.innerHTML = `<p class="c-error">Invalid post id.</p>`;
    return;
  }
  root.textContent = "Loading post…";
  try {
    const post = await getPost(idNum, {
      author: true,
      comments: true,
      reactions: true
    });
    const formEl = createHTML(editFormHtml(post));
    if (!formEl) {
      root.innerHTML = `<p class="c-error">Failed to build form.</p>`;
      return;
    }
    root.replaceChildren(formEl);
    const form = root.querySelector(
      "#edit-post-form"
    ) as HTMLFormElement | null;
    form?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const title = String(fd.get("title") || "").trim();
      const mediaUrl = String(fd.get("mediaUrl") || "").trim();
      const mediaAlt = String(fd.get("mediaAlt") || "").trim();
      const tagsStr = String(fd.get("tags") || "").trim();
      const body = String(fd.get("body") || "");
      const payload: UpdatePostBody = {};
      if (title) payload.title = title;
      payload.body = body;
      if (tagsStr) {
        payload.tags = tagsStr
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else {
        payload.tags = [];
      }
      if (mediaUrl) {
        payload.media = { url: mediaUrl, alt: mediaAlt || "Post media" };
      } else {
        payload.media = undefined;
      }
      const submitBtn = form.querySelector(
        "button[type=submit]"
      ) as HTMLButtonElement | null;
      if (submitBtn) submitBtn.disabled = true;
      try {
        await updatePost(idNum, payload);
        history.pushState({ path: "/me" }, "", "/me");
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch (e: any) {
        alert(e?.message || "Failed to update post");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  } catch (e: any) {
    root.innerHTML = `<p class="c-error">${e?.message || "Failed to load post"}</p>`;
  }
}
