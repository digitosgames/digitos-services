import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Generates a set of unique random integers between 0 and 99
 */
function randomIntegers(n = 6): Set<number> {
    const integers = new Set<number>();
    while (integers.size < n) {
        integers.add(Math.floor(Math.random() * 100));
    }
    return integers;
}

/**
 * Returns an array of valid operations between two integers
 */
function validOperations(a: number, b: number) {
    const results = [];
    results.push({ value: a + b, operation: `${a} + ${b}` });
    results.push({ value: a * b, operation: `${a} * ${b}` });
    if (a - b > 0) results.push({ value: a - b, operation: `${a} - ${b}` });
    else results.push({ value: b - a, operation: `${b} - ${a}` });
    if (b !== 0 && a % b === 0) {
        results.push({ value: a / b, operation: `${a} / ${b}` });
    } else if (a !== 0 && b % a === 0) {
        results.push({ value: b / a, operation: `${b} / ${a}` });
    }
    return results;
}

interface PuzzleStep {
    set: Set<number>;
    operation: string;
}

function calculateTarget(
    integers: Set<number>,
    target: number,
    depth = 0,
    maxDepth = 5,
    history: PuzzleStep[] = []
): { success: boolean; operations: PuzzleStep[] } {
    if (integers.has(target)) {
        return { success: true, operations: history };
    }

    if (depth === maxDepth) {
        return { success: false, operations: [] };
    }

    const integersArray = Array.from(integers);

    for (let i = 0; i < integersArray.length; i++) {
        for (let j = i + 1; j < integersArray.length; j++) {
            const a = integersArray[i];
            const b = integersArray[j];

            const operations = validOperations(a, b);
            for (const op of operations) {
                if (op.value > 99) continue;

                const newIntegers = new Set(integers);
                newIntegers.delete(a);
                newIntegers.delete(b);
                newIntegers.add(op.value);

                // eslint-disable-next-line max-len
                const result = calculateTarget(newIntegers, target, depth + 1, maxDepth, [
                    ...history,
                    { set: newIntegers, operation: op.operation },
                ]);

                if (result.success) {
                    return result;
                }
            }
        }
    }

    return { success: false, operations: [] };
}

function generatePuzzle() {
    const integers = randomIntegers();
    console.log('Generated integers:', Array.from(integers));

    const target = Math.floor(Math.random() * 100);
    const result = calculateTarget(integers, target);

    if (!result.success) {
        console.log(`Couldn't find a solution for target: ${target}`);
        return null;
    } else {
        console.log(`Operations to get to target ${target}:`);
        for (const step of result.operations) {
            console.log(step.operation);
            console.log(`Using numbers: ${Array.from(step.set)}`);
        }

        // Returning puzzle data
        return {
            initial_numbers: Array.from(integers),
            target_number: target,
            difficulty: 0, // Adjust the difficulty as needed
        };
    }
}

export const generateNewPuzzle = onRequest(async (request, response) => {
    logger.info('generatePuzzleCloudFunction begin', { structuredData: true });

    const puzzleData = generatePuzzle();

    if (puzzleData) {
        try {
            const docRef = await db.collection('games').add(puzzleData);
            console.log(`Puzzle stored in Firestore with ID: ${docRef.id}`);
            // eslint-disable-next-line max-len
            response.send(`Puzzle generated and stored in Firestore with ID: ${docRef.id}`);
        } catch (error) {
            console.error('Error storing puzzle in Firestore', error);
            response.status(500).send('Failed to store puzzle in Firestore');
        }
    } else {
        response.status(500).send('Failed to generate puzzle');
    }
});
