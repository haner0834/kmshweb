import fs from "fs-extra";
import path from "path";
import chokidar from "chokidar";

// source icons folder
const ICONS_DIR = path.resolve(__dirname, "../shared/icons");

// output folder in frontend/src/generated
const OUTPUT_DIR = path.resolve(__dirname, "../apps/frontend/kmshweb/src/generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "icons.tsx");

function toPascalCase(filename: string) {
    return filename
        .replace(/\.[^/.]+$/, "")
        .split(/[-_]/g)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
}

async function generateIconsIndex() {
    try {
        const files = await fs.readdir(ICONS_DIR);
        const iconFiles = files.filter((f) => f.endsWith(".svg") || f.endsWith(".png"));

        await fs.ensureDir(OUTPUT_DIR);

        const imports = iconFiles
            .map((f) => {
                const name = toPascalCase(f);
                const ext = path.extname(f).toLowerCase();
                if (ext === ".svg") {
                    // SVG: lazy component
                    return `export const ${name} = React.lazy(() => import('@shared/icons/${f}?react'));`;
                } else {
                    // PNG: just export string URL
                    return `export { default as ${name} } from '@shared/icons/${f}';`;
                }
            })
            .join("\n");

        const content = `import React from "react";\n\n${imports}\n`;

        await fs.writeFile(OUTPUT_FILE, content, "utf8");
        console.log("✅ Icons index generated at", OUTPUT_FILE);
    } catch (err) {
        console.error("Error generating icons index:", err);
    }
}

generateIconsIndex();

chokidar.watch(ICONS_DIR, { ignoreInitial: true }).on("all", () => {
    console.log("Detected change in icons folder. Regenerating...");
    generateIconsIndex();
});
