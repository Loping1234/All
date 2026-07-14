require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
// Note: We'll use the same logic as the app to ensure consistency
const collection = require('./src/config');
const Employee = require('./models/employee');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/newsTV19";
const DEFAULT_PASSWORD = "Password@123";

async function seed() {
    try {
        console.log("Connecting to database:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log("Connected successfully.");

        const usersToCreate = [
            { email: "pranaykumar302@gmail.com", role: "admin", fullName: "Pranay Admin" },
            { email: "lopingcucumber@gmail.com", role: "subadmin", fullName: "Loping Subadmin" },
            { email: "cucumberloping@gmial.com", role: "employee", fullName: "Cucumber Employee" }
        ];

        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        for (const userData of usersToCreate) {
            console.log(`Upserting user: ${userData.email} as ${userData.role}...`);
            
            // Upsert User
            const user = await collection.findOneAndUpdate(
                { email: userData.email },
                {
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role,
                    fullName: userData.fullName,
                    isVerified: true,
                    twoFactorEnabled: false // Disable 2FA for easy initial login
                },
                { upsert: true, new: true }
            );

            // If employee, also upsert into Employee collection
            if (userData.role === "employee") {
                console.log(`Upserting employee record for ${userData.email}...`);
                await Employee.findOneAndUpdate(
                    { email: userData.email },
                    {
                        name: userData.fullName,
                        email: userData.email,
                        password: hashedPassword
                    },
                    { upsert: true, new: true }
                );
            }
        }

        console.log("\nSeeding completed successfully!");
        console.log("Default Password for all users: ", DEFAULT_PASSWORD);
        console.log("2FA has been DISABLED for these users for easy login.");
        
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
