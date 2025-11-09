import { registerUser, loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";

const outletId = "app-content";

export function renderRegister() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `
    <div class="w-full max-w-md mx-auto mt-8 sm:mt-12 px-2 sm:px-6 py-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Register</h1>
      <form id="register-form" class="space-y-4">
        <label class="block text-gray-700 dark:text-gray-300">Username
          <input name="name" required pattern="[A-Za-z0-9_]+" title="Letters, numbers and underscore only" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <label class="block text-gray-700 dark:text-gray-300">Email
          <input name="email" type="email" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <label class="block text-gray-700 dark:text-gray-300">Password
          <input name="password" type="password" minlength="8" required class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <label class="block text-gray-700 dark:text-gray-300">Avatar URL
          <input name="avatar" type="url" placeholder="https://..." class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <label class="block text-gray-700 dark:text-gray-300">Banner URL
          <input name="banner" type="url" placeholder="https://..." class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2" />
        </label>
        <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow">Create account</button>
      </form>
      <p id="register-msg" class="mt-4 text-center text-sm text-red-500"></p>
    </div>
  `;

  const form = document.getElementById(
    "register-form"
  ) as HTMLFormElement | null;
  const msg = document.getElementById("register-msg");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const body = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      avatar: formData.get("avatar")
        ? { url: String(formData.get("avatar")), alt: "Avatar" }
        : undefined,
      banner: formData.get("banner")
        ? { url: String(formData.get("banner")), alt: "Banner" }
        : undefined,
    };
    msg && (msg.textContent = "Registering…");
    try {
      const response = await registerUser(body);
      console.log("Register response:", response);
      // Some APIs don't return accessToken on register; perform auto-login to get token
      const loginRes = await loginUser({
        email: body.email,
        password: body.password,
      });
      setAuth({
        accessToken: loginRes.data.accessToken,
        name: loginRes.data.name,
        email: loginRes.data.email,
      });
      console.log(
        "register.ts: accessToken now in LS?",
        localStorage.getItem("accessToken")
      );
      emitAuthChanged();
      msg && (msg.textContent = `Registered as ${loginRes.data.name}`);
      history.pushState({ path: "/" }, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (err: any) {
      msg && (msg.textContent = err?.message || "Registration failed");
    }
  });
}
