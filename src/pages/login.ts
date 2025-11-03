import { loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";


const outletId = "app-content";

export function renderLogin() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `
	<h1>Login</h1>
	<form id="login-form">
		<label>Email <input name="email" type="email" required></label><br>
		<label>Password <input name="password" type="password" required></label><br>
		<button type="submit">Login</button>
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
