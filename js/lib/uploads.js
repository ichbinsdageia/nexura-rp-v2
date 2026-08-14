import { getSupabase, isSupabaseConfigured } from './supabase.js';
import { currentAuth } from './auth.js';
import { slugify } from './utils.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/gif']);

export async function uploadEvidenceImages(fileList, folder = 'submission') {
  const files = [...(fileList || [])].filter(file => file && file.size > 0);
  if (!files.length) return [];
  if (!isSupabaseConfigured()) return files.map(file => ({ demo: true, name: file.name, size: file.size, type: file.type }));
  const auth = await currentAuth();
  if (!auth.user) throw new Error('Für direkte Bild-Uploads ist ein Discord-Login erforderlich.');
  const supabase = await getSupabase();
  const uploaded = [];
  for (const file of files.slice(0, 6)) {
    if (!ALLOWED.has(file.type)) throw new Error(`${file.name}: Nur JPG, PNG, WEBP oder GIF sind erlaubt.`);
    if (file.size > MAX_IMAGE_SIZE) throw new Error(`${file.name}: Die Datei ist größer als 10 MB.`);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'img';
    const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'bild';
    const path = `${auth.user.id}/${slugify(folder)}/${crypto.randomUUID()}-${base}.${extension}`;
    const { error } = await supabase.storage.from('evidence').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) throw error;
    uploaded.push({ bucket: 'evidence', path, name: file.name, size: file.size, type: file.type });
  }
  return uploaded;
}
