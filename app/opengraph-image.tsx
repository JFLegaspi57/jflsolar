import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "JFL Solar — PV System Solutions. Solar installation, consultancy and equipment supply in the Philippines.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Owner-supplied logo, read once at module scope.
const logo = `data:image/png;base64,${await readFile(join(process.cwd(), "public/brand/jfl-solar-logo.png"), "base64")}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#1f2733", padding: 64 }}>
        <div style={{ display: "flex", background: "#ffffff", borderRadius: 16, padding: 28, alignSelf: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={560} height={161} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ width: 96, height: 8, background: "#ffb004", borderRadius: 4 }} />
          <div style={{ marginTop: 28, fontSize: 54, fontWeight: 800, color: "#ffffff", lineHeight: 1.1 }}>
            Solar installation, consultancy and equipment supply
          </div>
          <div style={{ marginTop: 18, fontSize: 30, color: "#c9d0d9" }}>Serving customers across the Philippines.</div>
        </div>
      </div>
    ),
    size,
  );
}
