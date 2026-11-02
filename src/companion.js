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
function companionActivity(base, { media, music, focusUntil, now }) {
  if (base.mode === "manual") return base;
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
  return base;
}
module.exports = { companionActivity, nextSurprise, surprises, focusDuration };
