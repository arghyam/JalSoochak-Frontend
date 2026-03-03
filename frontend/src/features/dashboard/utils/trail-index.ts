export function computeTrailIndices(
  trailSelectionValues: readonly string[],
  activeTrailIndex: number | null | undefined
) {
  const deepestSelectedTrailIndex = [...trailSelectionValues].reduce(
    (lastIndex, value, index) => (value ? index : lastIndex),
    -1
  )

  const effectiveTrailIndex =
    activeTrailIndex === null || activeTrailIndex === undefined
      ? deepestSelectedTrailIndex
      : Math.max(-1, Math.min(activeTrailIndex, deepestSelectedTrailIndex))

  return { deepestSelectedTrailIndex, effectiveTrailIndex }
}
