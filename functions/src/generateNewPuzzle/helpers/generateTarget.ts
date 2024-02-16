// target can't be one of the integers
// currently only 1-100
export const generateTarget = ({ integers }: { integers: number[] }) => {
    let target = Math.floor(Math.random() * 100) + 1

    while (integers.includes(target)) {
        target = Math.floor(Math.random() * 100) + 1
    }

    return target
}
