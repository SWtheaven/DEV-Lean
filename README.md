# DEV Lean

Repositório canônico de desenvolvimento de produtos da operação LucronomIA Lean.

Este repositório é separado do repositório institucional/editorial `SWtheaven/lucronomia`. Código de produtos comercializáveis, protótipos, V0s, documentação técnica e evolução de aplicações devem ser mantidos aqui.

## Governança

- **Founder:** autoridade final sobre direção e prioridade.
- **LucronomIA Lean:** governança geral do projeto.
- **Comercial / Mercado:** valida problema, oferta, público, preço e evidência de demanda.
- **DEV Lean:** define arquitetura e implementa os produtos aprovados, no mesmo nível de governança da frente Comercial.

### Regra de separação

O repositório `SWtheaven/lucronomia` permanece dedicado à marca, conteúdo, documentação institucional/editorial e ativos públicos correspondentes.

O repositório `SWtheaven/DEV-Lean` concentra o desenvolvimento de produtos.

## Produtos

### MONETIZAÇÃO-002 — LucronomIA Confirma

Status técnico: **V0 funcional em hardening/QA / checkout real pendente de configuração**.

Promessa:

> **Combinou pelo WhatsApp? Organize e confirme em 30 segundos.**

Escopo V0:

- landing mobile-first;
- formulário do serviço já combinado;
- resumo profissional;
- checkout externo via **Mercado Pago — Link de Pagamento**;
- PDF client-side;
- mensagem pronta para WhatsApp;
- sem login;
- sem banco;
- sem IA;
- sem backend obrigatório.

Código: [`products/confirma/`](products/confirma/)

Documentação: [`docs/MONETIZACAO-002-CONFIRMA-V0.md`](docs/MONETIZACAO-002-CONFIRMA-V0.md)

## Estrutura

```text
.
├── docs/
│   └── MONETIZACAO-002-CONFIRMA-V0.md
├── products/
│   └── confirma/
│       ├── app.js
│       ├── config.js
│       ├── index.html
│       └── styles.css
├── CHANGELOG.md
└── README.md
```

## Segurança

- não versionar tokens, segredos, chaves privadas ou credenciais;
- checkout deve ser configurado apenas com URL pública HTTPS do Mercado Pago;
- nenhuma credencial financeira deve entrar no frontend;
- não implementar API de pagamento, billing próprio ou assinatura na V0;
- custo zero ou free tier é preferido enquanto houver solução tecnicamente adequada.
