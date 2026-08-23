# Changelog

Mudanças relevantes de produtos e baseline técnica do DEV Lean.

## 2026-08-23

### MONETIZAÇÃO-002 — LucronomIA Confirma

#### Changed

- PDF final redesenhado com hierarquia comercial profissional, mantendo o documento como `resumo do combinado`, não orçamento ou contrato;
- A4 com margens consistentes, cabeçalho compacto, referência da confirmação e data de geração;
- serviço acordado passa a ser o título principal do documento;
- prestador e cliente separados em blocos de identificação;
- valor, forma de pagamento e prazo reunidos em faixa de leitura rápida;
- entrada/sinal, detalhes e observações recebem hierarquia própria;
- rodapé contém branding, paginação e disclaimer jurídico limitado;
- renderer dedicado adicionado em `supabase/functions/confirma/public/pdf-professional.js`, substituindo apenas a ação de download do PDF sem alterar wallet, checkout, créditos ou finalização.

#### QA

- PDF de exemplo renderizado em A4 sem clipping, sobreposição ou caracteres quebrados;
- cenário normal validado em 1 página;
- cenário de texto longo validado em 2 páginas com cabeçalho de continuação e rodapé preservados;
- `pdf-professional.js` publicado via GitHub Pages e validado com HTTP 200.

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
- código estático pré-créditos removido de `products/confirma/` para evitar duas fontes de verdade;
- normalização de rota da Edge Function corrigida para aceitar tanto pathname completo do gateway quanto pathname já recortado pelo runtime Supabase;
- Edge Function `confirma` redeployada como versão 6 com assets estáticos incluídos.

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
- mapeamento dos três links Mercado Pago conferido diretamente no PostgreSQL;
- smoke interno Supabase: `POST /api/wallet` → HTTP 201;
- smoke interno Supabase: `GET /api/packages` → HTTP 200 com 3 pacotes;
- smoke interno Supabase: `POST /api/checkout` para `PACKAGE_5` → HTTP 200;
- preferência real Mercado Pago criada com checkout em `www.mercadopago.com.br`;
- pedido de smoke persistido como `PACKAGE_5`, `990` centavos, `5` créditos, status `pending`, com preferência do provider vinculada;
- `MP_ACCESS_TOKEN` confirmado carregado e válido por criação real de preferência;
- `MP_WEBHOOK_SECRET` confirmado carregado: assinatura propositalmente inválida foi rejeitada com HTTP 401 `INVALID_WEBHOOK_SIGNATURE`;
- extensão PostgreSQL `http` foi habilitada somente para QA interno e removida após o teste.

#### Pending

- compra real deliberada de R$9,90;
- confirmação de webhook real `payment approved`;
- validação de crédito real `0 → 5`;
- finalização de um documento real `5 → 4`;
- PDF em dispositivo real;
- WhatsApp em dispositivo real;
- fechar/reabrir e confirmar persistência do saldo em `4`;
- somente após isso liberar `READY FOR SALES`.

#### Gate atual

`READY FOR REAL PURCHASE TEST`
