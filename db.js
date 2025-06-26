import mongoose from "mongoose";

export const connectDb = async()=>{
    try {
        await mongoose.connect('mongodb+srv://meghnavermaajmer:meghnavermaajmer@startupcluster.qa4twlq.mongodb.net/?retryWrites=true&w=majority&appName=StartupCluster',
Activation_Secret = ndld374hf7y4hsd8u);
        console.log("databse connect");
    } catch (error) {
     console.log(error)   
    }
}