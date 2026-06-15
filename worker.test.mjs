import { test } from "node:test";
import assert from "node:assert/strict";
import { Utils } from "./worker.js";

test("escapeHtml escapes all special characters", () => {
  assert.equal(
    Utils.escapeHtml(`<a href="x">'&</a>`),
    "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&lt;/a&gt;",
  );
});

test("escapeHtml handles empty/nullish input", () => {
  assert.equal(Utils.escapeHtml(""), "");
  assert.equal(Utils.escapeHtml(null), "");
  assert.equal(Utils.escapeHtml(undefined), "");
});

test("sanitizeLinks preserves safe schemes (https, relative, anchor, mailto)", () => {
  const html =
    '<a href="https://ok.com">a</a>' +
    '<a href="/rel">r</a>' +
    '<a href="#anchor">#</a>' +
    '<a href="mailto:x@y.com">m</a>';
  assert.equal(Utils.sanitizeLinks(html), html);
});

test("sanitizeLinks neutralizes javascript: href", () => {
  assert.equal(
    Utils.sanitizeLinks('<a href="javascript:alert(1)">x</a>'),
    '<a href="#">x</a>',
  );
});

test("sanitizeLinks neutralizes data: and vbscript: href", () => {
  assert.equal(
    Utils.sanitizeLinks('<a href="data:text/html,<script>">d</a>'),
    '<a href="#">d</a>',
  );
  assert.equal(
    Utils.sanitizeLinks('<a href="vbscript:msgbox">v</a>'),
    '<a href="#">v</a>',
  );
});

test("sanitizeLinks handles empty/nullish input", () => {
  assert.equal(Utils.sanitizeLinks(""), "");
  assert.equal(Utils.sanitizeLinks(null), "");
});

test("generateExcerpt strips headers and code blocks", () => {
  const md = "# Title\n```js\nconst x = 1;\n```\nHello world";
  assert.equal(Utils.generateExcerpt(md), "Hello world");
});

test("generateExcerpt truncates long content", () => {
  const long = "a".repeat(300);
  const ex = Utils.generateExcerpt(long);
  assert.ok(ex.endsWith("..."), `expected trailing ellipsis, got: ${ex}`);
  assert.equal(ex.length, 200 + "...".length);
});
