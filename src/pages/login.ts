import { loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";

const outletId = "app-content";

export function renderLogin() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `
    <div class="w-full max-w-md mx-auto mt-8 sm:mt-12 px-2 sm:px-6 py-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Login</h1>
      <form id="login-form" class="space-y-4">
        <label class="block text-gray-700 dark:text-gray-300">Email
          <input name="email" type="email" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <label class="block text-gray-700 dark:text-gray-300">Password
          <input name="password" type="password" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow">Login</button>
      </form>
      <p id="login-msg" class="mt-4 text-center text-sm text-red-500"></p>
    </div>
  `;

  const form = document.getElementById("login-form") as HTMLFormElement | null;
  const msg = document.getElementById("login-msg");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    msg && (msg.textContent = "Logging in…");
    try {
      const response = await loginUser({ email, password });
      console.log("Login response:", response);
      setAuth({
        accessToken: response.data.accessToken,
        name: response.data.name,
        email: response.data.email,
      });
      console.log(
        "login.ts: accessToken now in LS?",
        localStorage.getItem("accessToken")
      );
      emitAuthChanged();
      msg && (msg.textContent = `Logged in as ${response.data.name}`);
      // optional: redirect to home
      history.pushState({ path: "/" }, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err: any) {
      msg && (msg.textContent = err?.message || "Login failed");
    }
  });
}
