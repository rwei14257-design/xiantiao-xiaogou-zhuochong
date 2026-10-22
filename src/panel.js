let initialized = false;
let displayedRevision = -1,
  displayedTimeline = "";
const timeLabels = {
  wake: "起床",
  breakfast: "早餐",
  lunch: "午餐",
  offwork: "下班",
  dinner: "晚餐",
  bedtime: "睡觉",
};
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
      label.className = "action-name";
      label.textContent = action.name;
      image.alt = `${action.name}的小狗形态`;
      const description = document.createElement("span");
      description.className = "action-description";
      description.textContent = action.text;
      const timing = document.createElement("span");
      timing.className = "action-timing";
      button.append(image, label, description, timing);
      button.title = action.text;
      button.onclick = () => window.puppy.action(action.id);
      document.querySelector("#actions").append(button);
    }
    for (const [key, label] of Object.entries(timeLabels)) {
      const wrapper = document.createElement("label");
      wrapper.textContent = label;
      const input = document.createElement("input");
      input.type = "time";
      input.name = key;
      input.required = true;
      input.value = state.times[key];
      wrapper.append(input);
      document.querySelector("#time-inputs").append(wrapper);
    }
  }
  const current = state.actions.find((a) => a.id === state.action),
    hero = document.querySelector("#hero");
  if (
    hero.dataset.action !== current.id ||
    displayedRevision !== state.artworkRevision
  ) {
    hero.src =
      current.src + (current.supplied ? `?v=${state.artworkRevision}` : "");
    hero.dataset.action = current.id;
  }
  document.querySelector("#current").textContent = current.name;
  hero.alt = `${current.name}的小狗形态`;
  for (const item of state.actions) {
    const entries = state.activity.timeline.filter((e) => e.action === item.id);
    const labels = {
      hello: `${state.times.wake} 早安 · 闲暇陪伴`,
      read: `工作日 09:00–${state.times.offwork}`,
      jump: "工作日整点前伸展 · 也可点选",
      heart: "点击互动 · 2 分钟后回到作息",
      good: "点击鼓励 · 2 分钟后回到作息",
      dance: "点击起舞 · 2 分钟后回到作息",
      celebrate: "点击庆祝 · 2 分钟后回到作息",
    };
    document.querySelector(
      `[data-action="${item.id}"] .action-timing`,
    ).textContent =
      labels[item.id] || entries.map((e) => `${e.time} ${e.title}`).join(" / ");
  }
  if (displayedRevision !== state.artworkRevision) {
    for (const item of state.actions)
      document.querySelector(`button[data-action="${item.id}"] img`).src =
        item.src + (item.supplied ? `?v=${state.artworkRevision}` : "");
    displayedRevision = state.artworkRevision;
  }
  document.querySelector("#asset-count").textContent =
    `线条小狗 · 已载入 ${state.suppliedCount} / ${state.actions.length} 个状态素材`;
  document.querySelector("#activity-description").textContent =
    state.activity.text || current.text;
  document.querySelector("#activity-title").textContent = state.activity.title;
  document.querySelector("#activity-time").textContent =
    state.activity.mode === "schedule"
      ? state.activity.timeLabel
      : state.activity.mode === "manual"
        ? "互动结束后会自动回到当前作息"
        : "选择一个喜欢的动作，一直陪着你";
  document.querySelector("#next-event").textContent =
    `${state.activity.next.tomorrow ? "明天 " : ""}${state.activity.next.time} ${state.activity.next.title}`;
  document.querySelector("#mode-label").textContent =
    state.activity.mode === "fixed"
      ? "作息暂停"
      : state.activity.weekend
        ? "周末节奏 · 系统本地时间"
        : "工作日节奏 · 系统本地时间";
  document.querySelector("#resume").hidden = state.activity.mode === "schedule";
  const timeline = document.querySelector("#timeline");
  const timelineKey = JSON.stringify(state.activity.timeline);
  if (timelineKey !== displayedTimeline) {
    displayedTimeline = timelineKey;
    timeline.replaceChildren();
    for (const entry of state.activity.timeline) {
      const item = document.createElement("div");
      item.className = "timeline-stop";
      item.dataset.event = entry.id;
      const time = document.createElement("span");
      time.textContent = entry.time;
      const title = document.createElement("strong");
      title.textContent = entry.title;
      item.title = `${entry.time}–${entry.end}`;
      item.append(time, title);
      timeline.append(item);
    }
  }
  for (const item of timeline.children)
    item.classList.toggle("current", item.dataset.event === state.activity.id);
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
document.querySelector("#resume").onclick = () => window.puppy.resume();
document.querySelector("#times-form").onsubmit = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const times = Object.fromEntries(new FormData(form));
  if (times.wake === times.bedtime) {
    document.querySelector("#schedule-message").textContent =
      "起床和睡觉时间需要不同。";
    return;
  }
  const updated = await window.puppy.settings({ times });
  for (const input of form.querySelectorAll("input"))
    input.value = updated.times[input.name];
  document.querySelector("#schedule-message").textContent =
    "已保存，小狗从现在开始跟着你的作息走。";
};
document.querySelector("#import-assets").onclick = async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const result = await window.puppy.importAssets();
    if (result.canceled) return;
    document.querySelector("#asset-message").textContent = result.error
      ? `导入失败：${result.error}`
      : result.unchanged
        ? "这个文件夹已经是当前素材目录。"
        : `已导入 ${result.imported.length} 个状态，跳过 ${result.skipped.length} 个无法使用的文件。素材只保存在本机。`;
  } catch {
    document.querySelector("#asset-message").textContent =
      "导入未完成，请重试。";
  } finally {
    button.disabled = false;
  }
};
document.querySelector("#open-assets").onclick = async () => {
  const result = await window.puppy.openAssets();
  if (result.error)
    document.querySelector("#asset-message").textContent = result.error;
};
