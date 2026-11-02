const { test } = require("node:test"),
  assert = require("node:assert/strict");
const {
  companionActivity,
  nextSurprise,
  surprises,
} = require("../src/companion");
const { getActivity, DEFAULT_TIMES } = require("../src/schedule");
const now = +new Date("2026-11-02T09:15:00"),
  settings = { auto: true, music: true, times: DEFAULT_TIMES, action: "hello" };
const base = getActivity(new Date(now), settings);
const compose = (activity, patch = {}) =>
  companionActivity(activity, {
    now,
    music: true,
    media: "playing",
    focusUntil: 0,
    ...patch,
  });
test("Playback starts dance; pause and disabled detection restore the underlying schedule", () => {
  assert.equal(compose(base).action, "dance");
  for (const media of ["idle", "unavailable", "off"])
    assert.equal(compose(base, { media }), base);
  assert.equal(compose(base, { music: false }), base);
  const sleep = getActivity(new Date("2026-11-02T01:00:00"), settings);
  assert.equal(compose(sleep), sleep);
  const fixed = getActivity(new Date(now), { ...settings, auto: false });
  assert.equal(compose(fixed), fixed);
});
test("Brief reactions take priority over focus and music; an expired focus session releases dance", () => {
  const manual = getActivity(new Date(now), settings, {
    action: "heart",
    until: now + 5000,
    effect: "hearts",
  });
  assert.equal(compose(manual, { focusUntil: now + 1000 }), manual);
  assert.equal(compose(base, { focusUntil: now + 1 }).mode, "focus");
  assert.equal(compose(base, { focusUntil: now }).mode, "music");
});
test("Each surprise maps to a valid action and the previous effect is excluded", () => {
  const ids = require("../src/model").actions.map((x) => x.id);
  for (const s of surprises) {
    assert(ids.includes(s.action));
    for (const r of [0, 0.49, 0.99])
      assert.notEqual(nextSurprise(s.effect, () => r).effect, s.effect);
  }
});
