import { getPost, type PostModel } from "../services/postsApi";
import { createHTML } from "../services/utils";

const appContent = "app-content";

/**
 * Normalize media input for a post
 * @param media - media can be a string URL or an object with url and alt properties
 * @returns {Object} Normalized media object
 * @returns {string} url - The URL of the media
 * @returns {string} alt - The alt text for the media
 * @example
 * const media = normalizeMedia(post.media);
 * console.log(media.url, media.alt);
 */

function normalizeMedia(media: any): { url: string; alt: string } | null {
  if (!media) return { url: "", alt: "" };
  if (typeof media === "string") return { url: media, alt: "media" };
  const url = media?.url as string;
  if (!url) return { url: "", alt: "" };
  return { url, alt: media?.alt };
}

/**
 * Get the author information from a post
 * @param {PostModel} post
 * @returns {Object} Author information
 * @returns {string} name - The name of the author, or "Unknown" if post.author is missing
 * @returns {string} avatar - The URL of the author's avatar
 * @example
 * const author = getAuthor(post);
 * console.log(author.name, author.avatar);
 */

export function getAuthor(post: PostModel) {
  const name = post?.author?.name ?? "Unknown";
  const avatar =
    (post as any)?.author?.avatar?.url || (post as any)?.author?.avatar || "";
  return { name, avatar };
}

/**
 * Generate the HTML element for displaying a single post
 * @param {PostModel} post - Post data
 * @returns {string} HTML string for the post
 * @example
 * const postHtml = singlePostDisplay(post);
 * document.body.innerHTML = postHtml;
 */

function singlePostDisplay(post: PostModel): string {
  const media = normalizeMedia((post as any).media);
  const { name, avatar } = getAuthor(post);
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
  const root = document.getElementById(appContent);
  if (!root) return;
  root.textContent = "Loading post…";

  try {
    const post = await getPost(Number(postId), {
      author: true,
      comments: true,
      reactions: true,
    });
    const el = createHTML(singlePostDisplay(post));
    if (el) {
      root.replaceChildren(el);
    } else {
      root.textContent = "Failed to render post";
    }
  } catch (err: any) {
    const errorEl = createHTML(
      `<p style="color:red">${err?.message ?? "Failed to load post"}</p>`
    );
    if (errorEl) {
      root.replaceChildren(errorEl);
    } else {
      root.textContent = err?.message ?? "Failed to load post";
    }
  }
}
