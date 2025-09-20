import {
  listProfiles,
  getProfile,
  follow,
  unfollow,
  type Profile,
} from "../services/socialApi";

const rootId = "app-content";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts: { className?: string; html?: string } = {}
) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.html) node.innerHTML = opts.html;
  return node;
}

export async function renderProfilesList() {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.innerHTML = "<p>Loading profiles…</p>";

  try {
    const profilesData = await listProfiles({ limit: 20, page: 1 });
    const data = Array.isArray(profilesData)
      ? profilesData
      : (profilesData as any).data ?? [];

    const container = el("div", { className: "profiles" });
    container.append(
      ...data.map((profile: Profile) => {
        const card = el("article", { className: "profile-card" });
        card.innerHTML = `
          <img src="${profile.avatar || "https://placehold.co/64x64"}" alt="${
          profile.name
        }" width="64" height="64" style="border-radius:50%"/>
          <h3><a href="/profiles/${encodeURIComponent(
            profile.name
          )}" data-link> ${profile.name} </a></h3>
          ${profile.bio ? `<p>${profile.bio}</p>` : ""}
				`;
        return card;
      })
    );

    root.innerHTML = "";
    root.append(container);
  } catch (error: any) {
    root.innerHTML = `<p style="color:red">${
      error?.message || "Failed to load profiles"
    }</p>`;
  }
}

export async function renderProfileDetail(name: string) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.innerHTML = "<p>Loading profile…</p>";

  try {
    const profile = await getProfile(name, {
      followers: true,
      following: true,
      posts: false,
    });

    const container = el("section", { className: "profile-detail" });
    container.innerHTML = `
      <header>
        <img src="${
          profile.banner || "https://placehold.co/800x200"
        }" alt="banner" style="width:100%;max-height:200px;object-fit:cover"/>
				<div style="display:flex;gap:12px;align-items:center;margin-top:-32px">
          <img src="${profile.avatar || "https://placehold.co/96x96"}" alt="${
      profile.name
    }" width="96" height="96" style="border-radius:50%;border:3px solid #fff"/>
					<div>
            <h2>${profile.name}</h2>
            ${profile.bio ? `<p>${profile.bio}</p>` : ""}
            <small>Followers: ${profile._count?.followers ?? 0} · Following: ${
      profile._count?.following ?? 0
    }</small>
					</div>
				</div>
			</header>
			<div style="margin:12px 0; display:flex; gap:8px">
				<button id="btn-follow">Follow</button>
				<button id="btn-unfollow">Unfollow</button>
			</div>
		`;

    root.innerHTML = "";
    root.append(container);

    document
      .getElementById("btn-follow")
      ?.addEventListener("click", async () => {
        await follow(name);
        alert(`Followed ${name}`);
      });

    document
      .getElementById("btn-unfollow")
      ?.addEventListener("click", async () => {
        await unfollow(name);
        alert(`Unfollowed ${name}`);
      });
  } catch (error: any) {
    root.innerHTML = `<p style="color:red">${
      error?.message || "Failed to load profile"
    }</p>`;
  }
}
