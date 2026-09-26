/**
 * Teste de consistencia do motor de relatorios contra o DADO REAL do banco.
 *
 *   node tools/test-relatorios.mjs
 *
 * Extrai a logica pura (funcoes rel*) do index.html, baixa os dados via API REST
 * do Supabase (mesma chave publica que o site usa) e confere: soma dos trimestres
 * = ano, categorias somam o total, detalhes somam a categoria, saldo, e geracao
 * de HTML para todos os meses/trimestres/anual. Rode depois de mexer nos relatorios.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');

const SUPA_URL = html.match(/const SUPA_URL='([^']+)'/)[1];
const SUPA_KEY = html.match(/const SUPA_KEY='([^']+)'/)[1];
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
const get = async (q) => {
  const r = await fetch(`${SUPA_URL}/rest/v1/${q}`, { headers: H });
  if (!r.ok) throw new Error(`${q} -> HTTP ${r.status}`);
  return r.json();
};

const marker = 'const db=createClient(SUPA_URL,SUPA_KEY);';
const code = html.slice(html.indexOf(marker) + marker.length, html.indexOf("window.addEventListener('DOMContentLoaded'"));

const [cfg] = await get('config?select=nome_loja,saldo_ant_loja,saldo_ant_tronco,mens_val_mes,ano&limit=1');
const ano = cfg.ano;
const yr = `data=gte.${ano}-01-01&data=lt.${ano + 1}-01-01`;
const [irmaos, ent, sai, tEnt, tSai] = await Promise.all([
  get('irmaos?select=nome,status,grau,acao,regular_desde,irregular_desde,kit_placet_desde,mes_inicial'),
  get(`entradas_loja?select=data,razao,irmao,valor,meses_ref&${yr}`),
  get(`saidas_loja?select=data,categoria,agape_tipo,valor,descricao&${yr}`),
  get(`tronco_entradas?select=data,sessao,qtd,esp,pix,total,qtdpix,magna&${yr}`),
  get(`tronco_saidas?select=data,descricao,valor&${yr}`),
]);

const yearOf = (s) => (s ? parseInt(s.split('-')[0]) : ano);
globalThis.__D__ = {
  cfg, irmaos: irmaos.map((r) => ({ ...r, acao: r.acao || null, mes_inicial: r.mes_inicial ?? null })),
  e: ent.map((r) => ({ ...r, ano: yearOf(r.data), mesesRef: r.meses_ref || [], valor: +r.valor })),
  s: sai.map((r) => ({ ...r, cat: r.categoria, agapeTipo: r.agape_tipo, desc: r.descricao, valor: +r.valor })),
  te: tEnt.map((r) => ({ ...r, ano: yearOf(r.data), esp: +r.esp || 0, pix: +r.pix || 0, total: +r.total || 0, qtdpix: r.qtdpix || 0 })),
  ts: tSai.map((r) => ({ ...r, desc: r.descricao, valor: +r.valor })),
};
const inject = `
Object.assign(S.config,__D__.cfg,{saldo_ant_loja:+__D__.cfg.saldo_ant_loja||0,saldo_ant_tronco:+__D__.cfg.saldo_ant_tronco||0});
S.irmaos=__D__.irmaos;S.entradasLoja=__D__.e;S.saidasLoja=__D__.s;S.troncoEntradas=__D__.te;S.troncoSaidas=__D__.ts;
globalThis.X={relLojaAgregar,relLojaLinhasDespesa,relLojaLinhasReceita,relGerarHtmlLoja,relTroncoAgregar,relGerarHtmlTronco,relAgapeAgregar,relGerarHtmlAgape,relMensalidadePeriodo};`;
new Function(code + '\n' + inject)();
const X = globalThis.X;

let fails = 0;
const r2 = (v) => Math.round(v * 100) / 100;
const check = (desc, a, b) => {
  if (Math.abs(r2(a) - r2(b)) < 0.01) console.log('OK   ', desc);
  else { fails++; console.log('FALHOU', desc, '->', r2(a), 'vs', r2(b)); }
};

const meses = (t) => [0, 1, 2].map((i) => (t - 1) * 3 + i);
const all = [...Array(12).keys()];

console.log(`Dados de ${ano}: ${ent.length} entradas, ${sai.length} saidas, ${tEnt.length} sessoes do tronco\n`);

const q = [1, 2, 3, 4].map((t) => X.relLojaAgregar(meses(t), ano));
const yA = X.relLojaAgregar(all, ano);
check('Loja: receitas dos 4 trimestres = ano', q.reduce((s, a) => s + a.totalReceitas, 0), yA.totalReceitas);
check('Loja: despesas dos 4 trimestres = ano', q.reduce((s, a) => s + a.totalDespesas, 0), yA.totalDespesas);
check('Loja: receitas do motor = soma bruta do banco', yA.totalReceitas, ent.reduce((s, r) => s + +r.valor, 0));
check('Loja: despesas do motor = soma bruta do banco', yA.totalDespesas, sai.reduce((s, r) => s + +r.valor, 0));
check('Loja: categorias somam o total de despesas', X.relLojaLinhasDespesa([yA]).reduce((s, l) => s + l.valores[0], 0), yA.totalDespesas);
X.relLojaLinhasDespesa([yA]).filter((l) => l.detalhe).forEach((l) =>
  check(`Loja: detalhe de "${l.label}" soma a categoria`, l.detalhe.reduce((s, d) => s + d.valores[0], 0), l.valores[0]));
check('Loja: grupos de receita somam o total', X.relLojaLinhasReceita([yA]).reduce((s, l) => s + l.valores[0], 0), yA.totalReceitas);

const tq = [1, 2, 3, 4].map((t) => X.relTroncoAgregar(meses(t), ano));
const tA = X.relTroncoAgregar(all, ano);
check('Tronco: receitas dos trimestres = ano', tq.reduce((s, a) => s + a.totalReceitas, 0), tA.totalReceitas);
check('Tronco: despesas dos trimestres = ano', tq.reduce((s, a) => s + a.totalDespesas, 0), tA.totalDespesas);
check('Tronco: despesas do motor = soma bruta do banco', tA.totalDespesas, tSai.reduce((s, r) => s + +r.valor, 0));
check('Tronco: "outras doacoes" detalhadas somam a linha', Object.values(tA.outrasDet).reduce((s, v) => s + v, 0), tA.despesas.outras);

const aq = [1, 2, 3, 4].map((t) => X.relAgapeAgregar(meses(t), ano));
const aA = X.relAgapeAgregar(all, ano);
check('Agape: trimestres = ano', aq.reduce((s, a) => s + a.total, 0), aA.total);
check('Agape: mao de obra + compras = total', aA.maoDeObra + aA.compras, aA.total);
check('Agape: total = soma bruta da categoria agape', aA.total, sai.filter((r) => r.categoria === 'agape').reduce((s, r) => s + +r.valor, 0));

X.relMensalidadePeriodo(all, ano).forEach((m) => {
  if (m.recebido > m.previsto + 0.01) { fails++; console.log('FALHOU mensalidade: recebido > previsto no mes', m.mi); }
});

for (let mi = 0; mi < 12; mi++) for (const modo of ['simples', 'detalhado']) X.relGerarHtmlLoja('mensal', mi, modo);
for (let t = 1; t <= 4; t++) for (const modo of ['simples', 'detalhado']) X.relGerarHtmlLoja('trimestral', t, modo);
for (const modo of ['simples', 'detalhado']) X.relGerarHtmlLoja('anual', null, modo);
for (const tipo of ['mensal', 'trimestral', 'anual']) {
  const v = tipo === 'mensal' ? 0 : tipo === 'trimestral' ? 1 : null;
  X.relGerarHtmlTronco(tipo, v); X.relGerarHtmlAgape(tipo, v);
}
console.log('OK    HTML gerado sem erro para todos os periodos e modos');

console.log(fails ? `\n${fails} TESTE(S) FALHARAM` : '\nTODOS OS TESTES PASSARAM');
process.exit(fails ? 1 : 0);
