// El catálogo permanece completo; solo cambia qué ejercicios aparecen primero.
export function prioritizeUnitExercises(exercises, suggestedDifficulty) {
    if (!Array.isArray(exercises)) return []

    const target = Number(suggestedDifficulty)
    if (![1, 2, 3].includes(target)) return [...exercises]

    return [...exercises].sort((left, right) => {
        const leftLevel = Number(left.difficultyId)
        const rightLevel = Number(right.difficultyId)
        const leftDistance = [1, 2, 3].includes(leftLevel)
            ? Math.abs(leftLevel - target) : 10
        const rightDistance = [1, 2, 3].includes(rightLevel)
            ? Math.abs(rightLevel - target) : 10
        return leftDistance - rightDistance
    })
}

export function isSuggestedUnitExercise(exercise, suggestedDifficulty) {
    return [1, 2, 3].includes(Number(suggestedDifficulty))
        && Number(exercise?.difficultyId) === Number(suggestedDifficulty)
}
