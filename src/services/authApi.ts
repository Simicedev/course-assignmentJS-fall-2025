import { post } from "../ApiClient/apiClient";

export type RegisterBody = {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
  banner?: string | null;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type AuthResponse = {
  name: string;
  email: string;
  avatar?: string | null;
  banner?: string | null;
  accessToken: string;
};

export async function registerUser(body: RegisterBody) {
  return post<AuthResponse>("/social/auth/register", body);
}

export async function loginUser(body: LoginBody) {
  return post<AuthResponse>("/social/auth/login", body);
}
