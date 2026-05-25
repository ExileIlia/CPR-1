// TASK 1
const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// TASK 2
const isPrime = (num) => {
    if (num <= 1) return false;
    for (let i = 2, sqrt = Math.sqrt(num); i < sqrt; i++)
        if (num % i == 0) return false;
    return true;
}

// TASK 3
const recursiveSum = (n) => {
    const sign = n > -1 ? 1 : -1;
    const size = Math.abs(n);
    let r = 0;

    for (let i = 1; i < size; i++) r += i;

    return r;
}