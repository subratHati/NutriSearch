if(process.env.NODE_ENV != "production"){  //because we are going to create a variable named "NODE_ENV" while live our website with value "production" and as if we know we don't upload our .env file in host so we want our .env file execute while only it is in project level and not production level.
require('dotenv').config(); //used to integrate our .env file with our backend
console.log(process.env);
}

const express = require("express");
const app = express();
const PORT = 8080;
const mongoose = require("mongoose");
const ProductListing = require("./models/productListing.js");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const isLoggedIn = require("./middlewares.js");
const ejsMate = require("ejs-mate");  //ejs-mate helps us to Create templets for some part of web page.like navbar, because navbar is present in almost every page of a website so instead of writing the same code in every page we create a template and attatch that template in every page. 
const ExpressError = require("./ExpressError.js");
const { wrap } = require("module");
const {productSchema} = require("./schema.js");
const multer  = require('multer') //multer is used to send files/images from frontend to backend.
const {storage} = require("./cloudinaryConfig.js");
const MongoStore = require('connect-mongo');
const upload = multer({ storage })  //set multer destination folder where all the files are saved, send from frontend


// const MONGO_URL = "mongodb://127.0.0.1:27017/NutriSearch";
const dburl = process.env.ATLAS_URL;

const store = MongoStore.create({
    mongoUrl: dburl,
    secret:process.env.SECRET,
    touchAfter: 24 * 60 * 60
});

store.on("error", ()=>{
    console.log("Mongo session store Error", err);
})

const sessionOptions = {  //to know more about these keys and their values, check in npm express-session.
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() * 7 * 24 * 60 * 60 * 1000,
        maxAge:  7 * 24 * 60 * 60 * 1000,
        httpOnly:true,

    }
}

 

main().then(()=>{
    console.log("Connected to MongoDB");
});

async function main(){
   await mongoose.connect(dburl);
}


app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(session(sessionOptions));
app.use(flash());
app.use(express.static(path.join(__dirname, "/public")));





app.use(passport.initialize()); //to initialize the passport
app.use(passport.session()); //to know that which session is running currently.
//and we have to write both the above middlewares as it is compulsary when we implement authenticate features using passport.
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//The basic meaning of these two line is when a session starts all the information about the user is serialize into session-store and when a session end  it deserialize all the info as well.

app.use((req, res, next)=>{
    res.locals.success = req.flash("msg");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

function wrapAsync(fn){
    return (req, res, next)=>{
        fn(req, res, next).catch(e=>next(e));
    }
}

 //Home Route
app.get("/", (req, res)=>{
    // res.send("Hii, This is root");
    res.render("productListing/home.ejs");

});

//signup form Route
app.get("/signup", (req, res)=>{
    res.render("user/signup.ejs");
});

//signup Route
app.post("/signup", wrapAsync(async(req, res)=>{
   let {username, email, password} = req.body;
    let newUser = new User({ username, email });
   let user = await User.register(newUser, password);
   console.log(user);
   res.redirect("/login");

}));

//login form Route
app.get("/login", (req, res)=>{
    res.render("user/login.ejs");
});

app.post("/login", passport.authenticate("local", 
{failureRedirect:"/login",
    failureFlash: true
}),
 (req, res)=>{
    req.flash("msg", "Welcome back Admin");
    res.redirect("/productListing");
});

app.get("/logout", (req, res)=>{
    req.logout((err)=>{
        if(err){
            req.flash("error", "Logout failed!");
        }else{
            req.flash("msg", "You have been logged out successfully!");
            res.redirect("/productListing");
        }
    })
})

// some random test Route
app.get("/err", (req, res)=>{
    abcd == abcd;
})

//Search Route
app.get("/search",wrapAsync(async(req, res)=>{
    let search = req.query.search;
    console.log(req.query);
    let products = await ProductListing.find({"name": { $regex: ".*"+search+".*", $options:"i"}}); 
    if(products.length == 0){
        req.flash("error", `No products found in the name of "${search}"`);
        res.redirect("/productListing");
    }else if(products.length == 1){
        let id = products[0]._id;
        res.redirect(`/productListing/${id}`);
    }else{
        res.render("productListing/searchResult.ejs",{products});
    }
   
}));

// Create new Product Router(form)
app.get("/ProductListing/add", isLoggedIn, (req, res)=>{
        res.render("productListing/addProduct.ejs");
});

//Add new product Route
app.post("/productListing", isLoggedIn,  upload.single('image'), wrapAsync( async(req, res)=>{
    const url = req.file.path;
    const filename = req.file.filename;
    const newProduct = new ProductListing(req.body);
    let result = productSchema.validate(req.body);

    if(result.error){
        throw new ExpressError(400, result.error);
    }

    let ingredients = req.body.ingredients;
    let ingredientsArray = ingredients.split(',');
    newProduct.ingredients = ingredientsArray;
    newProduct.image = {url, filename};
   await newProduct.save();
    res.redirect("/productListing");
// res.send(req.file);
    
}));

//Edit form Route
app.get("/productListing/:id/edit", isLoggedIn, wrapAsync(async(req, res)=>{
    const id = req.params.id;
    const product = await ProductListing.findById(id);
    res.render("productListing/edit.ejs", {product});
}));

//Update Route 
app.put("/productListing/:id", isLoggedIn, upload.single('image'), wrapAsync(async(req, res)=>{
    const id = req.params.id;
    const updatedProduct = req.body;
    let ingredientsArray = req.body.ingredients.split(",");
    updatedProduct.ingredients = ingredientsArray;
    const product = await ProductListing.findByIdAndUpdate(id, updatedProduct);
    if(typeof req.file !== "undefined"){
        let url =req.file.path;
        let filename = req.file.filename;
        product.image = {url, filename};
        await product.save();
    }

    console.log(product);
    req.flash("msg", "Product modified successfully");
    res.redirect(302,`/productListing/${id}`);

}));

//Delete Route
app.delete("/productListing/:id", isLoggedIn, wrapAsync(async(req, res)=>{
    const id = req.params.id;
    const removeProduct = await ProductListing.findByIdAndDelete(id);
    console.log(removeProduct);
    res.redirect("/productListing");
}));

//product detail Route
app.get("/ProductListing/:id", wrapAsync(async(req, res)=>{
    const id = req.params.id;
    let currProduct = await ProductListing.findById(id);
    let allProduct = await ProductListing.find({});
    console.log(currProduct);
    res.render("productListing/detail.ejs", {currProduct, allProduct});
}));

//Index Route
app.get("/productListing", wrapAsync(async(req, res)=>{
    console.log("Product list is showing..");
   let allProductListing =await ProductListing.find({});

    res.render("productListing/index.ejs", {allProductListing});
}));

app.all("*", (req, res, next)=>{
    next(new ExpressError(404, "page not found"));
})

app.use((err, req, res, next)=>{
    let {status=500, message} = err;
    // res.status(status).send(message);
    res.render("productListing/error.ejs", {err});
    console.log(err);
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});

// IMPORTANT NOTE: while throwing error, server cannot call the next function if we try to throw error in async function, so we have to pass that error inside next();