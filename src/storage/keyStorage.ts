import { get } from "../ApiClient/apiClient";


export function load(key: string): string | null {
  return localStorage.getItem(key);
}

export function save(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function remove(key: string): void {
  localStorage.removeItem(key);
}

export async function displayUserProfile(id: string) {
  try {
    const profile = await get(`/social/profiles/${id}`);
    console.log(`User: ${profile.name}, Age: ${profile.age}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
}
