import mongoose from 'mongoose'

export const connectDB = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB connected successfully with connection instance ${conn.connection.host}`)
    } catch (error) {
        console.log(`MongoDB connection failed with ${error.message}`)
    }
}