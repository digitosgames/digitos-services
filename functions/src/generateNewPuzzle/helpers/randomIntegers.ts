export function randomIntegers(n = 6, difficulty = 1): Set<number> {
    const integers = new Set<number>()
    while (integers.size < n) {
        const nextInt = Math.floor(Math.random() * 100) + 1 // Ensuring non-zero integers
        if (difficulty === 1 && nextInt > 9) continue // For difficulty 1, limit to single-digit numbers
        integers.add(nextInt)
    }
    return integers
}
