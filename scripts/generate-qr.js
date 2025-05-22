/* eslint-disable no-console ---------------------------------------------- */
/*  0. ENV ­──────────────────────────────────────────────────────────────── */
require("dotenv").config();

/*  1. DOM & canvas polyfill (qr-code-styling-node, Node ≥20) ­──────────── */
const { JSDOM } = require("jsdom");
const {
  Canvas, createCanvas,
  CanvasRenderingContext2D, Image, ImageData
} = require("@napi-rs/canvas");

const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.window   = dom.window;
global.document = dom.window.document;
global.self     = global;
dom.window.navigator = { userAgent: "node.js" };

global.HTMLCanvasElement = class extends Canvas {
  constructor(w = 300, h = 150) { return createCanvas(w, h); }
};
const orig = dom.window.document.createElement.bind(dom.window.document);
dom.window.document.createElement = (t) =>
  t.toLowerCase() === "canvas" ? createCanvas(300, 150) : orig(t);

global.CanvasRenderingContext2D = CanvasRenderingContext2D;
global.Image     = Image;
global.ImageData = ImageData;

/*  2. Libs ­────────────────────────────────────────────────────────────── */
const QRCodeStyling     = require("qr-code-styling-node");
const sharp             = require("sharp");
const path              = require("node:path");
const fs                = require("node:fs/promises");
const { createClient }  = require("@supabase/supabase-js");
const { parse: json2csv } = require("json2csv");

/*  3. Geometry & paths ­────────────────────────────────────────────────── */
const FINAL = 800;        /* finished PNG */
const QR    = 560;        /* real square QR (fits with quiet-zone) */
const MARGIN = (FINAL - QR) / 2;   /* 120 px on all sides */
const OUT_DIR = path.resolve("public/qr");
const CSV     = "qr_manifest.csv";

/*  4. Colours (fallbacks; DB overrides) ­───────────────────────────────── */
const DEF_BG = "#9eaf81";   /* light fill */
const DEF_FG = "#1f1f1f";   /* dark modules / ring */

/*  5. Supabase ­────────────────────────────────────────────────────────── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/*  6. SVG helpers ­─────────────────────────────────────────────────────── */
const svgCircle = (fill, stroke, w = 4) =>
  Buffer.from(`<svg width="${FINAL}" height="${FINAL}">
    <circle cx="${FINAL / 2}" cy="${FINAL / 2}" r="${FINAL / 2 - w / 2}"
            ${fill   ? `fill="${fill}"`   : 'fill="none"'}
            ${stroke ? `stroke="${stroke}" stroke-width="${w}"` : ""}/>
  </svg>`);

/*  7. Decorative dots layer (annulus only) ­────────────────────────────── */
function makeDecorativeDots(col) {
  const DOT_R   = 5;                 // px
  const STEP    = 14;                // dot grid spacing
  const INNER   = MARGIN - 2;        // start just outside QR quiet-zone
  const R2_MAX  = (FINAL / 2 - DOT_R) ** 2;

  let circles = "";
  for (let y = DOT_R; y < FINAL; y += STEP) {
    for (let x = DOT_R; x < FINAL; x += STEP) {
      /* inside outer circle? */
      const dx = x - FINAL / 2, dy = y - FINAL / 2;
      if (dx * dx + dy * dy > R2_MAX) continue;

      /* outside expanded square? */
      if (
        x >= INNER && x <= FINAL - INNER &&
        y >= INNER && y <= FINAL - INNER
      ) continue;  // belongs to QR zone, skip

      /* random sparsening to avoid perfect grid look */
      if (Math.random() < 0.45) continue;

      circles += `<circle cx="${x}" cy="${y}" r="${DOT_R}" />`;
    }
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"
         width="${FINAL}" height="${FINAL}" fill="${col}">${circles}</svg>`);
}

/*  8. Build ­────────────────────────────────────────────────────────────── */
(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const { data: rows, error } = await supabase
    .from("tennis_facilities")
    .select("slug, qr_bg_hex, qr_fg_hex, court_count")
    .order("slug");
  if (error) throw error;
  if (!rows.length) throw new Error("no facilities returned");

  const manifest = [];

  for (const row of rows) {
    const bg = row.qr_bg_hex || DEF_BG;
    const fg = row.qr_fg_hex || DEF_FG;
    const url = `https://firstserveseattle.com/q/${row.slug}`;

    /* 8.1  generate square QR (transparent background) */
    const qr = new QRCodeStyling({
      width: QR,
      height: QR,
      data: url,
      qrOptions: { errorCorrectionLevel: "H", margin: 4 },
      dotsOptions: { color: fg, type: "dots" },
      backgroundOptions: { color: "transparent" }
    });
    const qrBuf = await qr.getRawData("png");

    /* 8.2  compose: filled circle, QR, decorative dots, outline */
    const final = await sharp({
      create: {
        width: FINAL,
        height: FINAL,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([
        { input: svgCircle(bg) },
        { input: qrBuf, top: MARGIN, left: MARGIN },
        { input: makeDecorativeDots(fg) },
        { input: svgCircle("none", fg, 4) }
      ])
      .png()
      .toBuffer();

    const file = `${row.slug}.png`;
    await fs.writeFile(path.join(OUT_DIR, file), final);
    console.log("✓", file);

    manifest.push({
      slug: row.slug,
      file,
      copies: row.court_count ?? 0
    });
  }

  await fs.writeFile(
    CSV,
    json2csv(manifest, { fields: ["slug", "file", "copies"] }),
    "utf8"
  );
  console.log("→", CSV, "written");
})();