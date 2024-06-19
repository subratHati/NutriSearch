const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name:{
        type: String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    image:{
        url:String,
        filename:String,
       },
    category:{
        type:String,
        required:true,
    },
    ingredients:[String],
    type:{
        type:String,
        required:true,
    },
});

const Productlisting = mongoose.model("ProductListing", productSchema);

module.exports = Productlisting;