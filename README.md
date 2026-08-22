# DEV Lean

Repositório canônico de desenvolvimento de produtos da operação LucronomIA Lean.

Este repositório é separado do repositório institucional/editorial `SWtheaven/lucronomia`. Código de produtos comercializáveis, protótipos, V0s, documentação técnica e evolução de aplicações devem ser mantidos aqui.

## Governança

- **Founder:** autoridade final sobre direção e prioridade.
- **LucronomIA Lean:** governança geral do projeto.
- **Comercial / Mercado:** valida problema, oferta, público, preço e evidência de demanda.
- **DEV Lean:** define arquitetura e implementa os produtos aprovados, no mesmo nível de governança da frente Comercial.

## MONETIZAÇÃO-002 — LucronomIA Confirma

Status técnico: **V0 com carteira persistente implementada / credenciais server-side do Mercado Pago pendentes para teste real**.

Promessa:

> **Combinou pelo WhatsApp? Organize e confirme em 30 segundos.**

Oferta pública:

- **5 confirmações — R$ 9,90**;
- **20 confirmações — R$ 24,90** — recomendado;
- **50 confirmações — R$ 49,90**.

Modelo: pagamento único, créditos cumulativos, sem mensalidade e sem expiração.

## Arquitetura atual

- **Supabase PostgreSQL:** wallets, pedidos, ledger de créditos, confirmações e eventos;
- **Supabase Edge Function `confirma`:** frontend + API + integração Mercado Pago;
- **wallet anônima por token aleatório:** somente hash SHA-256 persistido no banco;
- **saldo server-side:** nunca confiado ao frontend;
- **pagamento:** preferência Mercado Pago criada no backend com `external_reference` do pedido;
- **webhook:** validação HMAC `x-signature` + consulta do pagamento na API Mercado Pago antes de creditar;
- **idempotência:** `provider_payment_id` único + ledger único por fonte;
- **consumo:** função SQL transacional por `client_confirmation_id`, consumindo no máximo 1 crédito por documento.

URL prevista da V0:

`https://jxuazdoflabqerkccevi.supabase.co/functions/v1/confirma/`

## Estrutura

```text
.
├── docs/
│   └── MONETIZACAO-002-CONFIRMA-V0.md
├── products/
│   └── confirma/
│       └── README.md
├── supabase/
│   ├── functions/
│   │   └── confirma/
│   │       ├── deno.json
│   │       ├── index.ts
│   │       └── public/
│   │           ├── app.js
│   │           ├── index.html
│   │           └── styles.css
│   └── migrations/
│       └── 20260822_confirma_wallet_credits_v0.sql
├── CHANGELOG.md
└── README.md
```

## Segurança

- não versionar Access Token, Webhook Secret ou outras credenciais;
- `service_role` permanece apenas na Edge Function;
- tabelas do Confirma têm RLS habilitado e acesso `anon/authenticated` revogado;
- quantidade e preço do pacote são lidos do banco, nunca aceitos do cliente como fonte de verdade;
- retorno do checkout não concede créditos;
- somente pagamento `approved`, valor BRL esperado e pedido correspondente podem gerar crédito.

## Bloqueio atual

Para o primeiro teste financeiro real, a Edge Function ainda precisa receber como secrets de runtime:

- `MP_ACCESS_TOKEN`;
- `MP_WEBHOOK_SECRET`.

Esses valores não devem ser commitados nem enviados ao frontend.
