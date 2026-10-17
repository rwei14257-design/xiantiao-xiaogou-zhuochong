const img = document.querySelector("#pet"),
  bubble = document.querySelector("#bubble");
let state,
  lastAction,
  bubbleTimer,
  pointer,
  moving = false,
  lastIgnore;
const hitCanvas = document.createElement("canvas");
hitCanvas.width = hitCanvas.height = 80;
const hit = hitCanvas.getContext("2d", { willReadFrequently: true });
function receive(next) {
  state = next;
  const current = state.actions.find((a) => a.id === state.action);
  const key = `${state.activity.key}:${state.artworkRevision}`;
  if (lastAction !== key) {
    lastAction = key;
    img.src =
      current.src + (current.supplied ? `?v=${state.artworkRevision}` : "");
    img.alt = current.name;
    bubble.textContent = state.activity.text || current.text;
    clearTimeout(bubbleTimer);
    bubble.classList.toggle("visible", state.bubbles);
    bubbleTimer = setTimeout(() => bubble.classList.remove("visible"), 5500);
  }
  if (!state.bubbles) bubble.classList.remove("visible");
}
window.puppy.onState(receive);
window.puppy.getState().then(receive);
// Sample the GIF's current alpha channel so transparent image margins pass clicks through.
setInterval(() => {
  if (img.complete && img.naturalWidth) {
    hit.clearRect(0, 0, 80, 80);
    hit.drawImage(img, 0, 0, 80, 80);
  }
}, 100);
function opaqueAt(e) {
  const r = img.getBoundingClientRect();
  const x = Math.floor(((e.clientX - r.left) / r.width) * 80),
    y = Math.floor(((e.clientY - r.top) / r.height) * 80);
  if (x < 0 || y < 0 || x >= 80 || y >= 80) return false;
  return hit.getImageData(x, y, 1, 1).data[3] > 20;
}
document.addEventListener("pointermove", (e) => {
  if (
    pointer &&
    !moving &&
    Math.hypot(e.screenX - pointer.x, e.screenY - pointer.y) > 4
  ) {
    moving = true;
    window.puppy.drag("start");
  }
  const ignore = !pointer && !e.target.closest("button") && !opaqueAt(e);
  if (ignore !== lastIgnore) {
    lastIgnore = ignore;
    window.puppy.mouse(ignore);
  }
});
img.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  pointer = { x: e.screenX, y: e.screenY };
  moving = false;
  img.setPointerCapture(e.pointerId);
  window.puppy.mouse(false);
});
function release(e, cancelled = false) {
  if (!pointer) return;
  const clicked = !moving && !cancelled;
  pointer = null;
  moving = false;
  window.puppy.drag("end");
  if (img.hasPointerCapture(e.pointerId))
    img.releasePointerCapture(e.pointerId);
  if (clicked) window.puppy.action(state.action === "heart" ? "good" : "heart");
}
img.addEventListener("pointerup", (e) => release(e));
img.addEventListener("pointercancel", (e) => release(e, true));
img.addEventListener("lostpointercapture", (e) => release(e, true));
window.addEventListener("blur", () => {
  pointer = null;
  moving = false;
  window.puppy.drag("end");
});
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  window.puppy.menu();
});
document.querySelector("#home").onclick = () => window.puppy.panel();
document.querySelector("#love").onclick = () => window.puppy.action("heart");
document.querySelector("#more").onclick = () => window.puppy.menu();
img.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    window.puppy.action("heart");
  }
});
