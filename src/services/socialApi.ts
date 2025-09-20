import { get, put } from "../ApiClient/apiClient";

// Minimal types to keep TS happy while staying flexible
export type Profile = {
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  _count?: {
    followers?: number;
    following?: number;
    posts?: number;
  };
  [key: string]: any;
};

export type PagedResult<T> = {
  data: T[] | T;
  meta?: {
    next?: string | null;
    previous?: string | null;
    page?: number;
    pageSize?: number;
  };
};

type IncludeOptions = {
  followers?: boolean;
  following?: boolean;
  posts?: boolean;
};

function buildIncludeQuery(opts?: IncludeOptions) {
  if (!opts) return "";
  const params: string[] = [];
  if (opts.followers) params.push("_followers=true");
  if (opts.following) params.push("_following=true");
  if (opts.posts) params.push("_posts=true");
  return params.length ? `&${params.join("&")}` : "";
}


function toQuerySuffix(include: string) {
  if (!include) return "";
  return include.startsWith("&") ? `?${include.slice(1)}` : `?${include}`;
}

export async function listProfiles(params?: {
  limit?: number;
  page?: number;
  q?: string;
  include?: IncludeOptions;
}) {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  const searchQuery = params?.q ? `&q=${encodeURIComponent(params.q)}` : "";
  const include = buildIncludeQuery(params?.include);
  return get<PagedResult<Profile>>(
    `/social/profiles?limit=${limit}&page=${page}${searchQuery}${include}`
  );
}

export async function getProfile(name: string, include?: IncludeOptions) {
  const includeQuery = toQuerySuffix(buildIncludeQuery(include));
  return get<Profile>(
    `/social/profiles/${encodeURIComponent(name)}${includeQuery}`
  );
}

export async function getFollowers(name: string) {
  return get<PagedResult<Profile>>(
    `/social/profiles/${encodeURIComponent(name)}/followers`
  );
}

export async function getFollowing(name: string) {
  return get<PagedResult<Profile>>(
    `/social/profiles/${encodeURIComponent(name)}/following`
  );
}

export async function follow(name: string) {
  // Send no body per API spec to avoid 415 Unsupported Media Type
  return put(
    `/social/profiles/${encodeURIComponent(name)}/follow`,
    undefined as any
  );
}

export async function unfollow(name: string) {
  // Unfollow uses PUT /unfollow with no body
  return put(
    `/social/profiles/${encodeURIComponent(name)}/unfollow`,
    undefined as any
  );
}

export async function updateMedia(
  name: string,
  media: { avatar?: string; banner?: string }
) {
  return put(`/social/profiles/${encodeURIComponent(name)}/media`, media);
}

export async function getProfilePosts(
  name: string,
  params?: { limit?: number; page?: number }
) {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  return get<PagedResult<any>>(
    `/social/profiles/${encodeURIComponent(
      name
    )}/posts?limit=${limit}&page=${page}`
  );
}
