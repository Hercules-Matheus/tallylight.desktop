const AuthUI = {
  async handleLogin() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-pass").value;

    const response = await window.api.login({ email, password });
    if (response.success) {
      this.transitionToSetup();
    } else {
      alert("Falha no login: " + response.error);
    }
  },
  transitionToSetup() {
    document.getElementById("screen-auth").style.display = "none";
    document.getElementById("screen-setup").style.display = "flex";
  },
};
