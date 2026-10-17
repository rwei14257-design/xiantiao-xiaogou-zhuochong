let initialized = false;
function receive(state) {
  if (!initialized) {
    initialized = true;
    for (const action of state.actions) {
      const button = document.createElement("button");
      button.className = "action-card";
      button.dataset.action = action.id;
      const image = document.createElement("img");
      image.src = action.src;
      image.alt = "";
      image.draggable = false;
      const label = document.createElement("span");
      label.textContent = action.name;
      button.append(image, label);
      button.onclick = () => window.puppy.action(action.id);
      document.querySelector("#actions").append(button);
    }
  }
  const current = state.actions.find((a) => a.id === state.action),
    hero = document.querySelector("#hero");
  if (hero.dataset.action !== current.id) {
    hero.src = current.src;
    hero.dataset.action = current.id;
  }
  document.querySelector("#current").textContent = current.name;
  document.querySelectorAll("[data-action]").forEach((b) => {
    if (b.tagName === "BUTTON") {
      b.classList.toggle("selected", b.dataset.action === state.action);
      b.setAttribute("aria-pressed", String(b.dataset.action === state.action));
    }
  });
  document.querySelectorAll("[data-size]").forEach((b) => {
    b.classList.toggle("selected", Number(b.dataset.size) === state.size);
    b.setAttribute(
      "aria-pressed",
      String(Number(b.dataset.size) === state.size),
    );
  });
  for (const key of ["auto", "topmost", "bubbles"])
    document.querySelector("#" + key).checked = state[key];
  document.querySelector(".online").lastChild.textContent = state.visible
    ? " 陪伴进行中"
    : " 小狗暂时藏起来了";
}
window.puppy.onState(receive);
window.puppy.getState().then(receive);
document
  .querySelectorAll("[data-size]")
  .forEach(
    (b) =>
      (b.onclick = () =>
        window.puppy.settings({ size: Number(b.dataset.size) })),
  );
for (const key of ["auto", "topmost", "bubbles"])
  document.querySelector("#" + key).onchange = (e) =>
    window.puppy.settings({ [key]: e.target.checked });
document.querySelector("#greet").onclick = () => window.puppy.action("heart");
document.querySelector("#return").onclick = () => window.puppy.closePanel();
