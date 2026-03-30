import fs from "fs";
const files = ["src/pages/ContactPage.tsx", "src/pages/CoursesPage.tsx", "src/pages/SustainabilityPage.tsx"];
for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  s = s.replace(/getText\(\s*"([^"]+)"\s*,\s*[\s\S]*?\)/g, 'getText("$1")');
  if (s !== orig) fs.writeFileSync(file, s);
}
console.log("ok");
