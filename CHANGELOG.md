# Changelog

Mudanças relevantes de produtos e baseline técnica do DEV Lean.

## 2026-08-22

### Added

- definição do `SWtheaven/DEV-Lean` como repositório canônico de desenvolvimento de produtos;
- migração da MONETIZAÇÃO-002 para o repositório DEV Lean;
- landing mobile-first;
- formulário e resumo profissional;
- PDF client-side;
- mensagem pronta para WhatsApp;
- checkout externo configurável;
- instrumentação mínima da jornada;
- documentação técnica da V0.

### Changed

- produto renomeado de **LucronomIA Fechou** para **LucronomIA Confirma** antes de READY FOR SALES;
- diretório canônico alterado para `products/confirma/`;
- provider V0 de checkout definido como **Mercado Pago — Link de Pagamento**;
- preço mantido em **R$ 9,90 pagamento único**;
- URL HTTPS real do checkout configurada em `products/confirma/config.js`.

### Architecture

- frontend estático;
- sem banco de dados;
- sem autenticação;
- sem IA;
- sem backend obrigatório;
- sem API de pagamentos, billing próprio ou assinatura;
- infraestrutura incremental alvo de R$ 0.

### Pending

- smoke test end-to-end do pagamento real;
- teste de PDF e WhatsApp em dispositivo real;
- conclusão do QA de responsividade e textos;
- somente após isso classificar como READY FOR SALES.
