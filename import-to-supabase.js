/**
 * Simple Node script to import questions.json into Supabase
 * Usage:
 *   1) npm i @supabase/supabase-js
 *   2) export SUPABASE_URL=... SUPABASE_KEY=...
 *   3) node import-to-supabase.js
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if(!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const raw = fs.readFileSync('data/questions.json', 'utf8');
  const data = JSON.parse(raw);
  const categories = data.categories;
  const years = data.years || [];
  const codes = data.codes || [];

  const catRows = Object.keys(categories).map(key => ({
    key,
    title: categories[key].title,
    description: categories[key].desc || categories[key].description || null,
    accent: categories[key].accent || null
  }));
  console.log('Upserting categories...', catRows.length);
  let { error } = await supabase.from('categories').upsert(catRows, { onConflict: ['key'] });
  if(error) { console.error('Categories upsert error:', error); return; }

  const qRows = [];
  Object.keys(categories).forEach(key => {
    const qs = categories[key].questions || [];
    qs.forEach(q => {
      qRows.push({
        category_key: key,
        q: q.q,
        options: q.options,
        correct: q.correct,
        article: q.article || null,
        exp: q.exp || null
      });
    });
  });

  console.log('Inserting questions...', qRows.length);
  const chunkSize = 200;
  for(let i=0;i<qRows.length;i+=chunkSize){
    const chunk = qRows.slice(i, i+chunkSize);
    const res = await supabase.from('questions').insert(chunk);
    if(res.error) { console.error('Insert questions error:', res.error); return; }
  }

  if(years.length){
    console.log('Inserting years...', years.length);
    await supabase.from('years').insert(years.map(y => ({ year: y.year, date: y.date, title: y.title, description: y.desc })));
  }

  if(codes.length){
    console.log('Inserting codes...', codes.length);
    await supabase.from('codes').insert(codes);
  }

  console.log('Import finished.');
}

main().catch(err => console.error(err));
