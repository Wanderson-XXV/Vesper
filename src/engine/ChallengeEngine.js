function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFromSeed(seed) {
  let x = seed >>> 0 || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function ri(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }

export class ChallengeEngine {
  constructor(state) { this.state = state; }

  getSeed(challengeId) {
    if (!this.state.data.challengeSeeds[challengeId]) {
      const base = `${challengeId}:${this.state.data.startedAt}:${Math.random()}`;
      this.state.data.challengeSeeds[challengeId] = hashSeed(base).toString(16).toUpperCase();
      this.state.save();
    }
    return this.state.data.challengeSeeds[challengeId];
  }

  generate(challenge) {
    const seedText = this.getSeed(challenge.id);
    const rng = rngFromSeed(hashSeed(seedText));
    const g = challenge.generator;
    let input = [];
    let answer = '';
    let meta = {};

    if (g.type === 'fixed') {
      input = [...(g.input || [])];
      answer = String(g.answer ?? '');
      meta = { N: input.length, ...(g.meta || {}) };
    }

    if (g.type === 'binaryDecision') {
      const value = ri(rng, 0, 1);
      input = [value];
      answer = value === g.trueValue ? g.whenTrue : g.whenFalse;
      meta = { ...(g.meta || {}) };
    }

    if (g.type === 'thresholdDecision') {
      const value = ri(rng, g.min, g.max);
      input = [value];
      answer = value >= g.threshold ? g.atOrAbove : g.below;
      meta = { threshold: g.threshold, ...(g.meta || {}) };
    }

    if (g.type === 'rangeDecision') {
      const value = ri(rng, g.min, g.max);
      input = [value];
      const range = g.ranges.find((entry) => value <= entry.max) || g.ranges[g.ranges.length - 1];
      answer = range.answer;
      meta = { ...(g.meta || {}) };
    }

    if (g.type === 'andDecision') {
      const first = ri(rng, 0, 1);
      const second = ri(rng, 0, 1);
      input = [first, second];
      answer = first === g.firstRequired && second === g.secondRequired ? g.whenTrue : g.whenFalse;
      meta = { ...(g.meta || {}) };
    }

    if (g.type === 'balanceDecision') {
      const leftMass = ri(rng, g.massMin, g.massMax);
      const leftDistance = ri(rng, g.distanceMin, g.distanceMax);
      const rightMass = ri(rng, g.massMin, g.massMax);
      const rightDistance = ri(rng, g.distanceMin, g.distanceMax);
      const leftForce = leftMass * leftDistance;
      const rightForce = rightMass * rightDistance;
      input = [leftMass, leftDistance, rightMass, rightDistance];
      answer = leftForce === rightForce ? g.equal : (leftForce > rightForce ? g.left : g.right);
      meta = { ...(g.meta || {}) };
    }

    if (g.type === 'finalDecision') {
      const seal = ri(rng, 0, 1);
      const passage = ri(rng, 0, 1);
      const interference = ri(rng, 0, 1);
      input = [seal, passage, interference];
      if (seal === 1 && passage === 1 && interference === 0) answer = g.open;
      else if (seal === 1 && interference === 1) answer = g.contain;
      else answer = g.wait;
      meta = { ...(g.meta || {}) };
    }

    if (g.type === 'thresholdCount') {
      input = Array.from({ length: g.length }, () => ri(rng, g.min, g.max));
      answer = String(input.filter((v) => v >= g.threshold).length);
      meta = { N: input.length, threshold: g.threshold };
    }

    if (g.type === 'thresholdPositions') {
      input = Array.from({ length: g.length }, () => ri(rng, g.min, g.max));
      if (!input.some((value) => value >= g.threshold)) input[ri(rng, 0, input.length - 1)] = g.threshold;
      answer = input.map((value, index) => value >= g.threshold ? index + 1 : null).filter(Boolean).join(' ');
      meta = { N: input.length, threshold: g.threshold };
    }

    if (g.type === 'groupCount') {
      const groupCount = ri(rng, g.groupsMin, g.groupsMax);
      const pool = [1,2,3,4,5,6,7,8,9];
      let previous = null;
      for (let k = 0; k < groupCount; k++) {
        let symbol = pool[ri(rng, 0, pool.length - 1)];
        while (symbol === previous) symbol = pool[ri(rng, 0, pool.length - 1)];
        previous = symbol;
        const run = ri(rng, g.runMin, g.runMax);
        input.push(...Array(run).fill(symbol));
      }
      answer = String(groupCount);
      meta = { N: input.length };
    }

    if (g.type === 'stateTrace') {
      let level = 0;
      const out = [];
      for (let i = 0; i < g.length; i++) {
        const v = rng() < g.chanceOn ? 1 : 0;
        input.push(v);
        level = v === 1 ? level + 1 : 0;
        out.push(level);
      }
      answer = out.join(' ');
      meta = { N: input.length };
    }

    if (g.type === 'maxValue') {
      input = Array.from({ length: g.length }, () => ri(rng, g.min, g.max));
      answer = String(Math.max(...input));
      meta = { N: input.length };
    }

    if (g.type === 'longestRun') {
      let prev = null;
      for (let i = 0; i < g.length; i++) {
        let value;
        if (prev !== null && rng() < 0.58) value = prev;
        else value = g.symbols[ri(rng, 0, g.symbols.length - 1)];
        input.push(value); prev = value;
      }
      let best = 1, current = 1;
      for (let i = 1; i < input.length; i++) {
        current = input[i] === input[i - 1] ? current + 1 : 1;
        if (current > best) best = current;
      }
      answer = String(best);
      meta = { N: input.length };
    }

    if (g.type === 'matrixMaxPosition') {
      const rows = Number(g.rows || 4);
      const cols = Number(g.cols || 4);
      const values = Array.from({ length: rows * cols }, () => ri(rng, g.min ?? 0, g.max ?? 9));
      const peakIndex = ri(rng, 0, values.length - 1);
      const peakValue = (g.peak ?? 12) + ri(rng, 0, 3);
      values[peakIndex] = peakValue;
      input = values;
      const matrix = Array.from({ length: rows }, (_, row) => values.slice(row * cols, (row + 1) * cols));
      answer = `${Math.floor(peakIndex / cols) + 1} ${(peakIndex % cols) + 1}`;
      meta = { rows, cols, N: values.length };
      return { seed: seedText, input, rows: matrix, answer, meta };
    }

    if (g.type === 'frequencyWinner' || g.type === 'matrixFrequencyWinner') {
      const symbols = g.symbols || ['A', 'B', 'C', 'D'];
      const total = g.type === 'matrixFrequencyWinner'
        ? Number(g.rows || 4) * Number(g.cols || 4)
        : Number(g.length || 18);
      const winner = symbols[ri(rng, 0, symbols.length - 1)];
      const winnerCount = Math.max(Math.ceil(total * 0.42), Math.floor(total / symbols.length) + 2);
      input = Array(winnerCount).fill(winner);
      const candidates = symbols.filter((symbol) => symbol !== winner);
      while (input.length < total) {
        input.push(candidates[(input.length - winnerCount) % candidates.length]);
      }
      for (let i = input.length - 1; i > 0; i--) {
        const j = ri(rng, 0, i);
        [input[i], input[j]] = [input[j], input[i]];
      }
      answer = winner;
      if (g.type === 'matrixFrequencyWinner') {
        const rows = Number(g.rows || 4);
        const cols = Number(g.cols || 4);
        const matrix = Array.from({ length: rows }, (_, row) => input.slice(row * cols, (row + 1) * cols));
        meta = { rows, cols, N: input.length };
        return { seed: seedText, input, rows: matrix, answer, meta };
      }
      meta = { N: input.length, symbolCount: symbols.length };
    }

    return { seed: seedText, input, answer, meta };
  }

  normalize(value) { return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase(); }
  validate(expected, submitted) { return this.normalize(expected) === this.normalize(submitted); }
}
