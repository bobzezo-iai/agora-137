/* ==========================================================================
   ÁGORA 137 · a praça — interface
   SEGURANÇA: nenhum dado sai deste navegador. Sem rede, sem rastreamento.
   Único armazenamento: o Diário de Bordo e a Peça, no próprio navegador (localStorage).
   Todo conteúdo vem de assets/dados.js, montado e auditado pela CLI.
   ========================================================================== */
(function () {
  'use strict';

  var D = window.AGORA || { clones: [], atlas: {} };
  var Voz = window.Voz;
  var SIN = D.sinonimos || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function link(url, texto) {
    if (!url || !/^https?:\/\//.test(url)) return esc(texto || '');
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(texto || url) + ' ↗</a>';
  }
  function guardar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* navegador sem armazenamento */ } }
  function recuperar(chave, padrao) { try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }

  var SELOS = {
    documentado: ['ep-hist', 'Historicamente documentado'],
    tradicao: ['ep-trad', 'Tradição e lenda'],
    hipotese: ['ep-hipo', 'Hipótese em debate'],
    disputado: ['ep-disp', 'Aberto e disputado'],
  };
  function selo(s) {
    var x = SELOS[s];
    return x ? '<span class="ep ' + x[0] + '">' + x[1] + '</span>' : '';
  }

  /* ================= ALAS ================= */
  var ALAS = ['portico', 'atlas', 'conselhos', 'mapa', 'peca', 'saga', 'fontes'];
  function setAla(a, semRolar) {
    if (ALAS.indexOf(a) < 0) a = 'portico';
    ALAS.forEach(function (k) {
      var ala = document.getElementById('ala-' + k);
      var tab = document.getElementById('tab-' + k);
      if (ala) ala.classList.toggle('on', a === k);
      if (tab) { tab.classList.toggle('on', a === k); tab.setAttribute('aria-selected', a === k ? 'true' : 'false'); }
    });
    if (!semRolar) window.scrollTo({ top: 0 });
    if (location.hash.slice(1).split('/')[0] !== a) history.replaceState(null, '', '#' + a);
  }
  function irPara(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var barras = 56 + (($('.subnav.on, #ala-atlas .subnav') || {}).offsetHeight || 46);
    window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - barras + 6, behavior: 'smooth' });
  }

  /* ================= FONTES (por seção/clone) ================= */
  function fontesDe(lista, ids) {
    var mapa = {};
    (lista || []).forEach(function (f) { mapa[f.id] = f; });
    return (ids || []).map(function (id) { return mapa[id]; }).filter(Boolean);
  }
  function rotuloFonte(f) {
    return [f.autor, f.titulo, f.ano].filter(Boolean).join(' · ');
  }
  function notasFonte(lista, ids) {
    var fs = fontesDe(lista, ids);
    if (!fs.length) return '';
    return '<div class="item-fontes">' + fs.map(function (f) { return f.url ? link(f.url, rotuloFonte(f)) : esc(rotuloFonte(f)); }).join(' · ') + '</div>';
  }
  function blocoFundamentos(sec) {
    if (!sec.fontes || !sec.fontes.length) return '';
    return '<details class="fundamentos"><summary>Fundamentos desta seção · ' + sec.fontes.length + ' fontes</summary><ol>' +
      sec.fontes.map(function (f) { return '<li>' + (f.url ? link(f.url, rotuloFonte(f)) : esc(rotuloFonte(f))) + (f.tipo ? ' <small>(' + esc(f.tipo) + ')</small>' : '') + '</li>'; }).join('') +
      '</ol></details>';
  }

  /* ================= ATLAS ================= */
  /* Renderização tolerante: cada seção é JSON auditado; os campos conhecidos ganham forma própria. */
  function renderItem(it, fontes) {
    var cab = '';
    if (it.data || it.ano) cab += '<span class="data">' + esc(it.data || it.ano) + '</span>';
    var titulo = it.titulo || it.nome || '';
    var corpo = it.texto || it.tese || it.descricao || it.resumo || it.nota || '';
    if (it.subtitulo) titulo += ' · ' + it.subtitulo;
    var extra = '';
    ['origem', 'graus', 'fundacao', 'sede', 'praticado_por', 'obediencias', 'quem_sustenta', 'quem_contesta', 'estado_do_debate'].forEach(function (k) {
      if (it[k]) extra += '<div class="meta"><b>' + esc(k.replace(/_/g, ' ')) + ':</b> ' + esc(Array.isArray(it[k]) ? it[k].join(', ') : it[k]) + '</div>';
    });
    var url = it.url || it.portal || it.url_oficial;
    return '<article class="item">' + cab + '<div class="item-corpo"><h4>' + esc(titulo) + '</h4>' +
      (corpo ? '<p>' + esc(corpo) + '</p>' : '') + extra +
      (url ? '<div class="meta">' + link(url, 'portal oficial') + '</div>' : '') +
      (it.nota_rigor ? '<div class="meta nota-rigor">' + esc(it.nota_rigor) + '</div>' : '') +
      selo(it.selo) + notasFonte(fontes, it.fontes || (it.fonte_id ? [it.fonte_id] : [])) + '</div></article>';
  }

  function renderTabela(tab) {
    if (!tab) return '';
    var linhas = Array.isArray(tab) ? tab : (tab.linhas || []);
    if (!linhas.length) return '';
    var cols = tab.colunas || Object.keys(linhas[0]);
    return '<div class="tabela-wrap"><table class="comparativo"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c.replace(/_/g, ' ')) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + linhas.map(function (l) { return '<tr>' + cols.map(function (c) { return '<td>' + esc(l[c]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + (tab.nota ? '<p class="nota-tabela">' + esc(tab.nota) + '</p>' : '');
  }

  var IGNORAR = { acrescimos_propostos: 1, filtros: 1, fontes: 1, comparativo: 1, pendencias: 1, fundamentos_links: 1, correcoes_ao_modelo: 1, cenas: 1 };
  var ROTULOS = { itens: '', secoes: '', teorias: 'As teorias: como a pedra virou símbolo', itens_em_avaliacao: 'Em avaliação', familias: 'As famílias' };
  function renderSecao(id, sec, numero) {
    var html = '<section id="' + esc(id) + '"><div class="sec-num">' + esc(numero) + '</div>' +
      '<h2>' + esc(sec.titulo || id) + '</h2>' + (sec.subtitulo ? '<div class="sec-sub">' + esc(sec.subtitulo) + '</div>' : '') +
      (sec.intro ? '<p class="intro">' + esc(sec.intro) + '</p>' : '');
    Object.keys(sec).forEach(function (k) {
      var v = sec[k];
      if (IGNORAR[k] || !Array.isArray(v) || !v.length || typeof v[0] !== 'object') return;
      var rotulo = ROTULOS[k] === undefined ? k.replace(/_/g, ' ') : ROTULOS[k];
      if (rotulo) html += '<h3 class="bloco">' + esc(rotulo) + '</h3>';
      html += '<div class="itens">' + v.map(function (it) { return renderItem(it, sec.fontes); }).join('') + '</div>';
    });
    if (sec.comparativo) html += '<h3 class="bloco">Lado a lado</h3>' + renderTabela(sec.comparativo);
    if (sec.sintese) html += '<blockquote class="sintese">' + esc(sec.sintese) + '</blockquote>';
    return html + blocoFundamentos(sec) + '</section>';
  }

  function renderBiblioteca(sec, numero) {
    var filtros = ['Todos'].concat(sec.filtros || []);
    var html = '<section id="biblioteca"><div class="sec-num">' + esc(numero) + '</div><h2>' + esc(sec.titulo) + '</h2>' +
      (sec.intro ? '<p class="intro">' + esc(sec.intro) + '</p>' : '') +
      '<div class="filtros" role="group" aria-label="Filtrar autores">' + filtros.map(function (f, i) {
        return '<button class="fbtn' + (i ? '' : ' on') + '" data-acao="filtro-livro" data-filtro="' + esc(f) + '">' + esc(f) + '</button>';
      }).join('') + '</div><div class="livros">' + (sec.autores || []).map(function (a) {
        var o = a.obra_farol || {};
        return '<article class="livro" data-filtros="' + esc((a.filtro || []).join('|')) + '"><h4>' + esc(a.nome) + '</h4>' +
          '<div class="meta">' + esc([a.regiao, a.vida].filter(Boolean).join(' · ')) + '</div>' +
          (o.titulo ? '<div class="obra"><i>' + esc(o.titulo) + '</i>' + (o.ano ? ' (' + esc(o.ano) + ')' : '') + '</div>' : '') +
          (a.descricao ? '<p>' + esc(a.descricao) + '</p>' : '') +
          (a.ler && a.ler.url ? '<div class="meta">' + link(a.ler.url, a.ler.rotulo || 'Ler') + (a.dominio_publico ? ' <span class="dp">domínio público</span>' : '') + '</div>' : '') +
          notasFonte(sec.fontes, a.fontes) + '</article>';
      }).join('') + '</div>';
    return html + blocoFundamentos(sec) + '</section>';
  }
  function filtrarLivros(f) {
    $$('#biblioteca .fbtn').forEach(function (b) { b.classList.toggle('on', b.dataset.filtro === f); });
    $$('#biblioteca .livro').forEach(function (l) { l.classList.toggle('oculto', f !== 'Todos' && l.dataset.filtros.split('|').indexOf(f) < 0); });
  }

  var ORDEM_ATLAS = [
    ['origens', 'I · Origens'], ['operativa-especulativa', 'II · Operativa × Especulativa'], ['vertentes', 'III · Vertentes'],
    ['ritos', 'IV · Ritos'], ['potencias', 'V · Potências'], ['mulheres', 'VI · As Mulheres'], ['biblioteca', 'VII · Biblioteca'],
  ];
  function montarAtlas() {
    var alvo = $('#atlas-corpo');
    if (!alvo) return;
    alvo.innerHTML = ORDEM_ATLAS.filter(function (s) { return D.atlas[s[0]]; }).map(function (s) {
      return s[0] === 'biblioteca' ? renderBiblioteca(D.atlas[s[0]], s[1]) : renderSecao(s[0], D.atlas[s[0]], s[1]);
    }).join('');
  }

  /* ================= CONSELHOS ================= */
  var REGIOES = { oci: 'Ocidente', ori: 'Oriente', bra: 'Brasil' };
  var conselhoAtual = 'ordem';
  var modo = 'individual';
  var mesa = [];
  var conversas = {};
  var atual = null;

  function cloneId(id) {
    if (id === 'coruja') return D.coruja;
    for (var i = 0; i < D.clones.length; i++) if (D.clones[i].id === id) return D.clones[i];
    return null;
  }
  function iniciais(nome) {
    return String(nome).replace(/\b(de|da|do|dos|das|el|al|von|y)\b/gi, '').split(/[\s.-]+/).filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
  }

  function montarConselho() {
    var alvo = $('#panteoes');
    if (!alvo) return;
    var membros = D.clones.filter(function (c) { return c.conselho === conselhoAtual; });
    alvo.innerHTML = ['oci', 'ori', 'bra'].map(function (r) {
      var lista = membros.filter(function (c) { return c.regiao === r; });
      if (!lista.length) return '';
      return '<div class="coluna col-' + r + '"><h3>' + REGIOES[r] + '</h3>' + lista.map(function (c) {
        var forma = c.status === 'voz-em-formacao';
        return '<button class="medalhao' + (forma ? ' em-formacao' : '') + (mesa.indexOf(c.id) >= 0 ? ' na-mesa' : '') + '" data-acao="medalhao" data-id="' + esc(c.id) + '">' +
          '<span class="mono" aria-hidden="true">' + esc(iniciais(c.nome)) + '</span>' +
          '<span><span class="nm">' + esc(c.nome) + '</span><span class="tg">' + esc(c.tag) + (forma ? ' · voz em formação' : '') + '</span></span>' +
          '<span class="add" aria-hidden="true">+</span></button>';
      }).join('') + '</div>';
    }).join('');
    var n = membros.length;
    var cont = $('#conselho-contagem');
    if (cont) cont.textContent = n + (conselhoAtual === 'ordem' ? ' vozes da Ordem' : ' vozes da filosofia');
    $$('.conselho-tab').forEach(function (b) { b.classList.toggle('on', b.dataset.conselho === conselhoAtual); });
  }

  function cartaoCitacao(clone, cit, opcoes) {
    var o = opcoes || {};
    var fonte = fontesDe(clone.fontes, [cit.fonte_id])[0] || {};
    var trad = cit.traducao === 'nossa' ? 'tradução nossa' : (cit.traducao ? 'trad. ' + cit.traducao : '');
    var orig = cit.original && cit.original !== cit.pt
      ? '<details class="original"><summary>ver no original' + (cit.idioma ? ' (' + esc(cit.idioma) + ')' : '') + '</summary><p lang="' + esc(cit.idioma || '') + '">' + esc(cit.original) + '</p></details>'
      : '';
    return '<figure class="citacao">' +
      (o.aproximada ? '<div class="aproximada">Minha obra não responde a isso diretamente. Eis o trecho mais próximo do que deixei escrito:</div>' : '') +
      '<blockquote>' + esc(cit.pt) + '</blockquote>' + orig +
      (cit.ressalva ? '<div class="ressalva">' + esc(cit.ressalva) + '</div>' : '') +
      '<figcaption><b>' + esc(cit.autor || clone.nome) + '</b>' + (cit.testemunho ? ' <span class="testemunho">(' + esc(cit.testemunho) + ')</span>' : '') + ', <i>' + esc(fonte.titulo || '') + '</i>' + (fonte.ano ? ' (' + esc(fonte.ano) + ')' : '') +
      (cit.local ? ' · ' + esc(cit.local) : '') + (trad ? ' · ' + esc(trad) : '') +
      '<div class="cit-acoes"><span class="verif ' + (cit.verificacao === 'texto-integral' ? 'v-integral' : 'v-secundaria') + '">' +
      (cit.verificacao === 'texto-integral' ? 'conferido no texto integral' : 'conferido em fonte acadêmica') + '</span>' +
      (cit.selo === 'tradicao' ? '<span class="verif v-tradicao" title="O texto foi conferido na fonte; a autoria é atribuída pela tradição">autoria pela tradição</span>' : '') +
      (cit.url || fonte.url ? link(cit.url || fonte.url, 'ler na fonte') : '') +
      '<button class="guardar" data-acao="guardar-citacao" data-clone="' + esc(clone.id) + '" data-cit="' + esc(cit.id) + '">guardar no Diário</button></div>' +
      '</figcaption></figure>';
  }

  function abrirCamara(id) {
    var c = cloneId(id);
    if (!c) return;
    atual = c;
    conversas[c.id] = conversas[c.id] || [];
    var cam = $('#camara');
    var vinculo = c.maconaria && c.maconaria.vinculo ? '<span class="vinculo">' + esc(c.maconaria.vinculo) + '</span>' : '';
    $('#camTop').innerHTML = '<span class="mono" aria-hidden="true">' + (id === 'coruja' ? '∴' : esc(iniciais(c.nome))) + '</span>' +
      '<div><div class="nm">' + esc(c.nome) + (c.vida ? ' <small>' + esc(c.vida) + '</small>' : '') + '</div><div class="tg">' + esc(c.tag || '') + ' ' + vinculo + '</div></div>' +
      '<button class="dtoggle" data-acao="diario">Diário</button><button class="voltar" data-acao="fechar-camara">Voltar</button>';
    var alma = c.alma ? '<div class="alma">' + esc(c.alma) + (c.maconaria && c.maconaria.nota ? ' <span class="nota-ordem">' + esc(c.maconaria.nota) + '</span>' : '') + '</div>' : '';
    $('#camMsgs').innerHTML = alma;
    if (!conversas[c.id].length) {
      var saud = (c.citacoes || []).filter(function (q) { return q.id === c.saudacao_id; })[0] || (c.citacoes || [])[0];
      if (saud) conversas[c.id].push({ quem: 'clone', html: cartaoCitacao(c, saud), cit: saud.id });
      else conversas[c.id].push({ quem: 'clone', html: '<p class="silencio">Esta voz ainda está em formação: as citações verificadas ainda não chegaram a três. Melhor silêncio honesto que palavra inventada.</p>' });
    }
    renderConversa();
    cam.classList.add('aberta');
    cam.setAttribute('aria-hidden', 'false');
    $('#camIn').focus();
  }
  function fecharCamara() {
    var cam = $('#camara');
    cam.classList.remove('aberta');
    cam.setAttribute('aria-hidden', 'true');
    atual = null;
  }
  function renderConversa() {
    var box = $('#camMsgs');
    var alma = $('.alma', box);
    box.innerHTML = (alma ? alma.outerHTML : '') + (conversas[atual.id] || []).map(function (m) {
      return '<div class="msg ' + m.quem + '">' + (m.quem === 'eu' ? '<div class="balao">' + esc(m.texto) + '</div>' : m.html) + '</div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }
  function enviar() {
    var inp = $('#camIn');
    var q = inp.value.trim();
    if (!q || !atual) return;
    inp.value = '';
    var conv = conversas[atual.id];
    conv.push({ quem: 'eu', texto: q });
    registrarDiario('pergunta', atual.nome, q);
    var ditas = conv.filter(function (m) { return m.cit; }).map(function (m) { return m.cit; });
    var r = Voz.responder(atual, q, SIN, ditas);
    if (!r) {
      conv.push({ quem: 'clone', html: '<p class="silencio">Esta voz ainda está em formação.</p>' });
    } else {
      var html = cartaoCitacao(atual, r.citacao, { aproximada: !r.exata });
      var rec = Voz.recomendar(D.clones, atual.id, r.citacao);
      if (rec) html += '<div class="recomenda">Para aprofundar o tema, consulte também <button data-acao="abrir" data-id="' + esc(rec.id) + '">' + esc(rec.nome) + '</button>.</div>';
      conv.push({ quem: 'clone', html: html, cit: r.citacao.id });
    }
    renderConversa();
  }

  /* Sínodo: até três vozes respondem à mesma pergunta, cada uma com o seu trecho. */
  function cliqueMedalhao(id) {
    if (modo === 'individual') { abrirCamara(id); return; }
    var i = mesa.indexOf(id);
    if (i >= 0) mesa.splice(i, 1);
    else if (mesa.length >= 3) { avisoSinodo('A mesa comporta no máximo três vozes. Retire uma antes de sentar outra.'); return; }
    else mesa.push(id);
    refreshMesa();
  }
  var DICA_PADRAO = 'Toque em até três medalhões para sentá-los à mesa, escreva a pergunta e convoque o coro.';
  function avisoSinodo(t) {
    var d = $('#sinodoDica');
    d.textContent = t;
    clearTimeout(avisoSinodo.t);
    avisoSinodo.t = setTimeout(function () { d.textContent = DICA_PADRAO; }, 4200);
  }
  function refreshMesa() {
    $$('.medalhao').forEach(function (el) { el.classList.toggle('na-mesa', mesa.indexOf(el.dataset.id) >= 0); });
    $('#sinodoSel').innerHTML = mesa.map(function (id) {
      var c = cloneId(id);
      return '<span class="chip">' + esc(c.nome) + '<button data-acao="tirar-mesa" data-id="' + esc(id) + '" aria-label="Retirar ' + esc(c.nome) + '">×</button></span>';
    }).join('') || '<span class="mesa-vazia">mesa vazia: toque nos medalhões abaixo</span>';
    $('#sinodoGo').textContent = mesa.length ? 'Convocar · ' + mesa.length + '/3' : 'Convocar';
  }
  function setModo(m) {
    modo = m;
    $('#mb-ind').classList.toggle('on', m === 'individual');
    $('#mb-sin').classList.toggle('on', m === 'sinodo');
    $('#sinodoBar').classList.toggle('show', m === 'sinodo');
    if (m === 'individual') mesa = [];
    refreshMesa();
  }
  function convocarSinodo() {
    var q = $('#sinodoQ').value.trim();
    if (!mesa.length) { avisoSinodo('Sente ao menos uma voz à mesa.'); return; }
    if (!q) { avisoSinodo('Escreva a pergunta que será posta diante do coro.'); $('#sinodoQ').focus(); return; }
    var id = 'sinodo';
    atual = { id: id, nome: 'Sínodo', tag: mesa.map(function (x) { return cloneId(x).nome; }).join(' · ') };
    conversas[id] = [{ quem: 'eu', texto: q }];
    registrarDiario('pergunta', 'Sínodo: ' + atual.tag, q);
    mesa.forEach(function (cid) {
      var c = cloneId(cid);
      var r = Voz.responder(c, q, SIN, []);
      conversas[id].push({ quem: 'clone', html: r ? cartaoCitacao(c, r.citacao, { aproximada: !r.exata }) : '<p class="silencio">' + esc(c.nome) + ': voz em formação.</p>' });
    });
    $('#camTop').innerHTML = '<span class="mono">∴</span><div><div class="nm">Sínodo</div><div class="tg">' + esc(atual.tag) + '</div></div>' +
      '<button class="dtoggle" data-acao="diario">Diário</button><button class="voltar" data-acao="fechar-camara">Voltar</button>';
    $('#camMsgs').innerHTML = '';
    renderConversa();
    $('#camara').classList.add('aberta');
    $('#camara').setAttribute('aria-hidden', 'false');
    $('#sinodoQ').value = '';
  }

  /* Pergunte à Ágora: a pergunta atravessa todos os conselhos. */
  function perguntarAgora(q) {
    var alvo = $('#agora-resp');
    if (!q.trim()) { alvo.innerHTML = ''; return; }
    var r = Voz.consultarTodos(D.clones.filter(function (c) { return c.status !== 'voz-em-formacao'; }), q, SIN, 7);
    registrarDiario('pergunta', 'Ágora', q);
    if (!r.resultados.length) {
      alvo.innerHTML = '<p class="silencio">Nenhuma passagem dos conselhos toca diretamente essa pergunta. Experimente nomear um tema: virtude, morte, luz, liberdade, templo, silêncio, trabalho…</p>';
      return;
    }
    alvo.innerHTML = (r.temas.length ? '<div class="temas-lidos">Temas lidos na pergunta: ' + r.temas.map(esc).join(' · ') + '</div>' : '') +
      r.resultados.map(function (x) { return cartaoCitacao(x.clone, x.citacao); }).join('');
  }

  /* ================= DIÁRIO DE BORDO ================= */
  var DIARIO = recuperar('agora137.diario', []);
  function agoraHora() { return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
  function registrarDiario(tipo, quem, texto, extra) {
    DIARIO.push({ tipo: tipo, quem: quem, texto: texto, quando: agoraHora(), extra: extra || null });
    guardar('agora137.diario', DIARIO);
    renderDiario();
  }
  function renderDiario() {
    var el = $('#dlista');
    if (!el) return;
    el.innerHTML = DIARIO.slice(-40).reverse().map(function (e) {
      return '<div class="dent d-' + esc(e.tipo) + '"><small>' + esc(e.quando) + ' · ' + esc(e.quem) + '</small><div>' + esc(e.texto) + '</div></div>';
    }).join('') || '<p class="mesa-vazia">O Diário guarda, só neste navegador, as perguntas feitas e as passagens que você escolher guardar.</p>';
  }
  function guardarCitacao(cloneIdS, citId) {
    var c = cloneId(cloneIdS);
    var q = (c.citacoes || []).filter(function (x) { return x.id === citId; })[0];
    if (!q) return;
    var f = fontesDe(c.fontes, [q.fonte_id])[0];
    registrarDiario('citacao', c.nome, '"' + q.pt + '" (' + (f ? f.titulo : '') + (q.local ? ', ' + q.local : '') + ')', { ref: Voz.referenciaABNT(f) });
  }
  function baixarDiario() {
    var md = '# Diário de Bordo · ÁGORA 137\n\n' + DIARIO.map(function (e) {
      return '- **' + e.quando + ' · ' + e.quem + '** (' + e.tipo + '): ' + e.texto + (e.extra && e.extra.ref ? '\n  - ' + e.extra.ref : '');
    }).join('\n') + '\n';
    baixar('diario-agora-137.md', md, 'text/markdown');
  }
  function baixar(nome, conteudo, tipo) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: tipo + ';charset=utf-8' }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ================= PEÇA DE ARQUITETURA ================= */
  var CAMPOS_PECA = ['titulo', 'autor', 'grau', 'loja', 'oriente', 'intro', 'desenv', 'concl', 'refs'];
  function salvarPeca() {
    var p = {};
    CAMPOS_PECA.forEach(function (k) { var el = $('#p-' + k); if (el) p[k] = el.value; });
    guardar('agora137.peca', p);
  }
  function carregarPeca() {
    var p = recuperar('agora137.peca', {});
    CAMPOS_PECA.forEach(function (k) { var el = $('#p-' + k); if (el && p[k]) el.value = p[k]; });
  }
  function trazerDoDiario() {
    var cits = DIARIO.filter(function (e) { return e.tipo === 'citacao'; });
    var notas = DIARIO.filter(function (e) { return e.tipo === 'nota'; });
    var des = $('#p-desenv');
    var refs = $('#p-refs');
    if (cits.length) {
      des.value += (des.value ? '\n\n' : '') + cits.map(function (e) { return e.quem + ': ' + e.texto; }).join('\n\n');
      var lista = cits.map(function (e) { return e.extra && e.extra.ref; }).filter(Boolean);
      var unicas = lista.filter(function (r, i) { return lista.indexOf(r) === i; }).sort();
      refs.value += (refs.value ? '\n' : '') + unicas.join('\n');
    }
    if (notas.length) des.value += '\n\n' + notas.map(function (e) { return e.texto; }).join('\n');
    salvarPeca();
    avisoPeca(cits.length ? cits.length + ' passagens e suas referências foram trazidas do Diário.' : 'O Diário ainda não tem passagens guardadas. Nos Conselhos, use "guardar no Diário".');
  }
  function avisoPeca(t) { var el = $('#peca-aviso'); if (el) el.textContent = t; }
  function imprimirPeca() {
    salvarPeca();
    window.print();
  }

  /* ================= MAPA DAS LOJAS ================= */
  function montarMapa() {
    var m = D.atlas['mapa-lojas'];
    var alvo = $('#mapa-corpo');
    if (!m || !alvo) return;
    var grupos = m.grupos || m.regioes || [{ titulo: '', portais: m.portais || m.itens || [] }];
    alvo.innerHTML = grupos.map(function (g) {
      var itens = g.portais || g.itens || [];
      return '<h3 class="bloco">' + esc(g.titulo || g.nome || '') + '</h3><div class="mgrid">' + itens.map(function (p) {
        var url = /^https?:/.test(p.url_final || '') ? p.url_final : p.url;
        return '<div class="mitem"><div class="mnome">' + esc(p.nome) + '</div><div class="mdesc">' + esc([p.fundacao || p.data, p.familia, p.descricao].filter(Boolean).join(' · ')) + '</div>' +
          (p.observacao && !url ? '<div class="mdesc">' + esc(p.observacao) + '</div>' : '') + '<div class="mlinks">' + (url ? link(url, 'Portal') : '') + (p.encontre_loja ? ' ' + link(p.encontre_loja, 'Encontre uma Loja') : '') + '</div></div>';
      }).join('') + '</div>';
    }).join('') + (m.intro ? '<p class="nota-metodo">' + esc(m.intro) + '</p>' : '');
  }
  function filtrarLojas(q) {
    q = Voz.normalizar(q);
    $$('#mapa-corpo .mitem').forEach(function (it) { it.classList.toggle('oculto', q && Voz.normalizar(it.textContent).indexOf(q) < 0); });
  }

  /* ================= SAGA ================= */
  function montarSaga() {
    var s = D.atlas['saga-templarios'];
    var alvo = $('#saga-corpo');
    if (!s || !alvo) return;
    var creditos = (D['creditos-imagens'] || []);
    var cred = {};
    creditos.forEach(function (c) { cred[c.arquivo] = c; });
    var cenas = s.cenas || s.itens || [];
    alvo.innerHTML = cenas.map(function (c, i) {
      var img = 'saga-' + String(i + 1).padStart(2, '0') + '.jpg';
      var cr = cred[img];
      return '<div class="cena" style="background-image:url(assets/img/' + img + ')"><div class="cena-txt">' +
        '<div class="cena-num">Cena ' + esc(c.numero || (i + 1)) + (c.data ? ' · ' + esc(c.data) : '') + '</div>' +
        '<h3>' + esc(c.titulo) + '</h3><p>' + esc(c.texto) + '</p>' + selo(c.selo) + notasFonte(s.fontes, c.fontes) +
        (cr ? '<div class="credito-img">Imagem: ' + esc(cr.atribuicao || cr.titulo) + '</div>' : '') + '</div></div>';
    }).join('');
  }

  /* Créditos do dossiê da Saga: só o que foi verificado vai ao site. */
  function montarCreditosSaga() {
    var s = D.atlas['saga-templarios'];
    var alvo = $('#saga-creditos');
    if (!s || !alvo || !s.creditos_misiti) return;
    var m = s.creditos_misiti;
    var v = m.verificado || {};
    var bio = ['nascimento', 'formacao', 'atividade', 'brasil'].map(function (k) { return v[k] ? '<p>' + esc(String(v[k]).replace(/\s—\s[^—]*$/, '')) + '</p>' : ''; }).join('');
    var obras = (v.obras || []).map(function (o) { return '<li><i>' + esc(o.titulo) + '</i> (' + esc(o.ano) + (o.editora && o.editora.indexOf('não informada') < 0 ? ', ' + esc(o.editora) : '') + ')' + (o.genero ? ' · ' + esc(o.genero) : '') + '</li>'; }).join('');
    var links = (m.links || []).filter(function (l) { return /^200/.test(l.status_13_10_2026 || ''); }).map(function (l) { return link(l.url, l.rotulo); }).join(' · ');
    alvo.innerHTML = '<section class="creditos-saga"><h2>Créditos e <b>fundamentos</b></h2><h3 class="bloco">' + esc(m.nome) + '</h3>' + bio +
      (obras ? '<ul class="obras">' + obras + '</ul>' : '') + (links ? '<p class="autor-links">' + links + '</p>' : '') +
      blocoFundamentos(s) + '</section>';
  }

  /* ================= FONTES (ala) ================= */
  function montarFontes() {
    var alvo = $('#fontes-corpo');
    if (!alvo) return;
    var total = 0;
    var integral = 0;
    D.clones.forEach(function (c) { (c.citacoes || []).forEach(function (q) { total++; if (q.verificacao === 'texto-integral') integral++; }); });
    var est = $('#fontes-estat');
    if (est) est.innerHTML = '<b>' + D.clones.length + '</b> vozes · <b>' + total + '</b> citações verificadas · <b>' + integral + '</b> conferidas no texto integral · auditoria de ' + esc(D.geradoEm || '');
    alvo.innerHTML = D.clones.map(function (c) {
      return '<details class="fonte-clone"><summary>' + esc(c.nome) + ' <small>' + (c.citacoes || []).length + ' citações · ' + (c.fontes || []).length + ' obras</small></summary><ol>' +
        (c.fontes || []).map(function (f) { return '<li>' + esc(Voz.referenciaABNT(f).replace(/ Disponível em: <.*>\.$/, '')) + ' ' + (f.url ? link(f.url, 'ler') : '') + (f.dominio_publico ? ' <span class="dp">domínio público</span>' : '') + '</li>'; }).join('') +
        '</ol></details>';
    }).join('');
  }

  /* Créditos de todas as imagens — licenças CC BY-SA exigem atribuição visível. */
  function montarCreditos() {
    var alvo = $('#creditos-img');
    var lista = D['creditos-imagens'] || [];
    if (!alvo || !lista.length) return;
    alvo.innerHTML = '<h3 class="bloco">Créditos das imagens</h3><ol class="creditos">' + lista.map(function (c) {
      return '<li><b>' + esc(c.arquivo) + '</b>: ' + esc(c.atribuicao || c.titulo) + ' · ' + esc(c.licenca) + ' · ' + link(c.url_fonte, 'fonte') + '</li>';
    }).join('') + '</ol>';
  }

  /* ================= ZANQMON · 137 segundos de silêncio ================= */
  var ztimer = null;
  function zanqmon() {
    var v = $('#zveu');
    var n = $('#zn');
    var t = 137;
    v.classList.add('on');
    n.textContent = t;
    clearInterval(ztimer);
    ztimer = setInterval(function () { t--; n.textContent = t; if (t <= 0) fecharZ(); }, 1000);
  }
  function fecharZ() { clearInterval(ztimer); $('#zveu').classList.remove('on'); }

  /* ================= EVENTOS (delegação — sem JS embutido no HTML) ================= */
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-acao], [data-ala], [data-alvo], [data-conselho]');
    if (!el) return;
    if (el.dataset.ala) { ev.preventDefault(); setAla(el.dataset.ala); if (el.dataset.alvo) setTimeout(function () { irPara(el.dataset.alvo); }, 60); return; }
    if (el.dataset.alvo) { irPara(el.dataset.alvo); return; }
    if (el.dataset.conselho) { conselhoAtual = el.dataset.conselho; montarConselho(); refreshMesa(); return; }
    var a = el.dataset.acao;
    if (a === 'medalhao') cliqueMedalhao(el.dataset.id);
    else if (a === 'abrir') abrirCamara(el.dataset.id);
    else if (a === 'coruja') { setAla('conselhos', true); abrirCamara('coruja'); }
    else if (a === 'fechar-camara') fecharCamara();
    else if (a === 'enviar') enviar();
    else if (a === 'modo-ind') setModo('individual');
    else if (a === 'modo-sin') setModo('sinodo');
    else if (a === 'convocar') convocarSinodo();
    else if (a === 'tirar-mesa') cliqueMedalhao(el.dataset.id);
    else if (a === 'guardar-citacao') { guardarCitacao(el.dataset.clone, el.dataset.cit); el.textContent = 'guardado ✓'; el.disabled = true; }
    else if (a === 'diario') $('#camara').classList.toggle('diario-on');
    else if (a === 'anotar') { var t = $('#dnota').value.trim(); if (t) { registrarDiario('nota', 'eu', t); $('#dnota').value = ''; } }
    else if (a === 'baixar-diario') baixarDiario();
    else if (a === 'diario-peca') { fecharCamara(); setAla('peca'); trazerDoDiario(); }
    else if (a === 'trazer') trazerDoDiario();
    else if (a === 'imprimir') imprimirPeca();
    else if (a === 'zanqmon') zanqmon();
    else if (a === 'fechar-z') fecharZ();
    else if (a === 'filtro-livro') filtrarLivros(el.dataset.filtro);
    else if (a === 'perguntar') perguntarAgora($('#agora-q').value);
    else if (a === 'tema') { $('#agora-q').value = el.dataset.tema; perguntarAgora(el.dataset.tema); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { if ($('#zveu.on')) fecharZ(); else if ($('#camara.aberta')) fecharCamara(); }
    if (ev.key === 'Enter' && !ev.shiftKey) {
      if (ev.target.id === 'camIn') { ev.preventDefault(); enviar(); }
      else if (ev.target.id === 'sinodoQ') { ev.preventDefault(); convocarSinodo(); }
      else if (ev.target.id === 'agora-q') { ev.preventDefault(); perguntarAgora(ev.target.value); }
    }
  });
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'mapa-busca') filtrarLojas(ev.target.value);
    if (ev.target.closest && ev.target.closest('#ala-peca')) salvarPeca();
  });
  window.addEventListener('hashchange', function () { setAla(location.hash.slice(1).split('/')[0], true); });

  /* Scrollspy do Atlas */
  document.addEventListener('scroll', function () {
    if (!$('#ala-atlas.on')) return;
    var secoes = $$('#ala-atlas section');
    var at = secoes[0] && secoes[0].id;
    secoes.forEach(function (s) { if (window.scrollY + 150 >= s.offsetTop) at = s.id; });
    $$('#ala-atlas .subitem').forEach(function (b) { b.classList.toggle('on', b.dataset.alvo === at); });
  }, { passive: true });

  /* ================= INÍCIO ================= */
  montarAtlas();
  (function teaser() {
    var oe = D.atlas['operativa-especulativa'];
    var alvo = $('#teaser-corpo');
    if (!oe || !alvo || !oe.comparativo) return;
    alvo.innerHTML = renderTabela(oe.comparativo);
  })();
  montarConselho();
  montarMapa();
  montarSaga();
  montarCreditosSaga();
  montarFontes();
  montarCreditos();
  carregarPeca();
  renderDiario();
  refreshMesa();
  setAla(location.hash.slice(1).split('/')[0] || 'portico', true);
})();
