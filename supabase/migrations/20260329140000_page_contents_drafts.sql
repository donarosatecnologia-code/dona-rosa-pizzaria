-- Rascunhos e publicação: edições gravam em *_draft; site público lê apenas colunas publicadas.

alter table public.page_contents
  add column if not exists title_draft text,
  add column if not exists content_draft text,
  add column if not exists image_url_draft text,
  add column if not exists content_published_at timestamptz;

comment on column public.page_contents.title_draft is 'Rascunho do título; visível no admin até publicar.';
comment on column public.page_contents.content_draft is 'Rascunho do conteúdo; visível no admin até publicar.';
comment on column public.page_contents.image_url_draft is 'Rascunho da imagem; visível no admin até publicar.';
comment on column public.page_contents.content_published_at is 'Última publicação do conteúdo publicado.';

-- Copia rascunhos para as colunas publicadas (site). Chamado por admin após confirmação.
create or replace function public.publish_page_contents_drafts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  update public.page_contents
  set
    title = coalesce(title_draft, title),
    content = coalesce(content_draft, content),
    image_url = coalesce(image_url_draft, image_url),
    content_published_at = now(),
    title_draft = null,
    content_draft = null,
    image_url_draft = null,
    updated_at = now()
  where
    title_draft is not null
    or content_draft is not null
    or image_url_draft is not null;
end;
$$;

grant execute on function public.publish_page_contents_drafts() to authenticated;
