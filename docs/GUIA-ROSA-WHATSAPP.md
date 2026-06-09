# Guia da Rosa — WhatsApp no painel

Este guia é para usar o painel **sem termos técnicos**. Enquanto a Meta analisa o aplicativo, você já pode preparar contatos, modelos e campanhas em modo de teste.

## O que já funciona agora

| Menu | Para quê |
|------|----------|
| **Contatos** | Importar lista de clientes (CSV/Excel) |
| **Templates** | Criar modelos de mensagem (rascunho) |
| **Promoções** | Montar campanhas e simular disparo |
| **Mensagens** | Ver conversas (mensagens reais só após aprovação Meta) |

## 1. Importar clientes

1. Abra **Contatos** → **Importar clientes**.
2. Use arquivo `.csv` ou `.xlsx` com coluna **TELEFONE1** (ou `telefone`).
3. Marque a caixa de confirmação LGPD — **obrigatório** para poder enviar campanhas depois.
4. Revise o resumo: importados, duplicados e erros.

**Dica:** no Excel, formate a coluna de telefone como **Texto** antes de colar os números.

## 2. Criar um modelo (template)

1. Abra **Templates** → **Novo modelo**.
2. Escreva a mensagem como no WhatsApp (use `{{1}}` para nome do cliente, se precisar).
3. Salve como rascunho.
4. Quando a Meta aprovar o app, você poderá **enviar para aprovação** na Meta.

Modelo sugerido para testes (homologação):

```
Olá! Esta é uma mensagem de teste da Dona Rosa Pizzaria.
Por favor, ignore — estamos homologando nosso sistema. 🍕
```

Nome sugerido: `teste_homologacao_dona_rosa`

## 3. Criar uma campanha (Promoções)

1. Abra **Promoções** → **Nova campanha**.
2. Escolha um modelo **aprovado** (quando houver) e a **fila** de destinatários.
3. Clique em **Publicar** no rascunho.
4. Ao **Disparar**, o sistema mostra:
   - quantas mensagens serão enviadas;
   - custo estimado (R$ 0,35 × contatos);
   - aviso de que a cobrança é na conta Meta.

**Fila Homologação QA:** use só para testes com 3 números da equipe antes de mandar para todos os clientes.

1. Importe os 3 números de teste (com checkbox LGPD marcado).
2. Em cada contato, toque em **Usar em homologação**.
3. Na campanha, escolha a fila **Homologação QA**.

## 4. Ver resultados

1. Em **Promoções**, abra **Ver relatório** da campanha.
2. Veja enviados, entregues, respostas e gráfico.
3. Use **Exportar CSV** para baixar as respostas da pesquisa.

## 5. Conectar o WhatsApp (quando a Meta aprovar)

Siga o guia [COEXISTENCIA-ROSA-E-PC.md](./COEXISTENCIA-ROSA-E-PC.md) — **sessão em dupla** (você no celular + Janaina no computador).

Até lá:

- Atenda clientes **normalmente pelo celular**.
- Não tente conectar sozinha pelo QR — aguarde o aviso da Janaina.

## Perguntas frequentes

**Por que o disparo não envia para contatos importados?**  
É preciso marcar a confirmação LGPD na importação, ou o cliente precisa aceitar os termos pelo WhatsApp.

**O que é opt-out?**  
Cliente que pediu para não receber mensagens. Ele some dos disparos automaticamente.

**Posso cancelar um disparo no meio?**  
Não. Por isso o sistema pede confirmação antes de enviar.

## Quem chamar

Dúvidas técnicas ou quando a Meta liberar a conexão: **Janaina**.
