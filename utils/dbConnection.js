import mongoose from "mongoose"

// export a function that connects to the db

const db = () => {
    mongoose.connect(process.env.MONGO_DB_URL)
    .then( () => {
        console.log("Successfully connected to MongoDB!");
    } )
    .catch( () => {
        console.log("Error while connecting to MongoDB!")
    } )
}

export default db;

