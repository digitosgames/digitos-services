import * as logger from 'firebase-functions/logger'
import * as admin from 'firebase-admin'
import { FirestorePaths } from '../constants'
import { PuzzleStep } from './PuzzleStep'
import { https } from 'firebase-functions'
import { GeneratePuzzleRequest } from './GeneratePuzzleRequest'

// rules for the puzzle generator

// Level 1: Puzzles solvable with only addition and subtraction,
// requiring 1-2 operations with single-digit numbers. Designed for
// beginners, this level emphasizes basic arithmetic in a non-overwhelming manner.

// Level 2: Introduces multiplication and division, solvable within
// 2-3 operations. This level starts to incorporate all four arithmetic
// operations with puzzles designed to remain accessible, ensuring a smooth transition in complexity.

// Level 3: Requires 3-4 operations, mandating at least one instance of
// multiplication or division. Aimed at intermediate solvers, this level
// challenges players to think strategically about the order and type of operations used.

// Level 4: Demands solution in exactly 5 operations, including at least two
// instances of multiplication or division. Designed for advanced solvers, it
// necessitates strategic planning and precise operation selection, offering the highest difficulty.

admin.initializeApp()
const db = admin.firestore()

function randomIntegers(n = 6, difficulty = 1): Set<number> {
    const integers = new Set<number>()
    while (integers.size < n) {
        const nextInt = Math.floor(Math.random() * 100) + 1 // Ensuring non-zero integers
        if (difficulty === 1 && nextInt > 9) continue // For difficulty 1, limit to single-digit numbers
        integers.add(nextInt)
    }
    return integers
}

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

function calculateTarget(
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

function generatePuzzle(difficulty = 1) {
    const integers = randomIntegers(6, difficulty)
    const target = Math.floor(Math.random() * 100) + 1
    const maxDepth = difficulty === 4 ? 5 : difficulty === 3 ? 4 : 3 // Adjust maxDepth based on difficulty

    const result = calculateTarget(integers, target, difficulty, 0, maxDepth)

    if (!result.success) {
        console.log(`Couldn't find a solution for target: ${target}`)
        return null
    } else {
        console.log(`Operations to get to target ${target}:`)
        result.operations.forEach(step => console.log(step.operation))

        return {
            initial_numbers: Array.from(integers),
            target_number: target,
            difficulty, // Include difficulty in puzzle data
        }
    }
}

export const generateNewPuzzle = https.onRequest(async (request, response) => {
    logger.info('generatePuzzleCloudFunction begin', {
        structuredData: true,
    })

    if (request.method !== 'POST') {
        response
            .status(400)
            .send('Please send a POST request with a valid body')
        return
    }

    const requestBody: GeneratePuzzleRequest = request.body

    const difficulty = requestBody.difficulty
        ? parseInt(requestBody.difficulty, 10)
        : 1
    const numberOfPuzzles = requestBody.numberOfPuzzles
        ? parseInt(requestBody.numberOfPuzzles, 10)
        : 1

    const puzzlesToGenerate = []
    for (let i = 0; i < numberOfPuzzles; i++) {
        const puzzleData = generatePuzzle(difficulty)
        if (puzzleData) {
            puzzlesToGenerate.push(puzzleData)
        } else {
            response
                .status(500)
                .send('Failed to generate the requested number of puzzles')
            return
        }
    }

    const batch = db.batch()
    puzzlesToGenerate.forEach(puzzle => {
        const docRef = db.collection(FirestorePaths.PUZZLE_COLLECTION).doc() // Create a new document reference
        batch.set(docRef, puzzle)
    })

    try {
        await batch.commit()
        response.send(
            `Successfully generated and stored ${puzzlesToGenerate.length} puzzles.`,
        )
    } catch (error) {
        console.error('Error storing puzzles in Firestore', error)
        response.status(500).send('Failed to store puzzles in Firestore')
    }
})
