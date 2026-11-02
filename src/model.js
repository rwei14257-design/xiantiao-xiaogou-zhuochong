const { normalizeTimes } = require("./schedule");
const actions = [
  { id: "hello", name: "见面摇摇" },
  { id: "heart", name: "给你爱心" },
  { id: "jump", name: "开心蹦跶" },
  { id: "good", name: "夸夸小狗" },
  { id: "dance", name: "快乐起舞" },
  { id: "eat", name: "开饭时间" },
  { id: "read", name: "安静陪伴" },
  { id: "sleep", name: "呼呼大睡" },
  { id: "drink", name: "喝口水吧" },
  { id: "offwork", name: "下班快乐" },
  { id: "sleepy", name: "睡前放松" },
  { id: "celebrate", name: "完成庆祝" },
];
const defaults = {
  size: 220,
  topmost: true,
  music: true,
  auto: true,
  action: "hello",
  position: null,
};
function normalize(input = {}) {
  if (!input || typeof input !== "object") input = {};
  return {
    size: [160, 220, 300].includes(input.size) ? input.size : defaults.size,
    music: typeof input.music === "boolean" ? input.music : defaults.music,
    topmost:
      typeof input.topmost === "boolean" ? input.topmost : defaults.topmost,
    auto: typeof input.auto === "boolean" ? input.auto : defaults.auto,
    times: normalizeTimes(input.times),
    action: actions.some((a) => a.id === input.action)
      ? input.action
      : defaults.action,
    position:
      input.position &&
      Number.isFinite(input.position.x) &&
      Number.isFinite(input.position.y)
        ? { x: Math.round(input.position.x), y: Math.round(input.position.y) }
        : null,
  };
}
function clampBounds(rect, area) {
  return {
    ...rect,
    x: Math.round(
      Math.max(
        area.x,
        Math.min(rect.x, area.x + Math.max(0, area.width - rect.width)),
      ),
    ),
    y: Math.round(
      Math.max(
        area.y,
        Math.min(rect.y, area.y + Math.max(0, area.height - rect.height)),
      ),
    ),
  };
}
module.exports = { actions, defaults, normalize, clampBounds };
