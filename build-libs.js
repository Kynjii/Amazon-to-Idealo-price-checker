const browserify = require("browserify");
const fs = require("fs");
const path = require("path");

if (!fs.existsSync("libs/packages")) {
    fs.mkdirSync("libs/packages", { recursive: true });
}

const entryContent = `
    const stringComparison = require('string-comparison');
    window.stringComparison = stringComparison;
`;

fs.writeFileSync("temp-entry.js", entryContent);

browserify("temp-entry.js").bundle((err, buf) => {
    if (err) {
        console.error("Browserify error:", err);
        return;
    }

    fs.writeFileSync("libs/packages/string-comparison.js", buf.toString());
    fs.unlinkSync("temp-entry.js");
});
