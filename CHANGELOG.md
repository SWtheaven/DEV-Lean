# Changelog

Mudanças relevantes de produtos e baseline técnica do DEV Lean.

## 2026-08-22

### MONETIZAÇÃO-002 — LucronomIA Confirma

#### Added

- carteira persistente server-side por token seguro;
- pacotes `PACKAGE_5`, `PACKAGE_20` e `PACKAGE_50`;
- ledger de créditos com fonte idempotente;
- pedidos Mercado Pago vinculados à wallet e ao pacote;
- Edge Function `confirma` com frontend e API;
- confirmação de pagamento preparada por webhook Mercado Pago;
- validação HMAC `x-signature`;
- consulta server-side do pagamento antes de creditar;
- finalização atômica/idempotente por documento;
- persistência do conteúdo de confirmações finalizadas;
- instrumentação de eventos no Supabase;
- migration versionada em `supabase/migrations/20260822_confirma_wallet_credits_v0.sql`;
- links Mercado Pago registrados por pacote em `confirma_packages.static_checkout_url` e versionados em `supabase/migrations/20260822_confirma_static_checkout_links.sql`:
  - `PACKAGE_5` → `https://mpago.la/2Lx9LMH`;
  - `PACKAGE_20` → `https://mpago.la/2h6RnfF`;
  - `PACKAGE_50` → `https://mpago.la/141bUc2`.

#### Changed

- modelo comercial alterado para créditos cumulativos;
- oferta pública: 5 por R$9,90; 20 por R$24,90; 50 por R$49,90;
- pacote de 20 confirmações destacado como recomendado;
- links estáticos `mpago.la` passam a ser metadados oficiais dos pacotes, mas não são considerados prova de pagamento nem fonte de crédito automático;
- checkout automático continua exigindo pedido interno + preferência Mercado Pago dinâmica para vincular wallet/pedido/pacote com segurança;
- runtime canônico movido para `supabase/functions/confirma/`;
- código estático pré-créditos removido de `products/confirma/` para evitar duas fontes de verdade.

#### QA

- cenário saldo zero bloqueando finalização: aprovado;
- pacote de 5: saldo 0 → 5: aprovado;
- primeiro documento: 5 → 4: aprovado;
- retry do mesmo documento sem novo consumo: aprovado;
- segundo documento: 4 → 3: aprovado;
- retry do mesmo pagamento sem nova carga: aprovado;
- pacote de 20 acumulado sobre saldo 3 → 23: aprovado;
- pacote de 50 → saldo 50: aprovado;
- manipulação client-side de quantidade ignorada pelo servidor: aprovado;
- mapeamento dos três links Mercado Pago conferido diretamente no PostgreSQL.

#### Pending

- configurar `MP_ACCESS_TOKEN` como secret da Edge Function;
- configurar `MP_WEBHOOK_SECRET` como secret da Edge Function;
- configurar/validar Webhook de pagamentos no Mercado Pago;
- smoke test HTTP externo do runtime em dispositivo real;
- compra real de R$9,90;
- PDF e WhatsApp em dispositivo real;
- somente após isso avaliar `READY FOR REAL PURCHASE TEST` / `READY FOR SALES` conforme gates de governança.
