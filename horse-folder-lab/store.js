/* store.js: where the folder keeps what it is given. A local prototype: files are saved in this
   browser's IndexedDB, nowhere else. A drop counts as accepted only once the write has completed. */
const DB = 'horse-archive', STORE = 'files';
export const LIMITS = { maxBytes: 25 * 1024 * 1024, maxFiles: 20 };

function open() {
  return new Promise((ok, no) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  });
}
/* what was dropped, sorted into what can be kept and why the rest cannot */
export function validate(dataTransfer) {               // a DataTransfer, or anything with .files (a file input)
  const items = Array.from(dataTransfer.items || []), files = Array.from(dataTransfer.files || []);
  const accepted = [], skipped = [];
  files.forEach((f, i) => {
    const entry = items[i]?.webkitGetAsEntry?.();
    if (entry?.isDirectory) skipped.push({ name: f.name, why: 'folders can’t be added' });
    else if (f.size === 0) skipped.push({ name: f.name, why: 'empty' });
    else if (f.size > LIMITS.maxBytes) skipped.push({ name: f.name, why: 'over 25 MB' });
    else if (accepted.length >= LIMITS.maxFiles) skipped.push({ name: f.name, why: 'over 20 at once' });
    else accepted.push(f);
  });
  return { accepted, skipped };
}
/* resolves only when the transaction has committed */
export async function add(files) {
  const db = await open();
  return new Promise((ok, no) => {
    const tx = db.transaction(STORE, 'readwrite'), s = tx.objectStore(STORE), now = Date.now();
    for (const f of files) s.add({ name: f.name, type: f.type, size: f.size, added: now, blob: f });
    tx.oncomplete = () => { db.close(); ok(files.length); };
    tx.onerror = tx.onabort = () => { db.close(); no(tx.error || new Error('not saved')); };
  });
}
export async function list() {
  const db = await open();
  return new Promise((ok, no) => {
    const r = db.transaction(STORE).objectStore(STORE).getAll();
    r.onsuccess = () => { db.close(); ok(r.result.sort((a, b) => b.added - a.added || b.id - a.id)); };
    r.onerror = () => { db.close(); no(r.error); };
  });
}
export async function remove(id) {
  const db = await open();
  return new Promise((ok, no) => {
    const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { db.close(); ok(); }; tx.onerror = tx.onabort = () => { db.close(); no(tx.error); };
  });
}
