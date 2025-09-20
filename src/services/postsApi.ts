import { get, post, put, del } from "../ApiClient/apiClient";

export type PostModel = {
  id: number;
  title: string;
  body?: string;
  tags?: string[];
  media?: string | null;
  created?: string;
  updated?: string;
  _count?: { comments?: number; reactions?: number };
  [key: string]: any;
};

export type CreatePostBody = Pick<
  PostModel,
  "title" | "body" | "tags" | "media"
>;
export type UpdatePostBody = Partial<CreatePostBody>;

type Include = { author?: boolean; comments?: boolean; reactions?: boolean };

function buildPostInclude({ author, comments, reactions }: Include = {}) {
  const queryParts: string[] = [];
  if (author) queryParts.push("_author=true");
  if (comments) queryParts.push("_comments=true");
  if (reactions) queryParts.push("_reactions=true");
  return queryParts.length ? `&${queryParts.join("&")}` : "";
}

export function listPosts(params?: {
  page?: number;
  limit?: number;
  tag?: string;
  include?: Include;
}) {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  const tag = params?.tag ? `&_tag=${encodeURIComponent(params.tag)}` : "";
  const includeQuery = buildPostInclude(params?.include);
  return get<PostModel[]>(
    `/social/posts?limit=${limit}&page=${page}${tag}${includeQuery}`
  );
}

export function getPost(id: number, include?: Include) {
  const includeQuery = buildPostInclude(include).replace(/^&/, "?");
  return get<PostModel>(`/social/posts/${id}${includeQuery}`);
}

export function listFollowingPosts(params?: {
  page?: number;
  limit?: number;
  include?: Include;
}) {
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  const includeQuery = buildPostInclude(params?.include);
  return get<PostModel[]>(
    `/social/posts/following?limit=${limit}&page=${page}${includeQuery}`
  );
}

export function createPost(body: CreatePostBody) {
  return post<PostModel>(`/social/posts`, body);
}

export function updatePost(id: number, body: UpdatePostBody) {
  return put<PostModel>(`/social/posts/${id}`, body);
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
