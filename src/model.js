const actions = [
  { id: "hello", name: "见面摇摇", text: "今天也陪着你呀。" },
  { id: "heart", name: "给你爱心", text: "一颗爱心，送给你！" },
  { id: "jump", name: "开心蹦跶", text: "好心情 +1！" },
  { id: "good", name: "夸夸小狗", text: "你已经做得很棒啦。" },
  { id: "dance", name: "快乐起舞", text: "一起摇摆一下～" },
  { id: "eat", name: "开饭时间", text: "记得好好吃饭哦。" },
  { id: "read", name: "安静陪伴", text: "你忙你的，我陪着。" },
  { id: "sleep", name: "呼呼大睡", text: "休息也是很重要的事。" },
  { id: "drink", name: "喝口水吧", text: "喝口水，伸个懒腰。" },
  { id: "offwork", name: "下班快乐", text: "辛苦啦，今天到这里。" },
];
const defaults = {
  size: 220,
  topmost: true,
  auto: true,
  bubbles: true,
  action: "hello",
  position: null,
};
function normalize(input = {}) {
  if (!input || typeof input !== "object") input = {};
  return {
    size: [160, 220, 300].includes(input.size) ? input.size : defaults.size,
    topmost:
      typeof input.topmost === "boolean" ? input.topmost : defaults.topmost,
    auto: typeof input.auto === "boolean" ? input.auto : defaults.auto,
    bubbles:
      typeof input.bubbles === "boolean" ? input.bubbles : defaults.bubbles,
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
