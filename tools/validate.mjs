/**
 * Validador do SisFinMaçonaria — roda ANTES de todo push.
 *
 *   node tools/validate.mjs
 *
 * Verifica:
 *   1. HTML tem <head>, </body> e </html> e as tags <script> fecham certo
 *   2. O bloco <script> inline compila sem erro de sintaxe (chaves/parenteses
 *      balanceados, virgulas, etc.) — usa o proprio motor do Node
 *   3. Contagem bruta de {} [] () como diagnostico extra em caso de erro
 *
 * Sai com codigo 1 se achar qualquer problema (o hook de pre-push aborta).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, 'index.html');

const problems = [];
const ok = (m) => console.log('  \x1b[32m✓\x1b[0m ' + m);
const fail = (m) => { problems.push(m); console.log('  \x1b[31m✗\x1b[0m ' + m); };

let html;
try {
  html = readFileSync(FILE, 'utf8');
} catch (e) {
  console.error('Nao consegui ler index.html:', e.message);
  process.exit(1);
}

console.log('\nValidando index.html (' + html.length.toLocaleString('pt-BR') + ' bytes)\n');

/* ---- 1. Sanidade do HTML ---- */
for (const tag of ['<head>', '</head>', '<body', '</body>', '</html>']) {
  if (html.includes(tag)) ok('tem ' + tag);
  else fail('faltando ' + tag);
}

const openScripts = (html.match(/<script\b/gi) || []).length;
const closeScripts = (html.match(/<\/script>/gi) || []).length;
if (openScripts === closeScripts) ok(`tags <script> balanceadas (${openScripts})`);
else fail(`<script> abre ${openScripts}x mas fecha ${closeScripts}x`);

/* ---- 2. Sintaxe do JS inline ---- */
const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter((m) => !/\bsrc\s*=/i.test(m[1]))
  .map((m) => ({ code: m[2], startLine: html.slice(0, m.index).split('\n').length }));

if (blocks.length === 0) {
  fail('nenhum bloco <script> inline encontrado');
} else {
  for (const b of blocks) {
    try {
      // Compila (nao executa) o corpo do script. Pega erro de sintaxe real.
      new Function(b.code); // eslint-disable-line no-new-func
      ok(`bloco <script> da linha ${b.startLine} compila sem erro de sintaxe`);
    } catch (e) {
      fail(`erro de sintaxe no <script> (comeca na linha ${b.startLine} do HTML): ${e.message}`);
      // Diagnostico: contagem bruta de delimitadores, ignorando o obvio
      const counts = { '{': 0, '}': 0, '(': 0, ')': 0, '[': 0, ']': 0 };
      for (const ch of b.code) if (ch in counts) counts[ch]++;
      const d = (a, z) => {
        const diff = counts[a] - counts[z];
        if (diff !== 0) console.log(`      ${a}${z}: ${counts[a]} x ${counts[z]}  (sobra ${diff > 0 ? diff + ' "' + a + '"' : -diff + ' "' + z + '"'})`);
      };
      d('{', '}'); d('(', ')'); d('[', ']');
    }
  }
}

/* ---- Resultado ---- */
console.log('');
if (problems.length) {
  console.log('\x1b[31m' + problems.length + ' problema(s). Corrija antes de publicar.\x1b[0m\n');
  process.exit(1);
}
console.log('\x1b[32mTudo certo — pode publicar.\x1b[0m\n');
