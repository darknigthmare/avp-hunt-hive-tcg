import {readFileSync} from 'node:fs';
import {createContext, Script} from 'node:vm';

export const root = new URL('../', import.meta.url);
export const runtimeModules = JSON.parse(readFileSync(new URL('content-plan/runtime-modules.json', root), 'utf8'));

export function loadRuntime({rules = false, collection = false} = {}) {
  const context = createContext({window: {}, Intl, Date, Math});
  const files = [...runtimeModules.data, ...(rules ? runtimeModules.rules : []), ...(collection ? ['collection'] : [])];
  for (const name of files) {
    new Script(readFileSync(new URL('src/' + name + '.js', root), 'utf8'), {filename: name + '.js'})
      .runInContext(context, {timeout: 15000});
  }
  return context.window;
}

export function encodeCSV(rows) {
  return rows.map(row => row.map(value => {
    const text = String(value ?? '');
    return /[",\n\r]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }).join(',')).join('\n') + '\n';
}

export function parseCSV(raw) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<raw.length;i++) {
    const c=raw[i];
    if(quoted) {
      if(c==='"'&&raw[i+1]==='"'){cell+='"';i++;}
      else if(c==='"')quoted=false;
      else cell+=c;
    }else if(c==='"')quoted=true;
    else if(c===','){row.push(cell);cell='';}
    else if(c==='\n'){row.push(cell);rows.push(row);row=[];cell='';}
    else if(c!=='\r')cell+=c;
  }
  if(cell||row.length){row.push(cell);rows.push(row);}
  if(quoted||rows.some(r=>r.length!==rows[0].length))throw new Error('Invalid CSV source');
  return rows;
}
