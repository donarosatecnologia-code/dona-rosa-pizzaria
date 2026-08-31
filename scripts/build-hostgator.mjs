import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor >= 26) {
  console.warn(
    `Aviso: Node ${process.version} detectado. Prefira Node 22 LTS (nvm use / .nvmrc).`,
  );
}

if (!existsSync(".env")) {
  console.error(
    "Erro: arquivo .env não encontrado. Copie .env.example e preencha VITE_* antes do build.",
  );
  process.exit(1);
}

process.env.VITE_PUBLIC_SITE_URL =
  process.env.VITE_PUBLIC_SITE_URL || "https://donarosapizzaria.com.br";

console.log(
  `→ Build com Node ${process.version} e VITE_PUBLIC_SITE_URL=${process.env.VITE_PUBLIC_SITE_URL}`,
);
console.log(
  "  (pode levar 20–60s; não interrompa enquanto aparecer 'transforming...')",
);

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCmd, ["run", "build"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const htaccess = path.join("dist", ".htaccess");
if (!existsSync(htaccess)) {
  console.error("Erro: dist/.htaccess não encontrado. Verifique public/.htaccess");
  process.exit(1);
}

copyFileSync(htaccess, path.join("dist", "hostgator-htaccess.txt"));

console.log("");
console.log("✓ Build pronto em dist/");
console.log("");
console.log("Upload na HostGator (public_html/):");
console.log("  1. Envie TODO o conteúdo de dist/ (index.html, assets/, etc.)");
console.log("  2. Confirme .htaccess na raiz — FTP: ative 'mostrar arquivos ocultos'");
console.log("  3. Se .htaccess não subir: no cPanel, renomeie hostgator-htaccess.txt → .htaccess");
console.log("  4. Teste https://donarosapizzaria.com.br/spa-deploy-marker.txt (confirma upload)");
console.log("");
console.log("URLs para verificação Meta:");
console.log("  https://donarosapizzaria.com.br/politica-de-privacidade");
console.log("  https://donarosapizzaria.com.br/termos-de-uso");
