import { loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";


const outletId = "app-content";

export function renderLogin() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `
  <form class="flex flex-col gap-2 sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto  bg-(--panel) backdrop-blur-md border border-blue-500 p-6 rounded-2xl shadow-md text-white" id="login-form">
	<h1 class="flex justify-center text-xl font-bold mb-4">Login</h1>
  <div class="mb-4">
    <label class="flex flex-col">Email <input class="border rounded-2xl p-1 text-black bg-gray-100" name="email" type="email" required></label><br>
	</div>
  <div class="mb-4"> 
    <label class="flex flex-col">Password <input class="border rounded-2xl p-1 text-black bg-gray-100" name="password" type="password" required></label><br>
  </div>
		<button class="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white font-bold py-2 px-4 rounded-2xl" type="submit">Login</button>
	</form>
	<p id="login-msg"></p>
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
