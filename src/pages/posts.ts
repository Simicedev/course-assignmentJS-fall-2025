import {
  listPosts,
  createPost,
  reactToPost,
  commentOnPost,
  deletePost,
  type PostModel,
} from "../services/postsApi";
import { on as onSocket, emit as emitSocket } from "../realtime/socket";

const outletId = "app-content";

export async function renderPosts() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `<p>Loading posts…</p>`;

  const header = document.createElement("div");
  header.innerHTML = `
    <h1>Posts</h1>
    <form id="new-post">
      <input name="title" placeholder="Title" required>
      <input name="media" placeholder="Image URL (optional)">
      <input name="tags" placeholder="tags,comma,separated">
      <textarea name="body" placeholder="Body"></textarea>
      <button type="submit">Create</button>
    </form>
  `;

  const list = document.createElement("div");

  async function refresh() {
    const posts = await listPosts({
      limit: 10,
      include: { author: true, comments: true, reactions: true },
    });
    list.innerHTML = "";
    posts.forEach((post: PostModel) => {
      const item = document.createElement("article");
      item.style.border = "1px solid #ddd";
      item.style.padding = "8px";
      item.style.margin = "8px 0";
      item.innerHTML = `
        <h3>${post.title} <small>#${post.id}</small></h3>
        ${
          post.media
            ? `<img src="${post.media}" alt="media" style="max-width:200px">`
            : ""
        }
        ${post.body ? `<p>${post.body}</p>` : ""}
        <p><small>Comments: ${post._count?.comments ?? 0} · Reactions: ${
        post._count?.reactions ?? 0
      }</small></p>
        <div style="display:flex;gap:6px;align-items:center">
          <button data-react="👍" data-id="${post.id}">👍</button>
          <button data-react="❤️" data-id="${post.id}">❤️</button>
          <form data-comment="${post.id}" style="display:inline-flex;gap:4px">
            <input name="body" placeholder="Comment"> <button>Add</button>
          </form>
          <button data-delete="${post.id}">Delete</button>
        </div>
      `;
      list.append(item);
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

    // wire delete
    list
      .querySelectorAll<HTMLButtonElement>("button[data-delete]")
      .forEach((buttonEl) => {
        buttonEl.addEventListener("click", async () => {
          const postId = Number(buttonEl.dataset.delete);
          await deletePost(postId);
          // Let server broadcast for other clients; locally we refresh immediately
          emitSocket("post:deleted", { id: postId });
          await refresh();
        });
      });

    // wire comments
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
  }

  root.innerHTML = "";
  root.append(header, list);

  const newPost = header.querySelector("#new-post") as HTMLFormElement | null;
  newPost?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(newPost);
    const title = String(formData.get("title") || "");
    const media = String(formData.get("media") || "").trim() || undefined;
    const tagsStr = String(formData.get("tags") || "").trim();
    const tags = tagsStr
      ? tagsStr.split(",").map((tag) => tag.trim())
      : undefined;
    const body = String(formData.get("body") || "");
    await createPost({ title, media, tags, body });
    newPost.reset();
    // Optional: also emit a local signal for other connected tabs against the local server
    emitSocket("post:created", { title, body });
    await refresh();
  });

  await refresh();

  // Real-time updates: refresh when others create/delete
  onSocket("post:created", async () => {
    await refresh();
  });
  onSocket("post:deleted", async () => {
    await refresh();
  });
}
