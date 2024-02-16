import { logger } from 'firebase-functions/v2'
import { PuzzleData } from '../PuzzleData'
import { calculateTarget } from './calculateTarget'
import { randomIntegers } from './randomIntegers'
import { generateTarget } from './generateTarget'

export function generatePuzzle(difficulty = 1): PuzzleData {
    for (let attempt = 0; attempt < 10; attempt++) {
        const integers = randomIntegers(6, difficulty)
        const target = generateTarget({ integers: Array.from(integers) })
        const maxDepth = difficulty === 4 ? 5 : difficulty === 3 ? 4 : 3 // Adjust maxDepth based on difficulty

        const result = calculateTarget(
            integers,
            target,
            difficulty,
            0,
            maxDepth,
        )

        if (result.success) {
            console.log(`Operations to get to target ${target}:`)
            result.operations.forEach(step => console.log(step.operation))

            return {
                initial_numbers: Array.from(integers),
                target_number: target,
                difficulty,
            }
        }
    }

    // If the function hasn't returned after 10 attempts, recursively call itself to try again
    logger.info(
        'Unable to find a valid puzzle after 10 attempts, trying again...',
    )
    return generatePuzzle(difficulty)
}
