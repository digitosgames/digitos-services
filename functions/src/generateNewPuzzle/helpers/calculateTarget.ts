import { PuzzleStep } from '../PuzzleStep'

function validOperations(a: number, b: number, difficulty: number) {
    const results = []
    // Basic operations for all difficulties
    results.push({ value: a + b, operation: `${a} + ${b}` })
    results.push({
        value: Math.abs(a - b),
        operation: a > b ? `${a} - ${b}` : `${b} - ${a}`,
    })

    if (difficulty > 1) {
        // For higher difficulties, include multiplication and division
        results.push({ value: a * b, operation: `${a} * ${b}` })
        if (b !== 0 && a % b === 0)
            results.push({ value: a / b, operation: `${a} / ${b}` })
        if (a !== 0 && b % a === 0)
            results.push({ value: b / a, operation: `${b} / ${a}` })
    }

    return results.filter(op => op.value > 0 && op.value < 100) // Ensure results are valid
}

export function calculateTarget(
    integers: Set<number>,
    target: number,
    difficulty: number,
    depth = 0,
    maxDepth = 5,
    history: PuzzleStep[] = [],
): { success: boolean; operations: PuzzleStep[] } {
    if (integers.has(target)) return { success: true, operations: history }
    if (depth === maxDepth) return { success: false, operations: [] }

    const integersArray = Array.from(integers)
    for (let i = 0; i < integersArray.length; i++) {
        for (let j = i + 1; j < integersArray.length; j++) {
            const a = integersArray[i]
            const b = integersArray[j]
            const operations = validOperations(a, b, difficulty)
            for (const op of operations) {
                if (op.value > 99) continue // Skip invalid results

                const newIntegers = new Set(integers)
                newIntegers.delete(a)
                newIntegers.delete(b)
                newIntegers.add(op.value)

                const result = calculateTarget(
                    newIntegers,
                    target,
                    difficulty,
                    depth + 1,
                    maxDepth,
                    [...history, { set: newIntegers, operation: op.operation }],
                )
                if (result.success) return result
            }
        }
    }

    return { success: false, operations: [] }
}
