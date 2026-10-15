# ÁGORA 137 · a praça aberta da Arte Real

Atlas livre e gratuito da Ordem Maçônica e da filosofia que a alimenta: Maçonaria operativa e especulativa, vertentes, ritos, potências, as mulheres na Ordem, a Saga dos Templários e dois Conselhos de vozes que **só falam por citação verificada**.

## Os três compromissos
1. **Toda voz é citação.** Nenhum conselheiro inventa fala: cada resposta é um trecho real da obra, com livro, localização e link para conferir.
2. **Todo fato tem selo.** Documentado · tradição e lenda · hipótese em debate · aberto e disputado.
3. **Silêncio iniciático.** Nenhuma palavra, toque, sinal ou cerimônia reservada é publicada.

## Como funciona (CLI primeiro)
```bash
npm run verificar        # auditoria: fontes, selos, autores vivos, vocabulário da casa
npm run verificar:links  # também testa cada link na rede
npm test                 # testes do motor da voz por citação
npm run montar           # audita e gera _site/ (a única pasta publicada)
npm run servir           # serve localmente em http://localhost:8137
```
Sem dependências externas: Node.js e o navegador bastam. O site não usa cookies, não chama serviços de terceiros e não coleta dados.

## Onde está cada coisa
- `dados/clones/` — um arquivo por conselheiro, com obras, citações e fontes
- `dados/atlas/` — as nove seções do Atlas
- `docs/pesquisa/PROTOCOLO-FONTES.md` — a régua de verificação
- `docs/pesquisa/relatorio-*.md` — o que foi verificado, descartado e corrigido, lote a lote

## Encontrou um erro?
Abra uma *issue* com a fonte que corrige ou completa o dado. Um Atlas só é confiável se puder ser corrigido.

## Licença
Texto autoral sob **CC BY-SA 4.0**; código sob **MIT**. As citações pertencem às suas obras e as imagens têm licença própria — ver `LICENSE.md`.

iAi — Icônica Agência de Inteligência · ECOssistema Base Tríade · Selo iAi·3·C00·HTM·26.147·P
