module.exports = isLoggedIn=(req, res, next)=>{
    res.locals.currUser = req.user;
    if(!req.isAuthenticated()){
        req.flash("error", "Are you a admin ? Please log in to confirm!!");
        return res.redirect("/login");
    }
        next();
}