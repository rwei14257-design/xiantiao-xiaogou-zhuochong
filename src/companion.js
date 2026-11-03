const focusDuration = 25 * 60000;
const surprises = [
  { action: "heart", effect: "hearts", name: "爱心泡泡" },
  { action: "jump", effect: "stars", name: "流星跳跃" },
  { action: "celebrate", effect: "confetti", name: "彩纸庆祝" },
  { action: "dance", effect: "beats", name: "闪光舞步" },
];
function nextSurprise(previous, random = Math.random) {
  const pool = surprises.filter((s) => s.effect !== previous);
  return pool[Math.floor(random() * pool.length)];
}
function companionActivity(
  base,
  {
    media,
    music,
    focusUntil,
    now,
    auto = true,
    hovering = false,
    dragging = false,
  },
) {
  if (base.mode === "manual") return base;
  const d = new Date(now);
  if (
    auto &&
    [5, 17].includes(d.getHours()) &&
    [20, 21].includes(d.getMinutes())
  ) {
    const first = d.getMinutes() === 20;
    return {
      ...base,
      mode: "moment",
      id: "love-minute",
      key: "moment:" + d.getMinutes(),
      title: first ? "520 爱心时刻" : "521 庆祝时刻",
      action: first ? "heart" : "celebrate",
      effect: first ? "hearts" : "confetti",
    };
  }
  if (dragging)
    return {
      ...base,
      mode: "drag",
      key: "drag",
      title: "一起挪个窝",
      action: "celebrate",
    };
  if (focusUntil > now)
    return {
      ...base,
      mode: "focus",
      id: "focus-session",
      key: "focus-session:" + focusUntil,
      title: "一起专注",
      action: "read",
      until: focusUntil,
    };
  if (
    base.mode === "schedule" &&
    music &&
    media === "playing" &&
    base.action !== "sleep"
  )
    return {
      ...base,
      mode: "music",
      id: "music",
      key: "music",
      title: "随音乐跳舞",
      action: "dance",
      effect: "beats",
    };
  if (hovering && base.mode === "schedule" && base.action !== "sleep")
    return {
      ...base,
      mode: "hover",
      key: "hover",
      title: "见面蹦一蹦",
      action: "jump",
    };
  return base;
}
module.exports = { companionActivity, nextSurprise, surprises, focusDuration };
