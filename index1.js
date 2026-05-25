const user = prompt("Inpit username");
if (user === "admin") {
    const pass = prompt("Input sudo pass");
    if (pass === "test") {
        alert("Welcome!");
    } else {
        alert("Wrong pass")
    }
} else {
    alert("I dont know you")
}