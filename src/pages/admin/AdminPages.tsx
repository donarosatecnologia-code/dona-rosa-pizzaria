import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { ADMIN_PAGE_SLUGS } from "@/pages/admin/adminPageComponents";

const labels: Record<string, string> = {
  home: "Home",
  "quem-somos": "Quem Somos",
  espacos: "Espaços",
  "cursos-e-eventos": "Cursos e Eventos",
  "saude-e-sustentabilidade": "Saúde e Sustentabilidade",
  contato: "Contato",
  "politica-privacidade": "Política de Privacidade",
  "termos-de-uso": "Termos de Uso",
};

export default function AdminPages() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Páginas</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Abra o espelho da página para editar com o mesmo layout do site. O público só vê conteúdo após publicar na barra superior. O cardápio de produtos é gerido em{" "}
          <Link to="/admin/cardapio" className="font-medium text-primary hover:underline">
            Cardápio
          </Link>
          .
        </p>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        <li className="flex items-center justify-between gap-4 p-4">
          <span className="font-medium text-foreground">Cardápio (produtos e categorias)</span>
          <Link to="/admin/cardapio" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Gerenciar <ExternalLink size={14} />
          </Link>
        </li>
        {ADMIN_PAGE_SLUGS.map((slug) => (
          <li key={slug} className="flex items-center justify-between gap-4 p-4">
            <span className="font-medium text-foreground">{labels[slug] ?? slug}</span>
            <Link to={`/admin/mirror/${slug}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
              Editar espelho <ExternalLink size={14} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
