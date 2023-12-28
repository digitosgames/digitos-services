import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

/**
 * Generates an array of random integers between 0 and 99
 */
function randomIntegers(n = 6) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push(Math.floor(Math.random() * 100));
    }
    return arr;
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
    set: number[];
    operation: string;
}

function calculateTarget(
    integers: number[],
    target: number,
    depth = 0,
    maxDepth = 5,
    history: PuzzleStep[] = []
): { success: boolean; operations: { set: number[]; operation: string }[] } {
    if (integers.includes(target)) {
        return { success: true, operations: history };
    }

    if (depth === maxDepth) {
        return { success: false, operations: [] };
    }

    for (let i = 0; i < integers.length; i++) {
        for (let j = i + 1; j < integers.length; j++) {
            const a = integers[i];
            const b = integers[j];

            const operations = validOperations(a, b);
            for (const op of operations) {
                if (op.value > 99) continue;

                const newIntegers = [...integers];
                newIntegers.splice(i, 1);
                newIntegers.splice(j - 1, 1);
                newIntegers.push(op.value);

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
    console.log('Generated integers:', integers);

    const target = Math.floor(Math.random() * 100);
    const result = calculateTarget(integers, target);

    if (!result.success) {
        console.log(`Couldn't find a solution for target: ${target}`);
    } else {
        console.log(`Operations to get to target ${target}:`);
        for (const step of result.operations) {
            console.log(step.operation);
            console.log(`Using numbers: ${step.set}`);
        }
    }
}


export const helloWorld = onRequest((request, response) => {
    logger.info('Hello logs!', { structuredData: true });

    const puzzleSet = generatePuzzle();

    // TODO store in firestore

    response.send('Hello from Firebase!');
});
