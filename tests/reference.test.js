const { test } = require("node:test"),
  assert = require("node:assert/strict");
const { getActivity } = require("../src/schedule");
const { companionActivity } = require("../src/companion");
const baseSettings = { auto: true, referenceDaily: true };
function activity(time, patch = {}) {
  const now = +new Date("2026-11-03T" + time + ":00");
  return companionActivity(getActivity(new Date(now), baseSettings), {
    now,
    media: "idle",
    music: true,
    focusUntil: 0,
    ...patch,
  });
}
test("Reference daily windows switch at actual start and end minutes", () => {
  for (const [time, id] of [
    ["00:00", "rest"],
    ["02:00", "leisure"],
    ["09:30", "breakfast"],
    ["10:30", "read"],
    ["10:40", "drink"],
    ["10:50", "leisure"],
    ["12:00", "lunch"],
    ["18:00", "offwork"],
    ["20:00", "dinner"],
    ["23:00", "winddown"],
  ])
    assert.equal(activity(time).id, id, time);
  assert.deepEqual(activity("23:30").next, {
    time: "00:00",
    tomorrow: true,
    title: "深夜熟睡",
  });
});
test("Special minutes, hover, drag and music restore the correct action when they end", () => {
  assert.equal(activity("17:20", { media: "playing" }).effect, "hearts");
  assert.equal(activity("17:21").effect, "confetti");
  assert.equal(activity("17:22").id, "leisure");
  assert.equal(activity("15:05", { hovering: true }).action, "jump");
  assert.equal(
    activity("15:05", { hovering: true, media: "playing" }).mode,
    "music",
  );
  assert.equal(activity("15:05", { dragging: true }).mode, "drag");
  assert.equal(activity("01:00", { hovering: true }).action, "sleep");
});
