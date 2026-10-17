const fs = require("node:fs");
const path = require("node:path");
const { actions } = require("../src/model");
const root = path.resolve(__dirname, "..");
const icons = {
  hello:
    '<circle cx="48" cy="48" r="16"/><path d="M48 19v-9m0 76v-9M19 48h-9m76 0h-9M27 27l-6-6m54 54-6-6M27 69l-6 6m54-54-6 6"/>',
  heart: '<path d="M48 78 19 49C-1 25 28 8 48 29 68 8 97 25 77 49Z"/>',
  jump: '<path d="m15 72 20-25 14 12 22-38M55 22l18-4 5 19M17 83h64"/>',
  good: '<path d="m48 14 10 21 23 3-17 17 4 25-20-12-22 12 5-25-18-17 24-3Z"/>',
  dance:
    '<path d="M39 67V24l37-8v43M39 35l37-8"/><ellipse cx="27" cy="70" rx="12" ry="8"/><ellipse cx="64" cy="62" rx="12" ry="8"/>',
  eat: '<path d="M13 43h70Q79 78 48 78 17 78 13 43ZM26 86h44M30 30c-10-10 10-12 0-22m18 22c-10-10 10-12 0-22m18 22c-10-10 10-12 0-22"/>',
  read: '<path d="M48 27Q30 13 11 23v54q20-10 37 3 18-13 37-3V23Q64 13 48 27Zm0 0v53M22 36l14 3m-14 12 14 3m25-15 14-3M61 54l14-3"/>',
  sleep:
    '<path d="M65 14a34 34 0 1 0 17 54A35 35 0 0 1 65 14Z"/><path d="M65 34h17L66 50h17M37 11h9l-9 9h9"/>',
  drink:
    '<path d="M23 32h43v32q0 18-21 18T23 64ZM66 40h9q19 15-9 24M34 19V9m14 10V9m14 10V9"/>',
  offwork:
    '<path d="M16 41 48 15l32 26M25 35v48h46V35M40 83V57h16v26M66 16h13v20"/>',
  sleepy:
    '<path d="M32 15c-24 20-18 54 15 65M32 15c-2 31 16 48 45 42M47 80q23 2 30-23M56 20h18L56 37h18M76 7h10l-10 9h10"/>',
  celebrate:
    '<path d="m15 81 14-44 31 30ZM28 39l31 29M48 25l7-15m15 36 16-5M62 27l10-11M36 15l-2-8M79 65l9 5"/><circle cx="81" cy="17" r="4"/>',
};
const strokes = (body) =>
  `<g fill="none" stroke="#768d67" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
fs.mkdirSync(path.join(root, "src/assets/states"), { recursive: true });
fs.mkdirSync(path.join(root, "docs/images"), { recursive: true });
for (const action of actions) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><title>${action.name} · 功能示意，非角色素材</title><rect x="34" y="35" width="172" height="170" rx="40" fill="#edf0e7"/><g transform="translate(72 62)">${strokes(icons[action.id])}</g><text x="120" y="180" text-anchor="middle" fill="#87977a" font-size="12" font-family="sans-serif">等待本地素材</text></svg>`;
  fs.writeFileSync(
    path.join(root, "src/assets/states", `${action.id}.svg`),
    svg + "\n",
  );
}
const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const cards = actions
  .map((a, index) => {
    const x = 32 + (index % 4) * 272,
      y = 154 + Math.floor(index / 4) * 195;
    return `<g transform="translate(${x} ${y})"><rect width="254" height="179" rx="20" fill="#fffefa" stroke="#e0e6d6"/><g transform="translate(16 16) scale(.55)">${strokes(icons[a.id])}</g><text x="85" y="43" class="title">${a.name}</text><text x="85" y="65" class="small">${a.id}</text><text x="20" y="112" class="text">${esc(a.text)}</text><text x="20" y="146" class="small">本地素材：${a.id}.gif / png / webp</text></g>`;
  })
  .join("");
fs.writeFileSync(
  path.join(root, "docs/images/states.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="1136" height="780" viewBox="0 0 1136 780"><style>text{font-family:"Microsoft YaHei",sans-serif}.title{fill:#4e6244;font-size:18px;font-weight:600}.text{fill:#7b866e;font-size:13px}.small{fill:#a1a88f;font-size:11px}</style><rect width="1136" height="780" rx="24" fill="#f5f5ed"/><text x="40" y="57" fill="#45563c" font-size="30" font-family="sans-serif">线条小狗的 12 种日常状态</text><text x="42" y="90" class="text">状态图鉴 · 这些图标用于说明功能，不是替代萌宠，也不是随附的角色动画。</text><text x="42" y="115" class="small">按时间陪伴 / 手动互动 / 两分钟后回到作息 / 本地素材导入</text>${cards}</svg>\n`,
);
const points = [
  ["07:30", "早安见面"],
  ["08:00", "早餐时间"],
  ["10:30", "喝口水吧"],
  ["12:15", "午餐时间"],
  ["12:55", "午后小憩"],
  ["15:00", "下午喝水"],
  ["18:00", "收工快乐"],
  ["18:45", "晚餐时间"],
  ["22:45", "睡前放松"],
  ["23:15", "晚安入睡"],
];
const stops = points
  .map(([time, label], i) => {
    const x = 44 + (i % 5) * 214,
      y = 135 + Math.floor(i / 5) * 142;
    return `<g transform="translate(${x} ${y})"><circle cx="9" cy="0" r="6" fill="#8ca576"/><text x="0" y="38" fill="#4f6745" font-size="25">${time}</text><text x="0" y="66" fill="#87937a" font-size="15">${label}</text></g>`;
  })
  .join("");
fs.writeFileSync(
  path.join(root, "docs/images/day-rhythm.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" width="1136" height="420" viewBox="0 0 1136 420"><rect width="1136" height="420" rx="24" fill="#ecf0e4"/><g font-family="Microsoft YaHei,sans-serif"><text x="40" y="54" fill="#485e3f" font-size="28">让小狗，跟着你的生活节奏走。</text><text x="42" y="84" fill="#8b977d" font-size="13">六个时间可以自己调整；工作日安静专注，周末轻松陪伴。</text><path d="M53 135h856M53 277h856" stroke="#c9d5bd" stroke-width="2"/>${stops}<text x="42" y="389" fill="#8b977d" font-size="12">示例使用默认作息。跨午夜睡眠、电脑唤醒、手动互动恢复均按系统本地时间计算。</text></g></svg>\n`,
);
console.log(
  "Generated 12 state diagrams and 2 documentation illustrations (no third-party character art).",
);
