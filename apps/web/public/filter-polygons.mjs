import { readFileSync, writeFileSync } from "fs";

const input = JSON.parse(readFileSync("public/sel-pj.geojson", "utf8"));

const filtered = {
    ...input,
    features: input.features.filter(
        (f) =>
            f.geometry.type === "Polygon" ||
            f.geometry.type === "MultiPolygon"
    ),
};

writeFileSync("public/sel-pj-polygons.geojson", JSON.stringify(filtered, null, 2));

console.log(
    `✅ Done! ${filtered.features.length} polygon features written to public/sel-pj-polygons.geojson`
);
filtered.features.forEach((f) =>
    console.log(" -", f.properties.name || "(no name)", `[${f.geometry.type}, al=${f.properties.admin_level || "?"}]`)
);
