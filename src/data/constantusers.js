// users.js

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

let users = [
    ...Array.from({ length: 5000 }, (_, index) => {
        const id = (index + 1).toString().padStart(5, '0');
        const status = index % 2 === 0 ? "registered" : "guest";

        if (status === "guest") {
            return {
                id: `GID${id}`,
                status
            };
        } else {
            const userType = index % 4 === 0 ? "tourist" : "student";
            const genders = ["Male", "Female"];
            const gender = genders[Math.floor(Math.random() * genders.length)];
            const names = [
                "Olivia", "Liam", "Emma", "Noah", "Ava", "Elijah",
                "Sophia", "James", "Mia", "William", "Amelia", "Benjamin",
                "Isabella", "Lucas", "Charlotte", "Mason", "Evelyn", "Logan",
                "Harper", "Alexander"
            ];
            const surnames = [
                "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia",
                "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez",
                "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore",
                "Jackson", "Martin"
            ];
            const name = `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
            const email = name.toLowerCase().replace(/ /g, '.') + `.${index}@example.com`;
            const age = Math.floor(Math.random() * 10) + 15;
            const activestatus = Math.random() < 0.5;  // Changed from 'online' to 'activestatus'
            const year = Math.floor(Math.random() * 4) + 2023;
            const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
            const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
            const registeredDate = `${year}-${month}-${day}`;

            return {
                id: `UID${id}`,
                status,
                activestatus,  // Changed from 'online' to 'activestatus'
                name,
                email,
                age,
                gender,
                userType,
                registeredDate
            };
        }
    })
];

users = shuffleArray(users);

module.exports = users;
