// TASK 1
const user = { name: "Mark", surname: "Smit" };

user.name = "Taras";

delete user.name;

// TASK 2

const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
}

let schedule = {};

alert(isEmpty(schedule));

schedule["8:30"] = "Up";

alert(isEmpty(schedule));

// TASK 3
let salaries = {
    Jarik: 1000,
    Anna: 1600,
    Miko: 1300
}

const salariesSum = (s) => {
    let sum = 0;
    for (let key in s) {
        sum += s[key];
    }
    return sum;
}

sum = salariesSum(salaries);


// TASK 4
const multiplyNumeric = (obj) => {
    for (let key in obj) {
        if (isFinite(obj[key]))
            obj[key] *= 2;
    }
}