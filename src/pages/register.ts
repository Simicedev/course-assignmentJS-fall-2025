import { registerUser, loginUser } from "../services/authApi";
import { setAuth, emitAuthChanged } from "../storage/authentication";

const outletId = "app-content";

export function renderRegister() {
  const root = document.getElementById(outletId);
  if (!root) return;
  root.innerHTML = `
	<h1>Register</h1>
	<form id="register-form">
		<label>Username <input name="name" required pattern="[A-Za-z0-9_]+" title="Letters, numbers and underscore only"></label><br>
		<label>Email <input name="email" type="email" required></label><br>
		<label>Password <input name="password" type="password" minlength="8" required></label><br>
		<label>Avatar URL <input name="avatar" type="url" placeholder="https://..."></label><br>
		<label>Banner URL <input name="banner" type="url" placeholder="https://..."></label><br>
		<button type="submit">Create account</button>
	</form>
	<p id="register-msg"></p>
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
