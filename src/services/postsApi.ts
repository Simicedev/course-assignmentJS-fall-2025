import { get, post, put, del } from "../ApiClient/apiClient";

export type PostModel = {
  id: number;
  title: string;
  body?: string;
  tags?: string[];
  // In V2, media is often an object; keep flexible
  media?: { url: string; alt?: string } | string | null;
  created?: string;
  updated?: string;
  _count?: { comments?: number; reactions?: number };
  [key: string]: any;
};

export type CreatePostBody = {
  title: string;
  body?: string;
  tags?: string[];
  media?: { url: string; alt?: string };
};
export type UpdatePostBody = Partial<CreatePostBody>;

type Include = { author?: boolean; comments?: boolean; reactions?: boolean };

function buildPostInclude({ author, comments, reactions }: Include = {}) {
  const queryParts: string[] = [];
  if (author) queryParts.push("_author=true");
  if (comments) queryParts.push("_comments=true");
  if (reactions) queryParts.push("_reactions=true");
  return queryParts.length ? `&${queryParts.join("&")}` : "";
}

type PagedResponse<T> = { data: T[]; meta?: any };
type SingleResponse<T> = { data: T; meta?: any };

export async function listPosts(params?: {
  page?: number;
  limit?: number;
  tag?: string;
  q?: string; // server-side search (title/body) if API supports
  include?: Include;
}) {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  const tag = params?.tag ? `&_tag=${encodeURIComponent(params.tag)}` : "";
  const searchQuery = params?.q ? `&q=${encodeURIComponent(params.q)}` : "";
  const includeQuery = buildPostInclude(params?.include);
  const res = await get<PagedResponse<PostModel>>(
    `/social/posts?limit=${limit}&page=${page}${searchQuery}${tag}${includeQuery}`
  );
  return res?.data ?? ([] as PostModel[]);
}

export async function getPost(id: number, include?: Include) {
  const includeQuery = buildPostInclude(include).replace(/^&/, "?");
  const res = await get<SingleResponse<PostModel>>(
    `/social/posts/${id}${includeQuery}`
  );
  return res?.data as PostModel;
}

export async function listFollowingPosts(params?: {
  page?: number;
  limit?: number;
  include?: Include;
}) {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  const includeQuery = buildPostInclude(params?.include);
  const res = await get<PagedResponse<PostModel>>(
    `/social/posts/following?limit=${limit}&page=${page}${includeQuery}`
  );
  return res?.data ?? ([] as PostModel[]);
}

export async function createPost(body: CreatePostBody) {
  const res = await post<SingleResponse<PostModel>>(`/social/posts`, body);
  return res?.data as PostModel;
}

export async function updatePost(id: number, body: UpdatePostBody) {
  const res = await put<SingleResponse<PostModel>>(`/social/posts/${id}`, body);
  return res?.data as PostModel;
}

export function deletePost(id: number) {
  return del<void>(`/social/posts/${id}`);
}

export function reactToPost(id: number, symbol: string) {
  return put<{ symbol: string; count: number; postId: number }>(
    `/social/posts/${id}/react/${encodeURIComponent(symbol)}`,
    undefined as any
  );
}

export function commentOnPost(
  id: number,
  body: { body: string; replyToId?: number }
) {
  return post(`/social/posts/${id}/comment`, body);
}

export function deleteComment(postId: number, commentId: number) {
  return del<void>(`/social/posts/${postId}/comment/${commentId}`);
}
