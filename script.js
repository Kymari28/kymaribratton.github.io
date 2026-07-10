const revealNodes = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -48px 0px",
  },
);

revealNodes.forEach((node) => revealObserver.observe(node));

const roleNode = document.querySelector("[data-role-rotator]");

if (roleNode) {
  const roles = (roleNode.dataset.roles || "")
    .split("|")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length > 1) {
    let roleIndex = 0;

    window.setInterval(() => {
      roleNode.classList.add("is-swapping");

      window.setTimeout(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        roleNode.textContent = roles[roleIndex];
        roleNode.classList.remove("is-swapping");
      }, 220);
    }, 2600);
  }
}

const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}
