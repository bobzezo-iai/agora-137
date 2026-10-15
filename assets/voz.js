/* ==========================================================================
   ÁGORA 137 · Motor da voz por citação
   Nenhum clone inventa fala. A pergunta é lida por temas e palavras;
   a resposta é sempre um trecho real da obra do autor, com a fonte.
   Funciona igual no navegador (window.Voz) e no Node (tests/).
   ========================================================================== */
(function (raiz) {
  'use strict';

  var VAZIAS = ('a o as os um uma uns umas de do da dos das em no na nos nas por pela pelo pelas pelos para pra ' +
    'com sem e ou mas que se como qual quais quando onde porque porquê por quê é ser são foi era sou estar está ' +
    'esta este isso isto aquilo essa esse ao aos à às me te lhe nos vos meu minha seu sua teu tua nosso nossa ' +
    'você voce vocês tu ele ela eles elas eu há ha tem ter mais menos muito muita já ja não nao sim também ' +
    'o que qual sobre diz dizer pensa pensas acha achas mestre irmão irmao senhor senhora fale fala').split(' ');
  var VAZIA = {};
  VAZIAS.forEach(function (p) { VAZIA[p] = true; });

  function normalizar(texto) {
    return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* Raiz grosseira: o bastante para "virtudes" encontrar "virtude" e "liberdade" encontrar "libertar". */
  function raizDe(palavra) {
    var p = palavra.replace(/-/g, '');
    if (p.length <= 4) return p;
    return p.slice(0, Math.max(4, Math.min(6, p.length - 2)));
  }

  function palavras(texto) {
    return normalizar(texto).split(' ').filter(function (p) { return p.length > 2 && !VAZIA[p]; });
  }

  /* Expande a pergunta pelos sinônimos de cada tema (dados/sinonimos.json). */
  function temasDaPergunta(pergunta, sinonimos) {
    var norm = ' ' + normalizar(pergunta) + ' ';
    var raizes = palavras(pergunta).map(raizDe);
    var achados = {};
    Object.keys(sinonimos || {}).forEach(function (tema) {
      var lista = [tema].concat(sinonimos[tema]);
      for (var i = 0; i < lista.length; i++) {
        var termo = normalizar(lista[i]);
        if (!termo) continue;
        if (termo.indexOf(' ') >= 0 ? norm.indexOf(' ' + termo + ' ') >= 0 : raizes.indexOf(raizDe(termo)) >= 0) {
          achados[tema] = true;
          break;
        }
      }
    });
    return Object.keys(achados);
  }

  function pontuar(citacao, temas, raizesPergunta) {
    var pontos = 0;
    var temasCit = (citacao.temas || []).map(normalizar);
    temas.forEach(function (t) { if (temasCit.indexOf(normalizar(t)) >= 0) pontos += 3; });
    temasCit.forEach(function (t) { if (raizesPergunta.indexOf(raizDe(t)) >= 0) pontos += 2; });
    var raizesTexto = palavras(citacao.pt + ' ' + (citacao.original || '')).map(raizDe);
    raizesPergunta.forEach(function (r) { if (raizesTexto.indexOf(r) >= 0) pontos += 1; });
    return pontos;
  }

  /*
   * Escolhe a citação de um clone para uma pergunta.
   * jaDitas: ids de citações já mostradas nesta conversa (não repetir enquanto houver outra).
   * Retorna { citacao, exata } — exata=false quando nenhuma passagem toca a pergunta
   * e a voz oferece, com honestidade, o trecho mais próximo do seu repertório.
   */
  function responder(clone, pergunta, sinonimos, jaDitas) {
    var cits = (clone.citacoes || []).filter(function (c) { return c.selo === 'autentica' || c.selo === 'tradicao'; });
    if (!cits.length) return null;
    var ditas = jaDitas || [];
    var temas = temasDaPergunta(pergunta, sinonimos);
    var raizes = palavras(pergunta).map(raizDe);
    var ranking = cits.map(function (c, i) {
      return { c: c, p: pontuar(c, temas, raizes), novo: ditas.indexOf(c.id) < 0, i: i };
    }).sort(function (a, b) {
      if (b.p !== a.p) return b.p - a.p;
      if (a.novo !== b.novo) return a.novo ? -1 : 1;
      return a.i - b.i;
    });
    var melhor = ranking[0];
    if (melhor.p > 0) {
      var inedita = ranking.filter(function (r) { return r.p === melhor.p && r.novo; })[0];
      return { citacao: (inedita || melhor).c, exata: true, temas: temas };
    }
    var nova = ranking.filter(function (r) { return r.novo; })[0] || ranking[0];
    return { citacao: nova.c, exata: false, temas: temas };
  }

  /* Busca na Ágora inteira: as passagens que mais tocam a pergunta, de autores distintos. */
  function consultarTodos(clones, pergunta, sinonimos, limite) {
    var temas = temasDaPergunta(pergunta, sinonimos);
    var raizes = palavras(pergunta).map(raizDe);
    var todas = [];
    clones.forEach(function (cl) {
      (cl.citacoes || []).forEach(function (c) {
        if (c.selo !== 'autentica' && c.selo !== 'tradicao') return;
        var p = pontuar(c, temas, raizes);
        if (p > 0) todas.push({ clone: cl, citacao: c, p: p });
      });
    });
    todas.sort(function (a, b) { return b.p - a.p; });
    var vistos = {};
    var saida = [];
    for (var i = 0; i < todas.length && saida.length < (limite || 7); i++) {
      if (vistos[todas[i].clone.id]) continue;
      vistos[todas[i].clone.id] = true;
      saida.push(todas[i]);
    }
    return { temas: temas, resultados: saida };
  }

  /* Outro conselheiro que escreveu sobre o mesmo tema — o "procure também" do modelo. */
  function recomendar(clones, atualId, citacao) {
    var temas = (citacao.temas || []).map(normalizar);
    var melhor = null;
    clones.forEach(function (cl) {
      if (cl.id === atualId || cl.status === 'voz-em-formacao') return;
      (cl.citacoes || []).forEach(function (c) {
        var comum = (c.temas || []).filter(function (t) { return temas.indexOf(normalizar(t)) >= 0; }).length;
        if (comum > 0 && (!melhor || comum > melhor.comum)) melhor = { clone: cl, comum: comum };
      });
    });
    return melhor && melhor.clone;
  }

  /* Referência ABNT simplificada, para a Peça de Arquitetura. */
  function referenciaABNT(fonte) {
    if (!fonte) return '';
    var autor = String(fonte.autor || '').trim();
    var partes = autor.split(/\s+/);
    var sobrenome = partes.length > 1 ? partes[partes.length - 1].toUpperCase() + ', ' + partes.slice(0, -1).join(' ') : autor.toUpperCase();
    var ref = (autor ? sobrenome + '. ' : '') + fonte.titulo + '.';
    if (fonte.edicao) ref += ' ' + fonte.edicao + '.';
    if (fonte.ano && String(fonte.edicao || '').indexOf(fonte.ano) < 0) ref += ' ' + fonte.ano + '.';
    if (fonte.url) ref += ' Disponível em: <' + fonte.url + '>.';
    return ref;
  }

  function publicavel(c) { return c.selo === 'autentica' || c.selo === 'tradicao'; }

  var Voz = {
    publicavel: publicavel,
    normalizar: normalizar, palavras: palavras, temasDaPergunta: temasDaPergunta,
    responder: responder, consultarTodos: consultarTodos, recomendar: recomendar, referenciaABNT: referenciaABNT,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Voz;
  else raiz.Voz = Voz;
})(typeof window !== 'undefined' ? window : globalThis);
