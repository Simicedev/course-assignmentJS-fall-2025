import { getPost, type PostModel } from "../services/postsApi";

const outletId = "app-content";

function normalizeMedia(media: any): { url: string; alt: string } | null {
  if (!media) return { url: "", alt: "" };
  if (typeof media === "string") return { url: media, alt: "media" };
  const url = media?.url as string;
  if (!url) return { url: "", alt: "" };
  return { url, alt: media?.alt };
}

function getAuthor(post: PostModel) {
  const name = post?.author?.name ?? "Unknown";
  const avatar =
    (post as any)?.author?.avatar?.url || (post as any)?.author?.avatar || "";
  return { name, avatar };
}

function singlePostDisplay(post: PostModel): string {
  const media = normalizeMedia((post as any).media);
  const { name, avatar } = getAuthor(post);
  console.log(post);
  const avatarImg = avatar
    ? `<img src="${avatar}" alt="${name}" class="c-singlePost-avatar-img"/>`
    : "";
  return `
    <article class="single-post-container">
      <a href="/" data-link>← Back</a>
      <h3>${post.title}</h3>
      <img src="${media?.url}" alt="${media?.alt}" class="c-singlePost-media"/>
      <p>${post.body}</p>
      <footer class="c-singlePost-footer">
        <small>By ${avatarImg}<a href="/profiles/${encodeURIComponent(
    name
  )}" data-link>${name}</a></small>
        <p>Post ID: #${post.id}</p>
        <p>Created at: ${post.created?.slice(0, 10)}</p>
      </footer>
    </article>
  `;
}

export async function renderSinglePost(postId: string) {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.textContent = "Loading post…";

  try {
    const post = await getPost(Number(postId), {
      author: true,
      comments: true,
      reactions: true,
    });
    root.innerHTML = singlePostDisplay(post);
  } catch (err: any) {
    root.innerHTML = `<p style="color:red">${
      err?.message ?? "Failed to load post"
    }</p>`;
  }
}
