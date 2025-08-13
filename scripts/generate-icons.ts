import fs from "fs-extra";
import path from "path";
import chokidar from "chokidar";

// source icons folder
const ICONS_DIR = path.resolve(__dirname, "../shared/icons");

// output folder in frontend/src/generated
const OUTPUT_DIR = path.resolve(__dirname, "../apps/frontend/kmshweb/src/generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "icons.tsx");

// Convert file name to PascalCase (circle-check -> CircleCheck)
function toPascalCase(filename: string) {
    return filename
        .replace(/\.[^/.]+$/, "") // remove extension
        .split(/[-_]/g)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
}

async function generateIconsIndex() {
    try {
        const files = await fs.readdir(ICONS_DIR);
        const iconFiles = files.filter(f => f.endsWith(".svg") || f.endsWith(".png")); // support svg/png

        await fs.ensureDir(OUTPUT_DIR);

        const imports = iconFiles
            .map(f => {
                const name = toPascalCase(f);
                const ext = path.extname(f).toLowerCase();
                const suffix = ext === ".svg" ? "?react" : "";
                return `import ${name} from '@shared/icons/${f}${suffix}';`;
            })
            .join("\n");

        const exports = `export {\n  ${iconFiles.map(f => toPascalCase(f)).join(",\n  ")}\n};\n`;

        const content = `${imports}\n\n${exports}`;

        await fs.writeFile(OUTPUT_FILE, content, "utf8");
        console.log("✅ Icons index generated at", OUTPUT_FILE);
    } catch (err) {
        console.error("Error generating icons index:", err);
    }
}

// Initial run
generateIconsIndex();

// Watch for changes
chokidar.watch(ICONS_DIR, { ignoreInitial: true }).on("all", (_event, _path) => {
    console.log("Detected change in icons folder. Regenerating...");
    generateIconsIndex();
});
