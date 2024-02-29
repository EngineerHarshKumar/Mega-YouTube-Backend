import mongoose from "mongoose";

export async function connectionToDatabase() {
    console.log(`MongoDB DataBase Connecting......`);

    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${process.env.MONGODB_NAME}`,
        );

        return connectionInstance;
    } catch (error) {
        console.log(
            `Error while connecting to the Database in DBConnection File`,
        );
        console.log(`ERROR: ${error.message}`);

        // Stop the process
        process.exit(1);
    }
}
