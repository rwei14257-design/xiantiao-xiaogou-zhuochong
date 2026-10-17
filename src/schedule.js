const DEFAULT_TIMES = Object.freeze({
  wake: "07:30",
  breakfast: "08:00",
  lunch: "12:15",
  offwork: "18:00",
  dinner: "18:45",
  bedtime: "23:15",
});
const TIME_LABELS = {
  wake: "起床",
  breakfast: "早餐",
  lunch: "午餐",
  offwork: "下班",
  dinner: "晚餐",
  bedtime: "睡觉",
};
const MANUAL_HOLD_MS = 2 * 60 * 1000;
function minutes(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
function clock(value) {
  const m = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function normalizeTimes(input = {}) {
  const result = { ...DEFAULT_TIMES };
  if (input && typeof input === "object")
    for (const key of Object.keys(result))
      if (
        typeof input[key] === "string" &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input[key])
      )
        result[key] = input[key];
  if (result.wake === result.bedtime)
    result.bedtime = clock(minutes(result.wake) - 480);
  return result;
}
function inWindow(now, start, duration) {
  return (now - start + 1440) % 1440 < duration;
}
function eventsFor(times, weekend = false) {
  const t = normalizeTimes(times),
    wake = minutes(t.wake),
    bed = minutes(t.bedtime);
  return [
    {
      id: "sleep",
      title: "晚安入睡",
      action: "sleep",
      start: bed,
      duration: (wake - bed + 1440) % 1440,
      priority: 100,
      text: "小狗睡着啦。愿你今晚也睡个好觉。",
    },
    {
      id: "winddown",
      title: "睡前放松",
      action: "sleepy",
      start: (bed - 30 + 1440) % 1440,
      duration: 30,
      priority: 90,
      text: "给今天收个尾，慢慢准备休息。",
    },
    {
      id: "wake",
      title: "早安见面",
      action: "hello",
      start: wake,
      duration: 20,
      priority: 80,
      text: "早安，新的一天一起开始。",
    },
    {
      id: "breakfast",
      title: "早餐时间",
      action: "eat",
      start: minutes(t.breakfast),
      duration: 30,
      priority: 70,
      text: "先吃点早餐，再出发。",
    },
    {
      id: "lunch",
      title: "午餐时间",
      action: "eat",
      start: minutes(t.lunch),
      duration: 40,
      priority: 70,
      text: "暂停一下，午饭要好好吃。",
    },
    {
      id: "dinner",
      title: "晚餐时间",
      action: "eat",
      start: minutes(t.dinner),
      duration: 40,
      priority: 70,
      text: "晚饭时间到，给自己补充能量。",
    },
    {
      id: "nap",
      title: "午后小憩",
      action: "sleep",
      start: (minutes(t.lunch) + 40) % 1440,
      duration: 20,
      priority: 60,
      text: "闭目歇一会儿，小狗陪你充充电。",
    },
    {
      id: "offwork",
      title: weekend ? "傍晚放松" : "下班快乐",
      action: "offwork",
      start: minutes(t.offwork),
      duration: 30,
      priority: 50,
      text: weekend
        ? "留一点时间，做自己喜欢的事。"
        : "今天辛苦啦，准备收工吧。",
    },
    {
      id: "drink-am",
      title: "上午喝水",
      action: "drink",
      start: 10 * 60 + 30,
      duration: 10,
      priority: 40,
      text: "喝口水，让眼睛也休息一下。",
    },
    {
      id: "drink-pm",
      title: "下午喝水",
      action: "drink",
      start: 15 * 60,
      duration: 10,
      priority: 40,
      text: "下午好，别忘了补充水分。",
    },
  ];
}
function scheduleState(date, times) {
  const t = normalizeTimes(times),
    m = date.getHours() * 60 + date.getMinutes();
  const weekend = [0, 6].includes(date.getDay());
  const events = eventsFor(t, weekend);
  let current = events
    .filter((e) => inWindow(m, e.start, e.duration))
    .sort((a, b) => b.priority - a.priority)[0];
  if (
    !current &&
    !weekend &&
    m >= 9 * 60 &&
    m < minutes(t.offwork) &&
    date.getMinutes() >= 55
  )
    current = {
      id: "stretch",
      title: "整点前伸展",
      action: "jump",
      start: Math.floor(m / 60) * 60 + 55,
      duration: 5,
      text: "起来伸伸懒腰，活动一下肩膀。",
    };
  if (!current) {
    const leisure = weekend || m >= minutes(t.offwork) || m < 9 * 60;
    current = {
      id: leisure ? "leisure" : "focus",
      title: leisure ? "轻松陪伴" : "安静专注",
      action: leisure ? "hello" : "read",
      start: null,
      duration: null,
      text: leisure
        ? "不用赶路，小狗陪你慢慢来。"
        : "你专心做事，小狗安静陪着。",
    };
  }
  return { current, events, weekend, m };
}
function getSchedule(date, times) {
  const { current, events, weekend, m } = scheduleState(date, times);
  const boundaries = new Set([0, 540]);
  for (let h = 0; h < 24; h++) {
    boundaries.add(h * 60);
    boundaries.add(h * 60 + 55);
  }
  for (const e of events) {
    boundaries.add(e.start);
    boundaries.add((e.start + e.duration) % 1440);
  }
  const candidates = [...boundaries]
    .map((minute) => (minute - m + 1440) % 1440 || 1440)
    .sort((a, b) => a - b);
  let next;
  for (const delta of candidates) {
    const future = new Date(date);
    future.setSeconds(0, 0);
    future.setMinutes(future.getMinutes() + delta);
    const state = scheduleState(future, times).current;
    if (state.id !== current.id) {
      next = {
        title: state.title,
        time: clock(m + delta),
        tomorrow: m + delta >= 1440,
      };
      break;
    }
  }
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return {
    ...current,
    key: `${day}:${current.id}`,
    timeLabel:
      current.start === null
        ? "日常陪伴"
        : `${clock(current.start)}–${clock(current.start + current.duration)}`,
    next: next || { title: current.title, time: clock(m), tomorrow: true },
    timeline: events
      .slice()
      .sort((a, b) => a.start - b.start)
      .map((e) => ({
        id: e.id,
        title: e.title,
        action: e.action,
        time: clock(e.start),
        end: clock(e.start + e.duration),
      })),
    weekend,
  };
}
function getActivity(date, settings, manual = null) {
  const scheduled = getSchedule(date, settings.times);
  if (!settings.auto)
    return {
      ...scheduled,
      action: settings.action,
      id: "fixed",
      key: `fixed:${settings.action}`,
      title: "固定动作",
      mode: "fixed",
      text: null,
      until: null,
    };
  if (manual && Number.isFinite(manual.until) && date.getTime() < manual.until)
    return {
      ...scheduled,
      action: manual.action,
      id: "manual",
      key: `manual:${manual.action}:${manual.until}`,
      title: "互动中 · 稍后回到作息",
      mode: "manual",
      text: null,
      until: manual.until,
    };
  return { ...scheduled, mode: "schedule", until: null };
}
module.exports = {
  DEFAULT_TIMES,
  TIME_LABELS,
  MANUAL_HOLD_MS,
  minutes,
  clock,
  normalizeTimes,
  inWindow,
  eventsFor,
  getSchedule,
  getActivity,
};
