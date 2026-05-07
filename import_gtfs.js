// ════════════════════════════════════════════════════════════════════════
//  BABIMOB_PWA — Ingestion GTFS → Supabase
//  Usage :
//    1) Créer un .env avec SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GTFS_DIR
//    2) npm install @supabase/supabase-js papaparse dotenv
//    3) node import_gtfs.js
//
//  Idempotent : à relancer, il écrase les données (upsert + truncate-and-load
//  selon la table). Un feed GTFS importé crée une ligne dans gtfs_feeds.
// ════════════════════════════════════════════════════════════════════════

const fs        = require('node:fs');
const path      = require('node:path');
const crypto    = require('node:crypto');
const Papa      = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GTFS_DIR     = process.env.GTFS_DIR
  || 'C:\\Users\\USER\\Documents\\BABIMOB\\abidjan_paratransit_gtfs_20230726';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  db:   { schema: 'public' }
});

const BATCH = 500;

// ────────────────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────────────────
function readCsv(fileName) {
  const full = path.join(GTFS_DIR, fileName);
  const raw  = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
  const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.warn(`⚠ ${fileName} : ${parsed.errors.length} erreur(s) de parsing`);
  }
  return parsed.data;
}

function fileChecksum(fileName) {
  const full = path.join(GTFS_DIR, fileName);
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(full));
  return h.digest('hex').slice(0, 16);
}

async function upsertBatch(table, rows, conflict) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await supabase.from(table).upsert(slice, { onConflict: conflict });
    if (error) {
      console.error(`✗ ${table} batch ${i}-${i + slice.length} :`, error.message);
      throw error;
    }
    process.stdout.write(`\r  ${table} : ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  process.stdout.write('\n');
}

const intOrNull   = v => (v === '' || v == null) ? null : parseInt(v, 10);
const floatOrNull = v => (v === '' || v == null) ? null : parseFloat(v);
const textOrNull  = v => (v === '' || v == null) ? null : String(v);

// ────────────────────────────────────────────────────────────────────────
//  Ingestion pipeline
// ────────────────────────────────────────────────────────────────────────
async function importFeed() {
  console.log('\n📦 feed_info.txt');
  const feed = readCsv('feed_info.txt')[0] || {};
  const checksum = fileChecksum('stops.txt');

  // 1) Si un feed avec le même checksum existe déjà, on le réutilise (idempotence).
  const { data: existing } = await supabase
    .from('gtfs_feeds')
    .select('id, version, is_active')
    .eq('checksum', checksum)
    .maybeSingle();

  if (existing) {
    // S'assurer qu'il est actif (et désactiver les autres si besoin).
    await supabase.from('gtfs_feeds').update({ is_active: false }).neq('id', existing.id);
    await supabase.from('gtfs_feeds').update({ is_active: true }).eq('id', existing.id);
    console.log(`  ✓ feed existant réutilisé : id=${existing.id} version=${existing.version}`);
    return;
  }

  // 2) Nouveau feed → on désactive TOUS les feeds actifs AVANT l'insert,
  //    sinon l'index unique partiel (is_active WHERE is_active) bloque.
  await supabase.from('gtfs_feeds').update({ is_active: false }).eq('is_active', true);

  const { data: feedRow, error } = await supabase.from('gtfs_feeds').insert({
    version    : feed.feed_version || '0.1',
    publisher  : feed.feed_publisher_name,
    start_date : feed.feed_start_date ? formatDate(feed.feed_start_date) : null,
    end_date   : feed.feed_end_date   ? formatDate(feed.feed_end_date)   : null,
    checksum   : checksum,
    is_active  : true
  }).select().single();
  if (error) throw error;
  console.log(`  ✓ feed créé : id=${feedRow.id} version=${feedRow.version}`);
}

function formatDate(yyyymmdd) {
  const s = String(yyyymmdd);
  return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}

async function importAgencies() {
  console.log('\n🏢 agency.txt');
  const rows = readCsv('agency.txt');
  // Déduplication : agency_id peut apparaître plusieurs fois (ex. Woro-woro d'Attécoubé)
  const seen = new Map();
  for (const r of rows) {
    const id = r.agency_id?.trim();
    if (!id) continue;
    if (!seen.has(id)) {
      seen.set(id, {
        agency_id       : id,
        agency_name     : r.agency_name?.trim() || id,
        agency_lang     : textOrNull(r.agency_lang),
        agency_timezone : r.agency_timezone || 'Africa/Abidjan',
        agency_url      : textOrNull(r.agency_url),
        agency_phone    : textOrNull(r.agency_phone),
        agency_email    : textOrNull(r.agency_email)
      });
    }
  }
  await upsertBatch('gtfs_agencies', [...seen.values()], 'agency_id');
  console.log(`  ✓ ${seen.size} agences (${rows.length - seen.size} doublons ignorés)`);
}

async function importCalendar() {
  console.log('\n📅 calendar.txt');
  const rows = readCsv('calendar.txt').map(r => ({
    service_id : r.service_id,
    monday     : r.monday === '1',
    tuesday    : r.tuesday === '1',
    wednesday  : r.wednesday === '1',
    thursday   : r.thursday === '1',
    friday     : r.friday === '1',
    saturday   : r.saturday === '1',
    sunday     : r.sunday === '1',
    start_date : r.start_date ? formatDate(r.start_date) : null,
    end_date   : r.end_date   ? formatDate(r.end_date)   : null
  }));
  await upsertBatch('gtfs_calendar', rows, 'service_id');
}

async function importRoutes() {
  console.log('\n🚌 routes.txt');
  const rows = readCsv('routes.txt').map(r => ({
    route_id         : r.route_id,
    agency_id        : textOrNull(r.agency_id),
    route_short_name : textOrNull(r.route_short_name),
    route_long_name  : textOrNull(r.route_long_name),
    route_desc       : textOrNull(r.route_desc),
    route_type       : intOrNull(r.route_type),
    route_color      : textOrNull(r.route_color),
    route_text_color : textOrNull(r.route_text_color)
  })).filter(r => r.route_id);
  await upsertBatch('gtfs_routes', rows, 'route_id');
}

async function importStops() {
  console.log('\n📍 stops.txt');
  const rows = readCsv('stops.txt')
    .filter(r => r.stop_id && r.stop_lat && r.stop_lon)
    .map(r => ({
      stop_id        : r.stop_id,
      stop_name      : r.stop_name || '(sans nom)',
      stop_desc      : textOrNull(r.stop_desc),
      stop_lat       : parseFloat(r.stop_lat),
      stop_lon       : parseFloat(r.stop_lon),
      location_type  : intOrNull(r.location_type) ?? 0,
      parent_station : textOrNull(r.parent_station),
      stop_code      : textOrNull(r.stop_code),
      stop_url       : textOrNull(r.stop_url)
    }));
  await upsertBatch('gtfs_stops', rows, 'stop_id');
}

async function importTrips() {
  console.log('\n🎫 trips.txt');
  const rows = readCsv('trips.txt').map(r => ({
    trip_id              : r.trip_id,
    route_id             : textOrNull(r.route_id),
    service_id           : textOrNull(r.service_id),
    shape_id             : textOrNull(r.shape_id),
    trip_headsign        : textOrNull(r.trip_headsign),
    trip_short_name      : textOrNull(r.trip_short_name),
    direction_id         : intOrNull(r.direction_id),
    wheelchair_accessible: intOrNull(r.wheelchair_accessible)
  })).filter(r => r.trip_id);
  await upsertBatch('gtfs_trips', rows, 'trip_id');
}

async function importStopTimes() {
  console.log('\n⏱️  stop_times.txt');
  const rows = readCsv('stop_times.txt').map(r => ({
    trip_id        : r.trip_id,
    stop_id        : r.stop_id,
    stop_sequence  : intOrNull(r.stop_sequence),
    arrival_time   : textOrNull(r.arrival_time),
    departure_time : textOrNull(r.departure_time),
    stop_headsign  : textOrNull(r.stop_headsign),
    pickup_type    : intOrNull(r.pickup_type),
    drop_off_type  : intOrNull(r.drop_off_type),
    timepoint      : intOrNull(r.timepoint)
  })).filter(r => r.trip_id && r.stop_id && r.stop_sequence != null);
  await upsertBatch('gtfs_stop_times', rows, 'trip_id,stop_sequence');
}

async function importFrequencies() {
  console.log('\n🔁 frequencies.txt');
  const rows = readCsv('frequencies.txt').map(r => ({
    trip_id      : r.trip_id,
    start_time   : r.start_time,
    end_time     : r.end_time,
    headway_secs : intOrNull(r.headway_secs),
    exact_times  : intOrNull(r.exact_times) ?? 0
  })).filter(r => r.trip_id && r.start_time);
  await upsertBatch('gtfs_frequencies', rows, 'trip_id,start_time');
}

async function importShapes() {
  console.log('\n🗺️  shapes.txt (74k lignes, patience…)');
  const rows = readCsv('shapes.txt').map(r => ({
    shape_id            : r.shape_id,
    shape_pt_sequence   : intOrNull(r.shape_pt_sequence),
    shape_pt_lat        : parseFloat(r.shape_pt_lat),
    shape_pt_lon        : parseFloat(r.shape_pt_lon),
    shape_dist_traveled : floatOrNull(r.shape_dist_traveled)
  })).filter(r => r.shape_id && r.shape_pt_sequence != null);
  await upsertBatch('gtfs_shapes', rows, 'shape_id,shape_pt_sequence');
}

async function postImport() {
  console.log('\n🔧 Post-traitement');

  // On ne peut pas exécuter du SQL arbitraire via supabase-js (pas de RPC exec_sql).
  // On compte les communes pour savoir quelle consigne afficher à l'utilisateur.
  const { count, error } = await supabase
    .from('communes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.warn('  ⚠ Impossible de lire la table communes :', error.message);
  }

  console.log('\n  ⓘ Étape manuelle à exécuter dans l\'éditeur SQL de Supabase :');
  console.log('     ────────────────────────────────────────────────────────');
  console.log('     REFRESH MATERIALIZED VIEW gtfs_shape_lines;');
  if (count && count > 0) {
    console.log('     UPDATE gtfs_stops SET commune = detecter_commune(stop_lat, stop_lon);');
  } else {
    console.log('     -- (exécute d\'abord seed_communes.sql, puis le UPDATE ci-dessous)');
    console.log('     UPDATE gtfs_stops SET commune = detecter_commune(stop_lat, stop_lon);');
  }
  console.log('     ────────────────────────────────────────────────────────');
}

// ────────────────────────────────────────────────────────────────────────
//  Main
// ────────────────────────────────────────────────────────────────────────
(async () => {
  const t0 = Date.now();
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' BABIMOB_PWA — Ingestion GTFS');
  console.log(` Source : ${GTFS_DIR}`);
  console.log(` Cible  : ${SUPABASE_URL}`);
  console.log('═══════════════════════════════════════════════════════════');

  try {
    await importFeed();
    await importAgencies();
    await importCalendar();
    await importRoutes();
    await importStops();
    await importTrips();
    await importStopTimes();
    await importFrequencies();
    await importShapes();
    await postImport();

    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✅ Import terminé en ${dt}s`);
  } catch (e) {
    console.error('\n❌ Échec :', e.message);
    process.exit(1);
  }
})();
