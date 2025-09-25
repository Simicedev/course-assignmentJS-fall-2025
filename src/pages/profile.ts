import {
  getProfile,
  follow,
  unfollow,
  fetchAllProfiles,
  listProfiles,
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
// Cache for profiles list so a simple client-side username search can filter
let cachedProfiles: Profile[] = [];
// --- Remote search state (aggregated full search) ---
let remoteQuery = "";
let remoteInFlight = 0;
let remoteDebounce: number | null = null;
const REMOTE_MIN_CHARS = 1; // allow search after 1 char (adjust for API load)
const REMOTE_PAGE_LIMIT = 30; // page size for server search
let remotePage = 1; // current page in paged server search
let remoteAccumulated: Profile[] = []; // accumulated results so far

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

// --- Basic username search (client-side, case-insensitive) ---
function searchBarHtml(): string {
  return `
    <div class="c-profiles-basic-search" id="profiles-search-bar">
      <label for="profiles-search-input" class="c-profiles-basic-search-label">Search username:</label>
      <input id="profiles-search-input" class="c-profiles-basic-search-input" type="text" placeholder="Type ${REMOTE_MIN_CHARS}+ chars to search all users…" />
      <button type="button" id="profiles-search-clear" class="btn btn-secondary" hidden>Clear</button>
    </div>
    <div id="profiles-search-status" class="c-profiles-search-status" aria-live="polite"></div>
  `;
}

function filterProfilesByName(query: string): Profile[] {
  if (!query.trim()) return cachedProfiles;
  const q = query.trim().toLowerCase();
  return cachedProfiles.filter((p) => p.name.toLowerCase().includes(q));
}

function rebuildProfilesGrid(containerMount: HTMLElement, profiles: Profile[]) {
  const newGrid = buildProfilesGrid(profiles);
  containerMount.replaceWith(newGrid);
  return newGrid; // return for further operations if needed
}

export async function renderProfilesList() {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.replaceChildren(buildNode(loadingHtml("Loading profiles…"))!);
  try {
    const data = await fetchAllProfiles({ pageSize: 100, maxPages: 4 });
    cachedProfiles = data;
    const searchBar = buildNode(searchBarHtml());
    const grid = buildProfilesGrid(cachedProfiles);
    root.replaceChildren(searchBar!, grid);

    // Wire up search input – filters locally without extra network
    const input = document.getElementById(
      "profiles-search-input"
    ) as HTMLInputElement | null;
    const clearBtn = document.getElementById(
      "profiles-search-clear"
    ) as HTMLButtonElement | null;
    const statusEl = document.getElementById(
      "profiles-search-status"
    ) as HTMLElement | null;
    statusEl &&
      (statusEl.textContent = `Type ${REMOTE_MIN_CHARS}+ chars to search entire API (username)`);

    function showLocalFilter(val: string) {
      const currentGrid = root!.querySelector(".c-profiles-grid");
      if (currentGrid)
        rebuildProfilesGrid(
          currentGrid as HTMLElement,
          filterProfilesByName(val)
        );
      statusEl &&
        (statusEl.textContent = val.trim()
          ? "Filtered locally"
          : "Showing cached list");
    }
    function resetRemoteState() {
      remotePage = 1;
      remoteAccumulated = [];
    }

    async function runPagedRemoteSearch(append = false) {
      const gridEl = root!.querySelector(
        ".c-profiles-grid"
      ) as HTMLElement | null;
      if (!gridEl) return;
      const q = remoteQuery.trim();
      if (q.length < REMOTE_MIN_CHARS) {
        showLocalFilter(q);
        return;
      }
      const currentPage = append ? remotePage + 1 : 1;
      if (!append) {
        resetRemoteState();
        gridEl.replaceChildren(
          buildNode(`<p class='c-loading'>Searching…</p>`)!
        );
        statusEl && (statusEl.textContent = "Searching server…");
      } else {
        statusEl && (statusEl.textContent = "Loading more…");
      }
      const searchId = ++remoteInFlight;
      try {
        const pageData = await listProfiles({
          limit: REMOTE_PAGE_LIMIT,
          page: currentPage,
          q
        });
        if (searchId !== remoteInFlight) return; // stale response
        if (!pageData.length && currentPage === 1) {
          gridEl.replaceChildren(
            buildNode(
              `<p class='c-empty'>No results for \"${q.split("<").join("&lt;")}\"</p>`
            )!
          );
          statusEl && (statusEl.textContent = "");
          document.getElementById("profiles-search-more")?.remove();
          return;
        }
        if (!append) gridEl.replaceChildren();
        remotePage = currentPage;
        remoteAccumulated = append
          ? remoteAccumulated.concat(pageData)
          : pageData.slice();
        pageData.forEach((p) => {
          const card = buildNode(profileCardHtml(p));
          if (card) gridEl.appendChild(card);
        });
        const hasMore = pageData.length === REMOTE_PAGE_LIMIT;
        let moreBtn = document.getElementById(
          "profiles-search-more"
        ) as HTMLButtonElement | null;
        if (hasMore) {
          if (!moreBtn) {
            moreBtn = document.createElement("button");
            moreBtn.id = "profiles-search-more";
            moreBtn.className = "btn btn-secondary";
            moreBtn.textContent = "Load more";
            gridEl.after(moreBtn);
          }
          moreBtn.onclick = () => runPagedRemoteSearch(true);
          statusEl &&
            (statusEl.textContent = `Showing ${remoteAccumulated.length} so far…`);
        } else {
          document.getElementById("profiles-search-more")?.remove();
          statusEl &&
            (statusEl.textContent = `Found ${remoteAccumulated.length} result${remoteAccumulated.length === 1 ? "" : "s"}`);
        }
      } catch (e: any) {
        if (searchId !== remoteInFlight) return;
        gridEl.replaceChildren(
          buildNode(
            `<p class='c-error'>Search failed: ${e?.message || "Unknown error"}</p>`
          )!
        );
        statusEl && (statusEl.textContent = "");
        document.getElementById("profiles-search-more")?.remove();
      }
    }

    function scheduleRemotePaged() {
      if (remoteDebounce) window.clearTimeout(remoteDebounce);
      remoteDebounce = window.setTimeout(
        () => runPagedRemoteSearch(false),
        300
      );
    }

    input?.addEventListener("input", () => {
      const val = input.value;
      clearBtn && (clearBtn.hidden = val.length === 0);
      remoteQuery = val;
      if (val.trim().length < REMOTE_MIN_CHARS) {
        // live local filter while below threshold
        showLocalFilter(val);
        return;
      }
      scheduleRemotePaged();
    });

    clearBtn?.addEventListener("click", () => {
      if (!input) return;
      input.value = "";
      remoteQuery = "";
      clearBtn.hidden = true;
      showLocalFilter("");
      input.focus();
    });

    input?.addEventListener("keydown", async (e) => {
      if (e.key === "Escape") {
        if (input.value) {
          input.value = "";
          remoteQuery = "";
          clearBtn && (clearBtn.hidden = true);
          showLocalFilter("");
        } else {
          input.blur();
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        remoteQuery = input.value.trim();
        // Try exact profile match instantly for fast navigation
        if (remoteQuery) {
          try {
            const exact = await getProfile(remoteQuery, {
              followers: false,
              following: false,
              posts: false
            });
            if (exact?.name) {
              history.pushState(
                { path: `/profiles/${exact.name}` },
                "",
                `/profiles/${exact.name}`
              );
              window.dispatchEvent(new PopStateEvent("popstate"));
              return; // navigated to detail view
            }
          } catch {
            /* ignore, fallback to search */
          }
        }
        runPagedRemoteSearch(false);
      }
    });
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
