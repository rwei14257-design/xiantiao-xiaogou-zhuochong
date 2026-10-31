const fs = require("node:fs");
const path = require("node:path");

function writeSettings(filename, settings) {
  const content = JSON.stringify(settings, null, 2);
  const temporary = filename + ".tmp";
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  try {
    fs.writeFileSync(temporary, content, "utf8");
    // Replace only after the complete JSON has been written in the same directory.
    fs.renameSync(temporary, filename);
  } finally {
    try {
      fs.rmSync(temporary, { force: true });
    } catch {
      // Preserve the original write/rename error; a leftover temp file is harmless.
    }
  }
}

module.exports = { writeSettings };
