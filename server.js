const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
const PW = process.env.ADMIN_PASSWORD;
if (!PW) { console.error('Thiếu biến môi trường ADMIN_PASSWORD'); process.exit(1); }
const seed = require('./seed.json');
const RANKS = ['F','F+','D','D+','C','C+','B','B+','A','A+','S','S+','SS','SS+','X'];

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));

const sign = e => crypto.createHmac('sha256', PW).update(String(e)).digest('hex');
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
function auth(req, res, next) {
  const [e, sig] = (req.headers.authorization || '').replace('Bearer ', '').split('.');
  if (e && sig && +e > Date.now() && eq(sig, sign(e))) return next();
  res.status(401).json({ error: 'unauthorized' });
}

const tries = {};
app.post('/api/login', (req, res) => {
  const n = tries[req.ip] || { c: 0, t: Date.now() };
  if (Date.now() - n.t > 600000) { n.c = 0; n.t = Date.now(); }
  if (n.c >= 10) return res.status(429).json({ error: 'too many' });
  const pw = req.body && req.body.password;
  if (typeof pw === 'string' && eq(pw, PW)) {
    const exp = Date.now() + 12 * 3600 * 1000;
    return res.json({ token: exp + '.' + sign(exp) });
  }
  n.c++; tries[req.ip] = n;
  res.status(401).json({ error: 'wrong' });
});

const S = (v, n) => String(v ?? '').slice(0, n);
function clean(b) {
  if (!b || typeof b.id !== 'number' || !S(b.title, 1).trim()) return null;
  const q = {
    id: b.id, type: b.type === 'story' ? 'story' : 'guild',
    title: S(b.title, 120), desc: S(b.desc, 1500), area: S(b.area, 120),
    status: ['open', 'done', 'expired', 'paused'].includes(b.status) ? b.status : 'open'
  };
  if (typeof b.img === 'string' && b.img.startsWith('data:image/') && b.img.length < 900000) q.img = b.img;
  if (q.type === 'story') { q.sub = b.sub === 'char' ? 'char' : 'main'; q.char = S(b.char, 60); }
  else {
    q.rank = RANKS.includes(b.rank) ? b.rank : 'F';
    ['gold', 'gem', 'stat', 'skill'].forEach(k => q[k] = Math.max(0, Math.min(1e9, +b[k] || 0)));
    q.item = S(b.item, 80);
  }
  return q;
}

app.get('/api/quests', async (req, res) => {
  try {
    if (!(await redis.get('quests:seeded'))) {
      const o = {}; seed.forEach(q => o[q.id] = q);
      await redis.hset('quests', o); await redis.set('quests:seeded', 1);
    }
    const h = (await redis.hgetall('quests')) || {};
    res.json(Object.values(h).sort((a, b) => a.id - b.id));
  } catch (e) { console.error(e); res.status(500).json({ error: 'db' }); }
});
app.post('/api/quests', auth, async (req, res) => {
  const q = clean(req.body);
  if (!q) return res.status(400).json({ error: 'invalid' });
  try { await redis.hset('quests', { [q.id]: q }); res.json(q); }
  catch (e) { console.error(e); res.status(500).json({ error: 'db' }); }
});
app.delete('/api/quests/:id', auth, async (req, res) => {
  try { await redis.hdel('quests', req.params.id); res.json({ ok: true }); }
  catch (e) { console.error(e); res.status(500).json({ error: 'db' }); }
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(process.env.PORT || 3000, () => console.log('Asteria Quest Board đang chạy'));
