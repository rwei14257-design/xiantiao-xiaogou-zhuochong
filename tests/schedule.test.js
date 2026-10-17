const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_TIMES,
  getSchedule,
  getActivity,
  normalizeTimes,
  MANUAL_HOLD_MS,
} = require("../src/schedule");
const date = (clock, day = 19) => new Date(`2026-10-${day}T${clock}:00`);
test("Next activity follows effective transitions and overlapping sleep", () => {
  assert.deepEqual(getSchedule(date("10:35"), DEFAULT_TIMES).next, {
    title: "安静专注",
    time: "10:40",
    tomorrow: false,
  });
  const times = { ...DEFAULT_TIMES, wake: "11:00" };
  assert.deepEqual(getSchedule(date("23:30"), times).next, {
    title: "早安见面",
    time: "11:00",
    tomorrow: true,
  });
});
test("Daily events start and end on their local-time boundaries", () => {
  const cases = [
    ["07:29", "sleep"],
    ["07:30", "wake"],
    ["07:50", "leisure"],
    ["08:00", "breakfast"],
    ["08:30", "leisure"],
    ["09:00", "focus"],
    ["10:30", "drink-am"],
    ["10:40", "focus"],
    ["12:15", "lunch"],
    ["12:54", "lunch"],
    ["12:55", "nap"],
    ["13:15", "focus"],
    ["15:00", "drink-pm"],
    ["18:00", "offwork"],
    ["18:45", "dinner"],
    ["22:45", "winddown"],
    ["23:15", "sleep"],
    ["00:05", "sleep"],
  ];
  for (const [time, id] of cases)
    assert.equal(getSchedule(date(time), DEFAULT_TIMES).id, id, time);
});
test("Custom times, midnight windows, and sleep priority are respected", () => {
  const times = {
    ...DEFAULT_TIMES,
    bedtime: "00:30",
    wake: "08:30",
    dinner: "00:20",
  };
  assert.equal(getSchedule(date("00:10"), times).id, "winddown");
  assert.equal(getSchedule(date("00:31"), times).id, "sleep");
  assert.equal(getSchedule(date("08:30"), times).id, "wake");
});
test("A manual interaction holds for two minutes, then resumes the current schedule", () => {
  const start = date("12:14"),
    manual = { action: "heart", until: start.getTime() + MANUAL_HOLD_MS };
  const settings = { auto: true, action: "heart", times: DEFAULT_TIMES };
  assert.equal(getActivity(date("12:15"), settings, manual).mode, "manual");
  assert.equal(getActivity(date("12:16"), settings, manual).action, "eat");
  assert.equal(getActivity(date("14:00"), settings, manual).action, "read");
  assert.equal(
    getActivity(date("12:16"), { ...settings, auto: false }, manual).action,
    "heart",
  );
});
test("Weekend uses relaxed companionship and malformed settings recover", () => {
  assert.equal(getSchedule(date("09:20", 17), DEFAULT_TIMES).id, "leisure");
  assert.equal(
    normalizeTimes({ wake: "99:00", lunch: "12:60" }).wake,
    DEFAULT_TIMES.wake,
  );
  assert.notEqual(
    normalizeTimes({ wake: "08:00", bedtime: "08:00" }).wake,
    normalizeTimes({ wake: "08:00", bedtime: "08:00" }).bedtime,
  );
});
