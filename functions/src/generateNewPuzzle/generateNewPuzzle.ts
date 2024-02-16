import * as admin from 'firebase-admin'
import { FirestorePaths } from '../constants'
import { https, logger } from 'firebase-functions/v2'
import { GeneratePuzzleRequest } from './GeneratePuzzleRequest'
import { generatePuzzle } from './helpers/generatePuzzle'

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

    if (difficulty < 1 || difficulty > 4) {
        response.status(400).send('Difficulty must be between 1 and 4')
        return
    }

    const numberOfPuzzles = requestBody.numberOfPuzzles
        ? parseInt(requestBody.numberOfPuzzles, 10)
        : 1

    if (numberOfPuzzles < 1 || numberOfPuzzles > 20) {
        response.status(400).send('Number of puzzles must be between 1 and 20')
        return
    }

    const puzzlesToGenerate = []
    for (let i = 0; i < numberOfPuzzles; i++) {
        const puzzleData = generatePuzzle(difficulty)
        if (puzzleData) {
            puzzlesToGenerate.push(puzzleData)
        } else {
            logger.error('Failed to generate the requested number of puzzles')
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
        logger.error('Error storing puzzles in Firestore', error)
        response.status(500).send('Failed to store puzzles in Firestore')
    }
})
