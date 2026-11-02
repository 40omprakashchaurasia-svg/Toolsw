(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
  const themeButton = document.querySelector(".theme");
  try { if (localStorage.getItem("toolswa-dark") === "true") document.body.classList.add("dark"); } catch (_) {}
  themeButton?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    try { localStorage.setItem("toolswa-dark", document.body.classList.contains("dark")); } catch (_) {}
  });
  document.getElementById("search")?.addEventListener("input", (event) => {
    const query = event.target.value.toLowerCase().trim();
    document.querySelectorAll(".card").forEach((card) => {
      const content = `${card.dataset.terms || ""} ${card.innerText || ""}`.toLowerCase();
      card.classList.toggle("hidden", !content.includes(query));
    });
  });
})();
