const fs = require("fs");
const path = require("path");

const { Reporter } = require("@parcel/plugin");

module.exports = new Reporter({
    async report({ event }) {
        if (event.type != "buildSuccess") return;
        const distPath = path.join(...__filename.split(path.sep).slice(0, -2), "dist");
        for (const relPath of fs.readdirSync(distPath, { recursive: true })) {
            const absPath = path.join(distPath, relPath);
            if (fs.lstatSync(absPath).isDirectory()) continue;
            const code = fs.readFileSync(absPath).toString();
            fs.writeFileSync(absPath, code.replaceAll("Object.hasOwn(", "Object.prototype.hasOwnProperty.call("));
        }
    }
});
