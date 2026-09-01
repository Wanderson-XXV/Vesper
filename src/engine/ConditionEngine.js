export function requirementsMet(requires = [], state) {
  return (requires || []).every((flag) => state.hasFlag(flag));
}

export function hiddenByFlags(hideWhen = [], state) {
  return (hideWhen || []).some((flag) => state.hasFlag(flag));
}

export function conditionMet(condition, state) {
  if (!condition) return true;
  if (condition.type === 'clueCountAtLeast') return state.data.clues.length >= Number(condition.value || 0);
  if (condition.type === 'flag') return state.hasFlag(condition.flag) === (condition.equals ?? true);
  return false;
}
