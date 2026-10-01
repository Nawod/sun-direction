const test = require('node:test');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://localhost:8001';

test('home exposes useful server HTML and a query-free canonical', async()=>{
  const html=await (await fetch(base+'/?origin=Example&dest=Other')).text();
  assert.match(html,/<h2[^>]*>Which side of the bus or train gets less sun\?/);
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];
  assert.equal(new URL(canonical).search,'');
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(new URL(schema.url).origin,new URL(canonical).origin);
  assert.match(html,/property="og:image"/);
});
test('robots, sitemap and reference agree on one public origin',async()=>{
  const robots=await (await fetch(base+'/robots.txt')).text();
  const sitemap=await (await fetch(base+'/sitemap.xml')).text();
  const origin=new URL(robots.match(/Sitemap: (.+)/)[1].trim()).origin;
  assert.ok(sitemap.includes(origin+'/guide'));
  assert.match(robots,/Allow: \//);
  const response=await fetch(base+'/llms.txt');
  assert.match(response.headers.get('content-type'),/text\/plain/);
  const reference=await response.text();
  assert.ok(reference.includes(origin+'/guide'));
  assert.match(reference,/No public routing API/);
  const guide=await(await fetch(base+'/guide')).text();
  assert.match(guide,/<h1>Sun Direction guide<\/h1>/);
  assert.match(guide,/Browser-agent reference/);
  assert.match(guide,/aria-label="Planner resources"/);
});
