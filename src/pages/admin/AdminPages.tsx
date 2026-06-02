import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { ADMIN_PAGE_LABELS, ADMIN_PAGE_SLUGS } from "@/pages/admin/adminPageComponents";

export default function AdminPages() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Páginas do site</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Abra a página para editar com o lápis. Salve e coloque no ar na linha de botões abaixo do título. Cardápio em{" "}
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
            <span className="font-medium text-foreground">{ADMIN_PAGE_LABELS[slug] ?? slug}</span>
            <Link to={`/admin/mirror/${slug}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
              Editar espelho <ExternalLink size={14} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
