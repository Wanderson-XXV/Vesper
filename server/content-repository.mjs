import { readFile } from 'node:fs/promises';
import path from 'node:path';

export class ContentRepository {
  constructor(root) { this.root = root; this.cache = new Map(); }

  async catalog() {
    if (!this.cache.has('catalog')) {
      this.cache.set('catalog', JSON.parse(await readFile(path.join(this.root, 'content/catalog.json'), 'utf8')));
    }
    return this.cache.get('catalog');
  }

  async case(caseId) {
    if (this.cache.has(caseId)) return this.cache.get(caseId);
    const catalog = await this.catalog();
    const entry = catalog.cases.find((item) => item.id === caseId);
    if (!entry) return null;
    const base = path.resolve(this.root, entry.contentPath.replace(/^\.\//, ''));
    const load = async (name) => JSON.parse(await readFile(path.join(base, `${name}.json`), 'utf8'));
    const [campaign, tracks, challenges, scenes] = await Promise.all(['campaign', 'tracks', 'challenges', 'scenes'].map(load));
    const choiceMap = {};
    const clueMap = {};
    for (const scene of Object.values(scenes)) for (const event of scene.events || []) {
      if (event.type === 'choice') choiceMap[event.id] = event;
      if (event.clue?.id) clueMap[event.clue.id] = event.clue;
    }
    const value = {
      entry, campaign, tracks, challenges, scenes, choiceMap, clueMap,
      trackMap: Object.fromEntries(tracks.map((track) => [track.id, track])),
      challengeMap: Object.fromEntries(challenges.map((challenge) => [challenge.id, challenge]))
    };
    this.cache.set(caseId, value);
    return value;
  }
}
