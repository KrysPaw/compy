export function denseMedalPlaceIndex(
  scoresDescending: ReadonlyArray<number>,
  index: number,
): number | null {
  const score = scoresDescending[index];
  if (score === undefined) {
    return null;
  }

  let placeIndex = 0;
  for (let i = 1; i <= index; i += 1) {
    if (scoresDescending[i] !== scoresDescending[i - 1]) {
      placeIndex += 1;
    }
  }

  return placeIndex <= 2 ? placeIndex : null;
}

/** Rounded score shown in the UI; medals must use this for ties. */
export function displayScore(rate: number): number {
  return Math.round(rate);
}
