import { promises as fs } from "fs";
import {
  defineConfig,
  presetUno,
  // presetAttributify,
  presetTypography,
} from "unocss";
import type { IconifyJSON } from "@iconify/types";
import presetIcons from "@unocss/preset-icons";
import { compareColors, stringToColor } from "@iconify/utils/lib/colors";
import {
  importDirectory,
  parseColors,
  runSVGO,
  deOptimisePaths,
} from "@iconify/tools";
import transformerDirectives from "@unocss/transformer-directives";

/**
 * Load custom icon set
 */
async function loadCustomIconSet(): Promise<IconifyJSON> {
  // Load icons
  const iconSet = await importDirectory("assets/svg", {
    prefix: "svg",
  });

  // Clean up each icon
  await iconSet.forEach(async (name) => {
    const svg = iconSet.toSVG(name)!;

    // Change color to `currentColor`
    const blackColor = stringToColor("black")!;

    await parseColors(svg, {
      defaultColor: "currentColor",
      callback: (attr, colorStr, color) => {
        // console.log('Color:', colorStr, color);

        // Change black to 'currentColor'
        if (color && compareColors(color, blackColor)) {
          return "currentColor";
        }

        switch (color?.type) {
          case "none":
          case "current":
            return color;
        }

        throw new Error(`Unexpected color "${colorStr}" in attribute ${attr}`);
      },
    });

    // Optimise
    runSVGO(svg);

    // Update paths for compatibility with old software
    await deOptimisePaths(svg);

    // Update icon in icon set
    iconSet.fromSVG(name, svg);
  });

  // Export as IconifyJSON
  return iconSet.export();
}

/**
 * Create UnoCSS config
 */
export function createConfig({ strict = true, dev = true } = {}): any {
  return defineConfig({
    envMode: dev ? "dev" : "build",
    theme: {
      fontFamily: {
        sans: "'Inter', sans-serif",
        mono: "'Fira Code', monospace",
      },
    },
    presets: [
      presetIcons({
        autoInstall: false,
        collections: {
          // Loading IconifyJSON data
          test: async () => {
            const content = await fs.readFile("assets/test.json", "utf8");
            return JSON.parse(content);
          },

          // Loading icon set
          // Moved to a separate function to make it easier to understand and reuse it
          "custom-svg": loadCustomIconSet,
        },
      }),
      presetUno(),
      // presetAttributify(),
      presetTypography(),
    ],
    rules: [
      [
        "inline-icon",
        {
          "vertical-align": "-0.125em",
        },
      ],
      [
        "icon16",
        {
          "font-size": "16px",
          "line-height": "1em",
        },
      ],
      [
        "icon24",
        {
          "font-size": "24px",
          "line-height": "1em",
        },
      ],
    ],
    transformers: [transformerDirectives()],
  });
}

export default createConfig();
