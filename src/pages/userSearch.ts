// READ THIS CHANGE
import { listProfiles } from "../services/socialApi";
import { debounce } from "../utils/debounce";

export async function searchAndGoToUser(event: Event) {
  event.preventDefault();
  const input = document.getElementById("user-search-input") as HTMLInputElement | null;
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  if (!query) return;

  // Search for user by email or username
  const result = await listProfiles({ limit: 50, include: {} });
  const users = Array.isArray(result) ? result : result.data;
  const found = users.find(
    (u: any) =>
      u.email?.toLowerCase() === query ||
      u.username?.toLowerCase() === query
  );
  if (found) {
    window.location.href = `/profiles/${found.id}`;
  } else {
    alert("User not found.");
  }
}

export const debouncedSearchAndGoToUser = debounce(searchAndGoToUser, 400);
