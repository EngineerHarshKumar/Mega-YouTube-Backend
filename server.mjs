import { connectionToDatabase } from "./src/database/connection.mjs";
import app from "./app.mjs";
import { configENV } from "./config/env.config.mjs";

connectionToDatabase()
    .then((connectionInstance) => {
        console.log(`MongoDB Database Connected Successfully`);
        console.log(`Host: ${connectionInstance.connection.host}`);

        app.on("error", (err) => {
            console.log(`Error on app: ${err.message}`);
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running at port: ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log(`Error while connecting to Database in server File`);
        console.log(`Error: ${err.message}`);
        process.exit(1);
    });
