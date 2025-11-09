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

export function normalizeMedia(
  media: any
): { url: string; alt: string } | null {
  if (!media) return null;
  if (typeof media === "string") return { url: media, alt: "media" };
  const url = media?.url as string;
  if (!url) return null;
  return { url, alt: media?.alt || "media" };
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
  // mediaImg is now inlined in the template below
  return `
  <article class="flex flex-col w-full max-w-2xl mx-auto mt-6 sm:mt-10 px-2 sm:px-6 py-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <a href="/" data-link class="text-blue-600 hover:underline mb-2">← Back</a>
      <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">${post.title}</h3>
  ${media ? `<div class='flex justify-center'><img src="${media.url}" alt="${media.alt}" class="w-full max-w-xs sm:max-w-lg rounded-lg my-2"/></div>` : ''}
      <p class="text-gray-800 dark:text-gray-200 mb-4">${post.body}</p>
      <footer class="flex flex-col sm:flex-row justify-evenly items-center border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 gap-2 text-sm text-gray-600 dark:text-gray-300">
        <span class="flex items-center">By ${avatarImg ? `<img src='${avatar}' alt='${name}' class='w-7 h-7 rounded-full mr-2'/>` : ''}<a href="/profiles/${encodeURIComponent(name)}" data-link class="text-blue-600 hover:underline">${name}</a></span>
        <span>Post ID: #${post.id}</span>
        <span>Created at: ${post.created?.slice(0, 10)}</span>
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
