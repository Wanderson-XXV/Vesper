export function normalizeAnswer(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function answerFor(challenge, rawInput) {
  const input = Array.isArray(rawInput) ? rawInput.flat() : [];
  const generator = challenge.generator || {};
  switch (generator.type) {
    case 'fixed': return String(generator.answer ?? '');
    case 'binaryDecision': return Number(input[0]) === generator.trueValue ? generator.whenTrue : generator.whenFalse;
    case 'thresholdDecision': return Number(input[0]) >= generator.threshold ? generator.atOrAbove : generator.below;
    case 'rangeDecision': return (generator.ranges.find((entry) => Number(input[0]) <= entry.max) || generator.ranges.at(-1)).answer;
    case 'andDecision': return Number(input[0]) === generator.firstRequired && Number(input[1]) === generator.secondRequired ? generator.whenTrue : generator.whenFalse;
    case 'balanceDecision': {
      const left = Number(input[0]) * Number(input[1]);
      const right = Number(input[2]) * Number(input[3]);
      return left === right ? generator.equal : (left > right ? generator.left : generator.right);
    }
    case 'finalDecision': {
      const [seal, passage, interference] = input.map(Number);
      if (seal === 1 && passage === 1 && interference === 0) return generator.open;
      if (seal === 1 && interference === 1) return generator.contain;
      return generator.wait;
    }
    case 'thresholdCount': return String(input.filter((value) => Number(value) >= generator.threshold).length);
    case 'thresholdPositions': return input.map((value, index) => Number(value) >= generator.threshold ? index + 1 : null).filter(Boolean).join(' ');
    case 'groupCount': return String(input.reduce((count, value, index) => count + (index === 0 || value !== input[index - 1] ? 1 : 0), 0));
    case 'stateTrace': {
      let level = 0;
      return input.map((value) => { level = Number(value) === 1 ? level + 1 : 0; return level; }).join(' ');
    }
    case 'maxValue': return String(Math.max(...input.map(Number)));
    case 'longestRun': {
      let best = input.length ? 1 : 0;
      let current = best;
      for (let index = 1; index < input.length; index++) {
        current = input[index] === input[index - 1] ? current + 1 : 1;
        best = Math.max(best, current);
      }
      return String(best);
    }
    case 'matrixMaxPosition': {
      const columns = Number(generator.cols || 4);
      let bestIndex = 0;
      for (let index = 1; index < input.length; index++) if (Number(input[index]) > Number(input[bestIndex])) bestIndex = index;
      return `${Math.floor(bestIndex / columns) + 1} ${(bestIndex % columns) + 1}`;
    }
    case 'frequencyWinner':
    case 'matrixFrequencyWinner': {
      const counts = new Map();
      for (const value of input) counts.set(String(value), (counts.get(String(value)) || 0) + 1);
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    }
    default: throw new Error(`Gerador não suportado pelo servidor: ${generator.type}`);
  }
}

export function validateSubmission(challenge, input, submitted) {
  return normalizeAnswer(answerFor(challenge, input)) === normalizeAnswer(submitted);
}

export function inputMatchesGenerator(challenge, rawInput) {
  const input = Array.isArray(rawInput) ? rawInput.flat() : [];
  const generator = challenge.generator || {};
  if (generator.type === 'fixed') return JSON.stringify(input) === JSON.stringify((generator.input || []).flat());
  const lengths = {
    binaryDecision: 1,
    thresholdDecision: 1,
    rangeDecision: 1,
    andDecision: 2,
    balanceDecision: 4,
    finalDecision: 3
  };
  const expectedLength = lengths[generator.type] || generator.length || (generator.rows && generator.cols ? generator.rows * generator.cols : null);
  if (expectedLength && input.length !== Number(expectedLength)) return false;
  if (generator.symbols && input.some((value) => !generator.symbols.map(String).includes(String(value)))) return false;
  if (generator.min !== undefined && input.some((value) => Number(value) < generator.min)) return false;
  if (generator.max !== undefined && input.some((value) => Number(value) > Math.max(generator.max, generator.peak !== undefined ? generator.peak + 3 : generator.max))) return false;
  if (['binaryDecision', 'andDecision', 'finalDecision'].includes(generator.type) && input.some((value) => ![0, 1].includes(Number(value)))) return false;
  if (generator.type === 'thresholdDecision' && input.some((value) => Number(value) < generator.min || Number(value) > generator.max)) return false;
  if (generator.type === 'rangeDecision' && input.some((value) => Number(value) < generator.min || Number(value) > generator.max)) return false;
  if (generator.type === 'balanceDecision') {
    const [leftMass, leftDistance, rightMass, rightDistance] = input.map(Number);
    if ([leftMass, rightMass].some((value) => value < generator.massMin || value > generator.massMax)) return false;
    if ([leftDistance, rightDistance].some((value) => value < generator.distanceMin || value > generator.distanceMax)) return false;
  }
  return input.length > 0;
}
