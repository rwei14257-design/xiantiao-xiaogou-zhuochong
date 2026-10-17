const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const textTypes = new Set([
  ".js",
  ".json",
  ".md",
  ".html",
  ".css",
  ".yml",
  ".yaml",
]);
const special = new Set([
  ".gitignore",
  ".gitattributes",
  "LICENSE",
  "src/assets/placeholder.svg",
]);
function inspect(files, read) {
  const problems = [];
  for (const file of files) {
    if (
      file.startsWith("assets-local/") ||
      file.startsWith("artifacts/") ||
      file.startsWith("node_modules/")
    )
      problems.push(`${file}: local-only content is tracked`);
    if (!special.has(file) && !textTypes.has(path.extname(file).toLowerCase()))
      problems.push(
        `${file}: file type is not approved for this source-only release`,
      );
    const bytes = read(file);
    if (bytes.length > 1024 * 1024)
      problems.push(`${file}: unexpected file size`);
    const text = bytes.toString("utf8");
    if (/data:image\/[\w.+-]+;base64,[A-Za-z0-9+/=]{200,}/i.test(text))
      problems.push(`${file}: embedded image data requires manual review`);
    if (/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/.test(text))
      problems.push(`${file}: private key detected`);
    if (/\bgh[pousr]_[A-Za-z0-9]{30,}\b/.test(text))
      problems.push(`${file}: potential GitHub credential detected`);
  }
  return problems;
}
if (require.main === module) {
  try {
    const files = execFileSync("git", ["ls-files", "-z"], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\0")
      .filter(Boolean);
    if (!files.length)
      throw new Error(
        "No tracked files: initialize Git and stage the intended public files first.",
      );
    const problems = inspect(files, (name) =>
      fs.readFileSync(path.join(root, name)),
    );
    if (problems.length) throw new Error(problems.join("\n"));
    console.log(
      `PASS: ${files.length} tracked files; no unapproved media or runtime bundles. This is a file check, not a legal guarantee.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { inspect };
