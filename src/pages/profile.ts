import {
  getProfile,
  follow,
  unfollow,
  fetchAllProfiles,
  type Profile
} from "../services/socialApi";
import { getProfilePosts } from "../services/socialApi";
import { createHTML } from "../services/utils";
import { isAuthenticated, getUserName } from "../storage/authentication";
import { normalizeMedia } from "./singlePost";
import { createPaginationControls } from "./posts";

const rootId = "app-content";
let profilePostsPage = 1;
const PROFILE_POSTS_PAGE_SIZE = 10;

function profileCardHtml(profile: Profile): string {
  const selfName = getUserName();
  const avatarMedia = normalizeMedia((profile as any).avatar) || {
    url: "https://placehold.co/96x96",
    alt: profile.name
  };
  const bannerMedia = normalizeMedia((profile as any).banner) || {
    url: "https://placehold.co/400x120",
    alt: "banner"
  };
  const isSelf = !!selfName && selfName === profile.name;
  const href = isSelf ? "/me" : `/profiles/${encodeURIComponent(profile.name)}`;
  return `
    <article class="c-profile-card" data-name="${encodeURIComponent(
      profile.name
    )}">
      <a class="c-profile-card-link" href="${href}" data-link aria-label="View profile ${
        isSelf ? "your profile" : profile.name
      }">
        <div class="c-profile-card-banner-wrap">
          <img class="c-profile-card-banner" src="${bannerMedia.url}" alt="${bannerMedia.alt}" />
        </div>
        <div class="c-profile-card-body">
          <img class="c-profile-card-avatar" src="${avatarMedia.url}" alt="${avatarMedia.alt}" width="72" height="72"/>
          <h3 class="c-profile-card-name">${profile.name}</h3>
        </div>
      </a>
    </article>
  `;
}

function profilesContainerHtml(): string {
  return `<div class="c-profiles-grid" role="list"></div>`;
}

function loadingHtml(message: string): string {
  return `<p class="c-loading">${message}</p>`;
}

function errorHtml(message: string): string {
  return `<p class="c-error" role="alert">${message}</p>`;
}

function detailHtml(profile: Profile, opts: { isSelf?: boolean } = {}): string {
  const bannerMedia = normalizeMedia((profile as any).banner) || {
    url: "https://placehold.co/800x200",
    alt: "banner"
  };
  const avatarMedia = normalizeMedia((profile as any).avatar) || {
    url: "https://placehold.co/96x96",
    alt: profile.name
  };
  const bioHtml = profile.bio
    ? `<p class=\"c-profile-detail-bio\">${profile.bio}</p>`
    : "";
  const isSelf = !!opts.isSelf;
  return `
    <section class="c-profile-detail">
      <header class="c-profile-detail-header">
        <img class="c-profile-detail-banner" src="${bannerMedia.url}" alt="${bannerMedia.alt}"/>
        <div class="c-profile-detail-identity">
          <img class="c-profile-detail-avatar" src="${avatarMedia.url}" alt="${avatarMedia.alt}" width="96" height="96"/>
          <div class="c-profile-detail-meta">
            <h2 class="c-profile-detail-name">${profile.name}</h2>
            ${bioHtml}
            <small class="c-profile-detail-stats">Followers: ${
              profile._count?.followers ?? 0
            } · Following: ${profile._count?.following ?? 0}</small>
          </div>
        </div>
      </header>

      ${
        isSelf
          ? `<div class="c-profile-detail-actions"><p class="c-profile-detail-self-note">This is you.</p></div>`
          : `<div class="c-profile-detail-actions">
        <button class="c-btn" id="btn-follow">Follow</button>
        <button class="c-btn" id="btn-unfollow">Unfollow</button>
      </div>`
      }
    </section>
  `;
}

function usersPostsCard(post: any): string {
  const media = normalizeMedia((post as any).media);
  const mediaHtml = media
    ? `<div class="c-profile-post-media"><img src="${media.url}" alt="${media.alt}" /></div>`
    : "";
  return `
    <article class="c-posts-card" data-post="${post.id}">
      <header class="c-posts-card-header">
        <h3 class="c-profile-post-title"><a href="/posts/${post.id}" data-link>${
          post.title || "(untitled)"
        }</a> <small>#${post.id}</small></h3>
      </header>
      ${mediaHtml}
      <div class="c-profile-post-body">${
        post.body ? `<p>${post.body}</p>` : ""
      }</div>
    </article>
  `;
}

function postsOtherUsersSection(): string {
  return `<section class="c-profile-posts" id="profile-posts">
    <h3 class="c-profile-posts-heading">Posts:</h3>
    <div class="c-profile-posts-list" id="profile-posts-list"></div>
  </section>`;
}

async function loadProfilePosts(
  name: string,
  listEl: HTMLElement,
  paginationEl: HTMLElement
) {
  const posts = await getProfilePosts(name, {
    limit: PROFILE_POSTS_PAGE_SIZE,
    page: profilePostsPage
  });
  listEl.replaceChildren();
  posts.forEach((p: any) => {
    const el = buildNode(usersPostsCard(p));
    if (el) listEl.appendChild(el);
  });
  const hasNext = posts.length === PROFILE_POSTS_PAGE_SIZE; // heuristic
  const controls = createPaginationControls({
    page: profilePostsPage,
    hasNext,
    onPrev: async () => {
      if (profilePostsPage === 1) return;
      profilePostsPage -= 1;
      await loadProfilePosts(name, listEl, paginationEl);
    },
    onNext: async () => {
      if (!hasNext) return;
      profilePostsPage += 1;
      await loadProfilePosts(name, listEl, paginationEl);
    },
    label: "Profile posts pagination"
  });
  paginationEl.replaceChildren(controls);
}

// --- DOM builders ---
function buildNode(html: string): HTMLElement | null {
  return createHTML(html);
}

function buildProfilesGrid(profiles: Profile[]): HTMLElement {
  const container = buildNode(profilesContainerHtml())!;
  const frag = document.createDocumentFragment();
  profiles.forEach((p) => {
    const card = buildNode(profileCardHtml(p));
    if (card) frag.append(card);
  });
  container.append(frag);
  return container;
}

export async function renderProfilesList() {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.replaceChildren(buildNode(loadingHtml("Loading profiles…"))!);
  try {
    const data = await fetchAllProfiles({ pageSize: 100, maxPages: 4 });
    const grid = buildProfilesGrid(data);
    root.replaceChildren(grid);
  } catch (error: any) {
    root.replaceChildren(
      buildNode(errorHtml(error?.message || "Failed to load profiles"))!
    );
  }
}

export async function renderProfileDetail(name: string) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.replaceChildren(buildNode(loadingHtml("Loading profile…"))!);
  try {
    const selfNameEarly = getUserName();
    if (selfNameEarly && selfNameEarly === name) {
      // Redirect to /me route for canonical self profile view
      history.pushState({ path: "/me" }, "", "/me");
      window.dispatchEvent(new PopStateEvent("popstate"));
      return;
    }
    const profile = await getProfile(name, {
      followers: true,
      following: true,
      posts: false
    });
    const selfName = getUserName();
    const section = buildNode(
      detailHtml(profile, { isSelf: !!selfName && selfName === profile.name })
    );
    if (!section) throw new Error("Failed to build profile detail");
    const children: HTMLElement[] = [section];
    if (!selfName || selfName !== profile.name) {
      const postsWrapper = buildNode(postsOtherUsersSection());
      if (postsWrapper) {
        const listEl = postsWrapper.querySelector(
          "#profile-posts-list"
        ) as HTMLElement | null;
        const paginationEl = document.createElement("div");
        paginationEl.className = "c-profile-posts-pagination-mount";
        postsWrapper.appendChild(paginationEl);
        profilePostsPage = 1; // reset when viewing a profile
        if (listEl) await loadProfilePosts(name, listEl, paginationEl);
        children.push(postsWrapper as HTMLElement);
      }
    }
    root.replaceChildren(...children);

    // Wire follow/unfollow only if not self
    if (!selfName || selfName !== profile.name) {
      const followBtn = document.getElementById("btn-follow");
      const unfollowBtn = document.getElementById("btn-unfollow");
      followBtn?.addEventListener("click", async () => {
        await follow(name);
        alert(`Followed ${name}`);
      });
      unfollowBtn?.addEventListener("click", async () => {
        await unfollow(name);
        alert(`Unfollowed ${name}`);
      });
    }
  } catch (error: any) {
    root.replaceChildren(
      buildNode(errorHtml(error?.message || "Failed to load profile"))!
    );
  }
}

// Convenience: render the currently authenticated user's profile using this module's layout.
export async function renderCurrentUserProfile() {
  const name = getUserName();
  const root = document.getElementById(rootId);
  if (!root) return;
  if (!isAuthenticated() || !name) {
    root.replaceChildren(
      buildNode(
        errorHtml(
          'You must be logged in to view your profile. <a href="/login" data-link>Login</a>'
        )
      )!
    );
    return;
  }
  await renderProfileDetail(name);
}
