const mongoose = require("mongoose");
const initData = require("./data.js");
const ProductListing = require("../models/productListing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/NutriSearch";

main().then(()=>{
    console.log("Connected to MongoDB");
});

async function main(){
   await mongoose.connect(MONGO_URL);
}

let initDB = async()=>{
   await ProductListing.deleteMany({});
   await ProductListing.insertMany(initData.data);
   console.log("data was initialized");

}

initDB();