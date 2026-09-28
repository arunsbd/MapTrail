import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { US_STATE_SHAPES } from '../data/map';
import { loadDataset } from '../lib/clue-ladder/load';
import { compileLadder, cumulativeCandidates, publishManifest } from '../lib/clue-ladder/compile';
import { candidates, predicateMetrics } from '../lib/clue-ladder/predicates';
import { recomputeDerived } from '../lib/clue-ladder/derive';
import { validateDataset } from '../lib/clue-ladder/validate';
import { ENGINE_VERSION, type Dataset } from '../lib/clue-ladder/dataset';
import type { ClueRecord, FactRecord, Predicate, SourceRecord, StateId } from '../lib/clue-ladder/types';
import { BATCH_01 } from './batch-01-config';

const base = 'data/clue-ladder', priorId = 'us-states-2026-09-05-v2', snapshotId = 'us-states-2026-09-05-v3';
const dir = `snapshots/${snapshotId}`, version = 'short-seven-batch-01-v1';
if (existsSync(`${base}/${dir}/context.json`)) throw new Error('Snapshot already exists; create a new version instead of overwriting.');
const data: Dataset = JSON.parse(JSON.stringify(loadDataset(priorId)), (_key, value) =>
  typeof value === 'string' && (value === priorId || value.startsWith(priorId + ':')) ? value.replace(priorId, snapshotId) : value);
const createdAt = new Date().toISOString();
data.snapshot = {...data.snapshot, snapshotId, createdAt, contextFile: `${dir}/context.json`, clueSetVersion: version};
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const save = (path: string, value: unknown) => writeFileSync(`${base}/${path}`, JSON.stringify(value, null, 2) + '\n');
const review = readFileSync(`${base}/${dir}/raw/batch-01-review.md`, 'utf8');
const reference = JSON.parse(readFileSync(`${base}/snapshots/us-states-2026-09-05-v1/reference-inputs.json`, 'utf8'));
type Place = {code: string; name: string; population: number | null; suppressionCode: string | null; row: number; column: string; sheet: string};
const places: Place[] = JSON.parse(readFileSync(`${base}/${dir}/place-inputs.json`, 'utf8'));
const placeId = (p: Place) => `place:${p.code}:${p.name.split(',')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
const factId = (subject: string, metric: string) => `${snapshotId}:${subject}:${metric}`;
const archive = (source: SourceRecord, filename: string) => {
  const digest = sha(readFileSync(`${base}/${dir}/raw/${filename}`));
  data.sources.push({...source, sha256: digest});
  data.snapshot.sourceFiles.push({sourceId: source.sourceId, path: `${dir}/raw/${filename}`, sha256: digest});
};
archive({sourceId:'BATCH-01-HANDOFF', publisher:'MapTrail research handoff', title:'Batch 01 research review', landingPageUrl:'https://www.census.gov/', retrievedAt:createdAt, coverage:{}, authorityTier:3, updateClass:'static', notes:'User-provided review received for integration. Archived unchanged; not a replacement for its cited primary sources.'}, 'batch-01-review.md');
archive({sourceId:'GOOGLE-FIRST-OFFICE', publisher:'Google', title:'Our story: From the garage to the Googleplex', landingPageUrl:'https://about.google/company-info/our-story/', downloadUrl:'https://about.google/company-info/our-story/', retrievedAt:createdAt, coverage:{}, authorityTier:1, updateClass:'static'}, 'google-history.html');
data.sources.push({sourceId:'CEN-GUIDE-BATCH-01', publisher:'U.S. Census Bureau', title:'Guide to State and Local Census Geography: batch 01', landingPageUrl:'https://www.census.gov/geographies/reference-files/2010/geo/state-local-geo-guides-2010.html', retrievedAt:createdAt, coverage:{}, authorityTier:1, updateClass:'static', notes:'Capital values transcribed from the supplied batch audit with state-specific section locators. Timestamp is handoff receipt; original guide pages were not independently downloaded.'});
for (const [code, config] of Object.entries(BATCH_01)) archive({sourceId:`CEN-PLACES-BATCH01-${code}`, publisher:'U.S. Census Bureau', title:`${config.name} incorporated-place population estimates`, landingPageUrl:'https://www.census.gov/data/tables/time-series/demo/popest/2020s-total-cities-and-towns.html', downloadUrl:`https://www2.census.gov/programs-surveys/popest/tables/2020-2025/cities/totals/SUB-IP-EST2025-POP-${config.fips}.xlsx`, retrievedAt:createdAt, coverage:{referenceDate:'2025-07-01'}, editionOrVintage:'Vintage 2025', authorityTier:1, updateClass:'annual', notes:'Copied supplied workbook and checked hash against handoff. Alaska hash typo independently corrected against a fresh Census download.'}, `SUB-IP-EST2025-POP-${config.fips}.xlsx`);

function addFact(subjectId: string, metricId: string, value: FactRecord['value'], sourceRefs: FactRecord['sourceRefs'], referencePeriod: FactRecord['referencePeriod'] = {kind:'static'}, extra: Partial<FactRecord> = {}) {
  const metric = data.metrics.find(m => m.metricId === metricId)!;
  const fact: FactRecord = {factId:factId(subjectId, metricId), subjectId, metricId, value, sourceRefs, referencePeriod, snapshotId, quality:{status:'verified', verifiedAt:createdAt, notes:'Batch handoff checked against archived input or complete reference facts; see source locator.'}, ...(metric.unit ? {unit:metric.unit} : {}), ...extra};
  data.facts.push(fact); return fact;
}
data.metrics.push({metricId:'place.batch01_membership', label:'Batch 01 named Census entities by containing state', definition:'Closed inverse index of only the six batch workbooks and six audited capital names. Empty lists exclude these specific entities, not all places.', valueType:'id_list', preferredPublisher:'U.S. Census Bureau', timeSensitive:false, rankable:false, allowedClueCategories:['cities','capital']});
data.metrics.push({metricId:'association.google_first_office', label:'Google first-office state membership', definition:'Closed finite entity index for Google first office in Menlo Park, California, as explicitly stated in Google history. Does not describe founding or incorporation location.', valueType:'id_list', preferredPublisher:'Google', timeSensitive:false, rankable:false, allowedClueCategories:['landmark']});
for (const state of data.universe) {
  const code = state.slice(3), config = BATCH_01[code as keyof typeof BATCH_01];
  const value = [...places.filter(p => p.code === code).map(placeId), ...(config ? [config.capital] : [])];
  addFact(state, 'place.batch01_membership', value, [
    ...Object.keys(BATCH_01).map(c => ({sourceId:`CEN-PLACES-BATCH01-${c}`, section:'Workbook contains places in its named state only'})),
    {sourceId:'CEN-GUIDE-BATCH-01', section:'Six named capital cities and their state assignments'}
  ]);
  addFact(state, 'association.google_first_office', state === 'US-CA' ? ['google-first-office-menlo-park'] : [], [{sourceId:'GOOGLE-FIRST-OFFICE', section:'1998 first office: garage in Menlo Park, California'}]);
}
for (const [code, config] of Object.entries(BATCH_01)) {
  const state = `US-${code}` as StateId;
  addFact(state, 'identity.capital', config.capital, [{sourceId:'CEN-GUIDE-BATCH-01', section:`${config.name}: Basic Information / State Capital`}]);
  const inputFacts = places.filter(p => p.code === code).map(p => addFact(placeId(p), 'place.population_estimate', p.population, [{sourceId:`CEN-PLACES-BATCH01-${code}`, sheet:p.sheet, rowKey:String(p.row), column:p.column}], {kind:'point_date',date:'2025-07-01'}, {universe:`${state}:incorporated-places-2025`, ...(p.suppressionCode ? {suppressionCode:p.suppressionCode} : {})}));
  const published = inputFacts.filter(f => typeof f.value === 'number');
  const params = {subjectIds:published.map(f => f.subjectId), inputMetricId:'place.population_estimate', direction:'descending', tieMethod:'competition'};
  const derivation = {method:'rank' as const, inputFactIds:published.map(f => f.factId), parameters:params, codeVersion:ENGINE_VERSION};
  for (const p of published) addFact(p.subjectId, 'place.within_state_rank', 0, [], p.referencePeriod, {universe:`${state}:published-incorporated-place-estimates`, derivation});
  addFact(state, 'place.top_two', [], [], {kind:'point_date',date:'2025-07-01'}, {universe:`${state}:published-incorporated-place-estimates`, derivation:{...derivation, parameters:{...params, output:'top_k', k:2}}});
  const shape = US_STATE_SHAPES.find(s => s.code === code)!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 975 610"><path d="${shape.path}" fill="#163e32"/></svg>\n`;
  const hash = sha(svg), assetId = `asset-${hash.slice(0,16)}`, filePath = `stable/visuals/${hash}.svg`;
  if (!existsSync(`${base}/${filePath}`)) writeFileSync(`${base}/${filePath}`, svg, {flag:'wx'});
  data.assets.push({assetId, kind:'silhouette', stateId:state, sourceGeometryId:'CEN-ATLAS-3.0.1', projection:code === 'AK' ? 'us-atlas Albers USA composite; Alaska is an inset at non-comparable scale' : 'us-atlas Albers USA composite', simplificationTolerance:0, viewBox:'0 0 975 610', filePath, sha256:hash, generatedAt:createdAt, transformVersion:'existing-map-paths-1', accessibility:{preAnswerAlt:'Mystery state shape', postAnswerAlt:config.name + ' shape'}});
  const input = reference.states[code];
  const regions = ['','Northeast','Midwest','South','West'];
  const divisions = ['','New England','Middle Atlantic','East North Central','West North Central','South Atlantic','East South Central','West South Central','Mountain','Pacific'];
  data.states.push({stateId:state, name:config.name, slug:config.name.toLowerCase().replace(/ /g,'-'), postalCode:code, censusFips:config.fips, censusRegion:regions[Number(input.region)], censusDivision:divisions[Number(input.division)], mapAssetId:assetId, identitySourceRefs:[{sourceId:'CEN-PEP-STATE-V2025', rowKey:config.name, column:'STATE,REGION,DIVISION'}, {sourceId:'USPS-PUB28-2024', section:'Appendix B', rowKey:code}]});
}
data.facts = recomputeDerived(data.facts);
for (const metricId of ['place.batch01_membership','association.google_first_office']) data.referenceTables.push({tableId:metricId, metricId, snapshotId, subjectIds:data.universe, universe:'us-50-states', complete:true, factIds:data.facts.filter(f => f.metricId === metricId).map(f => f.factId)});

const decisions: {clueId:string; reason:string}[] = [];
const reviewedSets: Record<string, string[]> = {};
for (const line of review.split(/\r?\n/).filter(line => /^\| `[a-z]{2}\./.test(line))) {
  const cells = line.split('|').slice(1,-1).map(s => s.trim());
  const [rawId, wording, category, rawPredicate, rawCandidates, difficulty, window, dependency, status] = cells;
  const clueId = rawId.replace(/`/g,''), code = clueId.slice(0,2).toUpperCase(), config = BATCH_01[code as keyof typeof BATCH_01];
  if (!config) continue;
  const selected = (config.order as readonly string[]).indexOf(clueId.slice(3));
  let predicate: Predicate | undefined;
  const p = rawPredicate.replace(/`/g,'');
  const between = /^(\S+) between \[([\d.]+),([\d.]+)\)/.exec(p);
  const compare = /^(\S+) (eq|gte|lt) (\d+)$/.exec(p);
  const zones = /^time.standard_zone eq \[([^\]]+)\]/.exec(p);
  const contains = /^(\S+) contains(?:_all)? (.+)$/.exec(p);
  if (between) predicate = {metricId:between[1], op:'between', minInclusive:Number(between[2]), maxExclusive:Number(between[3])};
  else if (compare) predicate = {metricId:compare[1], op:compare[2] as 'eq'|'gte'|'lt', value:Number(compare[3])};
  else if (zones) predicate = {metricId:'time.standard_zone', op:'eq', value:zones[1].split(',')};
  else if (clueId.endsWith('.postal') || clueId.endsWith('.silhouette')) predicate = {metricId:'identity.postal_code',op:'eq',value:code};
  else if (category === 'cities') {
    const top = data.facts.find(f => f.subjectId === `US-${code}` && f.metricId === 'place.top_two')!.value as string[];
    const requested = p.match(/\[([^\]]+)\]/)![1].split(',');
    if (JSON.stringify(top) !== JSON.stringify(requested)) throw new Error(`${clueId}: top-two differs from handoff`);
    predicate = {all:[{metricId:'place.batch01_membership',op:'contains_all',values:top},{metricId:'place.top_two',op:'contains_all',values:top}]};
  } else if (category === 'capital') predicate = {all:[{metricId:'place.batch01_membership',op:'contains_all',values:[config.capital]},{metricId:'identity.capital',op:'eq',value:config.capital}]};
  else if (clueId === 'ca.business.google-first-office') predicate = {metricId:'association.google_first_office',op:'contains_all',values:['google-first-office-menlo-park']};
  else if (contains && ['nps.formal_unit_ids','boundary.point_contacts'].includes(contains[1])) {
    const names = contains[2].replace(/[\[\]]/g,'').split(',');
    predicate = {metricId:contains[1],op:'contains_all',values:names.map(v => contains[1] === 'nps.formal_unit_ids' && !v.endsWith('-national-park') ? v + '-national-park' : v)};
  }
  if (!predicate || predicateMetrics(predicate).some(id => !data.metrics.some(m => m.metricId === id))) {
    if (selected >= 0) throw new Error(`${clueId}: selected clue has no supported predicate`);
    decisions.push({clueId,reason:status + '; excluded pending supporting normalized entity/topology evidence'}); continue;
  }
  const result = candidates(predicate, data.universe, data.facts, snapshotId);
  const expected = rawCandidates.replace(/\s*\(\d+\).*$/,'').split(',').map(s => 'US-' + s.trim());
  if (result.unknownStateIds.length || JSON.stringify([...result.stateIds].sort()) !== JSON.stringify(expected.sort())) throw new Error(`${clueId}: candidate set differs from handoff or is incomplete`);
  reviewedSets[clueId] = expected;
  const [tierText, prior, directness] = difficulty.replace(/^T/,'').split('/');
  const [originalStart, originalEnd] = window.split('–').map(Number);
  const min = ['silhouette','map_position','abbreviation'].includes(category) ? 7 : Number(tierText) === 1 ? 6 : 1;
  const start = selected >= 0 ? selected+1 : Math.max(originalStart,min), end = selected >= 0 ? selected+1 : Math.max(originalEnd,start);
  if (selected >= 0 && (start < originalStart || end > originalEnd)) decisions.push({clueId,reason:`Research sample conflicts with ${window} window; explicitly reviewed at rung ${start} for the short edition.`});
  const stateId = `US-${code}` as StateId;
  const metrics = predicateMetrics(predicate);
  const supports = data.facts.filter(f => f.subjectId === stateId && metrics.includes(f.metricId));
  const visual = category === 'silhouette';
  let text = wording;
  if (clueId === 'ak.highpoint.15000-plus') text = 'Its highest point is at least 15,000 feet above sea level.';
  if (clueId === 'ca.population.30m-plus') text = 'At least 30 million people lived here in 2025.';
  const clue: ClueRecord = {clueId, answerStateId:stateId, category:category as ClueRecord['category'], render:visual ? {kind:'image',text:{en:text},assetId:data.assets.find(a => a.stateId === stateId && a.kind === 'silhouette')!.assetId} : {kind:'text',text:{en:text}}, factRefs:supports.map(f=>f.factId), predicate,
    candidateSet:{snapshotId,stateIds:result.stateIds as StateId[],count:result.stateIds.length,computedAt:createdAt,evaluatorVersion:ENGINE_VERSION},
    difficulty:{seedTier:Number(tierText) as ClueRecord['difficulty']['seedTier'],knowledgePrior:prior as ClueRecord['difficulty']['knowledgePrior'],directness:directness as ClueRecord['difficulty']['directness'],calibrationStatus:'editorial_seed'},
    ladderPolicy:{earliestRung:start,latestRung:end,dependencyGroup:dependency.replace(/`/g,'')},
    freshness:{class:category === 'time_zone' ? 'regulatory' : ['parks','landmark'].includes(category) && supports.some(f=>f.metricId.startsWith('nps.')) ? 'event_driven' : ['population','cities'].includes(category) ? 'annual' : 'static', referenceLabelRequired:supports.some(f=>data.metrics.find(m=>m.metricId === f.metricId)?.timeSensitive)},
    review:{status:selected >= 0 ? 'approved' : 'draft',evidenceChecked:true,wordingChecked:true,fairnessChecked:selected>=0,notes:`Batch 01 handoff ${status}. Fresh 50-state candidate evaluation matches. ${selected>=0 ? 'Seven-round order reviewed for local playtesting; early uniqueness is not measured player difficulty.' : 'Alternative retained for later fairness review.'}`}};
  if (clue.freshness.referenceLabelRequired && !/20\d{2}/.test(text)) clue.render.text!.en += ' (NPS, 2026)';
  data.clues.push(clue);
}
const diagnostics = validateDataset(data,true);
if (diagnostics.some(d=>d.severity==='error')) throw new Error(JSON.stringify(diagnostics.filter(d=>d.severity==='error')));
const compiled = data.states.map(s => {
  const manifest = compileLadder(data,s.stateId,version);
  const selected = manifest.orderedClueIds.map(id=>data.clues.find(c=>c.clueId===id)!);
  return {manifest, cumulativeCandidateCounts:cumulativeCandidates(selected,data.universe), clues:selected.map(c=>({clueId:c.clueId,text:c.render.text?.en}))};
});
mkdirSync(`${base}/clues/${version}`,{recursive:true});
const {snapshot,facts,referenceTables,clues,...context}=data;
save(`${dir}/context.json`,context); save(`${dir}/normalized.facts.json`,facts); save(`${dir}/reference-tables.json`,referenceTables);
for (const state of data.states) save(`clues/${version}/${state.stateId}.json`,clues.filter(c=>c.answerStateId===state.stateId));
const registry = JSON.parse(readFileSync(`${base}/catalog/snapshots.json`,'utf8'));
save('catalog/snapshots.json',[...registry,snapshot]);
for (const {manifest} of compiled) publishManifest(`${base}/ladders/manifests/${manifest.puzzleId}.json`,manifest,data);
save('review/batch-01-integration.json',{snapshotId,summary:{states:data.states.length,facts:data.facts.length,approvedClues:data.clues.filter(c=>c.review.status==='approved').length,ladders:compiled.length,errors:0,warnings:diagnostics.length},decisions,reviewedCandidateSets:reviewedSets,diagnostics,compiled,notes:['Alaska workbook handoff hash typo: one missing f. Supplied bytes independently match Census re-download.','California rungs 5–6 use the researched Google first-office and city-pair clues; cumulative elimination remains unchanged.','Boundary-count and unnormalized cultural associations remain excluded. No nationwide capital/place/GIS collection was needed for these fully evaluated selected predicates.','New final clues are postal abbreviations as proposed; six silhouettes generated but remain draft alternatives.']});
console.log(`Batch 01: ${data.states.length} states, ${data.facts.length} facts, ${compiled.length} ladders, no errors.`);
