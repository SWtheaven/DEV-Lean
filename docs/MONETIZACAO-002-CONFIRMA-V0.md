# MONETIZAÇÃO-002 — LucronomIA Confirma V0

Status: **GO V0 / hardening e QA — checkout configurado**

Nome anterior: **LucronomIA Fechou**. Renomeado em 2026-08-22 antes de READY FOR SALES.

## Objetivo

Validar se prestadores de serviço pagam **R$ 9,90 em pagamento único** para organizar um serviço já combinado pelo WhatsApp em um resumo profissional, PDF e mensagem pronta de confirmação.

Promessa: **“Combinou pelo WhatsApp? Organize e confirme em 30 segundos.”**

O produto não cria orçamento, não interpreta conversas e não promete efeito jurídico automático.

## Escopo implementado

- landing mobile-first;
- formulário com os campos mínimos aprovados;
- resumo profissional antes do checkout;
- checkout externo configurável;
- liberação simples após retorno do checkout;
- PDF gerado no navegador, sem serviço externo;
- mensagem pronta para WhatsApp por `wa.me`;
- sem login;
- sem banco de dados;
- sem IA;
- sem backend;
- sem assinatura ou recorrência.

## Arquitetura

Aplicação estática em `products/confirma/`:

- `index.html` — landing, formulário, resumo e fluxo de compra;
- `styles.css` — layout mobile-first seguindo a baseline visual aprovada;
- `app.js` — validação, preview, PDF, WhatsApp e instrumentação;
- `config.js` — preço, provider, URL do checkout e endpoint opcional de analytics.

## Checkout V0

Provider decidido: **Mercado Pago — Link de Pagamento**.

Preço: **R$ 9,90 pagamento único**.

URL configurada em 2026-08-22:

`https://mpago.la/1RjBkzr`

Não implementar nesta V0:

- API de pagamentos;
- billing próprio;
- assinatura;
- planos;
- webhook apenas para justificar arquitetura mais complexa antes da validação.

A aplicação não contém token de pagamento nem credencial privada.

Nesta V0, após abrir o checkout, o comprador retorna à página e declara que concluiu o pagamento para liberar PDF e WhatsApp. A confirmação financeira oficial permanece no Mercado Pago. Não há validação automática do pagamento nesta fase.

### Limitação conhecida

A liberação pós-checkout é client-side e não é um mecanismo antifraude. Isso é um trade-off explícito de velocidade/custo para a validação inicial. Havendo sinal real de vendas, a V1 deve reavaliar confirmação automática antes de ampliar tráfego.

## Instrumentação

Eventos emitidos:

- `landing_view`;
- `cta_start_click`;
- `form_start`;
- `form_complete`;
- `checkout_click`;
- `payment_return_declared`;
- `pdf_generated`;
- `whatsapp_click`;
- `edit_click`.

Os eventos são mantidos localmente no navegador e enviados para `window.dataLayer`. `analyticsEndpoint` permite POST opcional para coleta central. O evento financeiro de pagamento confirmado é medido no Mercado Pago na V0.

## Critérios de READY FOR SALES

A V0 só pode receber status **READY FOR SALES** após:

1. URL HTTPS real do Link de Pagamento Mercado Pago de R$ 9,90 configurada — **concluído**;
2. pagamento real de teste concluído e comprovado no Mercado Pago;
3. retorno ao produto validado após checkout;
4. PDF gerado e aberto corretamente em dispositivo real;
5. mensagem de WhatsApp aberta/preenchida corretamente em dispositivo real;
6. responsividade revisada em mobile;
7. textos finais aprovados;
8. ausência de referências ao nome anterior na experiência pública.

## Custo de infraestrutura

**R$ 0 incremental** usando hospedagem estática/free tier.

Taxas transacionais do Mercado Pago são custos por venda, não mensalidade de infraestrutura, e devem ser consideradas na margem comercial.
