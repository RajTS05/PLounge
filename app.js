const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose =require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: "Our little secret.",
    resave : false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/clientDB",{useUnifiedTopology: true, useNewUrlParser: true});
mongoose.set("useCreateIndex",true);

const clientSchema = new mongoose.Schema({
  Firstname:String,
  lastname:String,
  email:String,
  password:String,
  article:String
});


clientSchema.plugin(passportLocalMongoose);

const Client = new mongoose.model("Client",clientSchema);

passport.use(Client.createStrategy());
passport.serializeUser(Client.serializeUser());
passport.deserializeUser(Client.deserializeUser());

app.get("/",function(req,res){
  res.render("home");
});

app.get("/feed",function(req,res){
  Client.find({"article":{$ne : null}},function(err,results){
      if (err) {
        console.log(err);
      }
      else {
        res.render("feed",{newListItem:results});
      }

  });

});

app.get("/login",function(req,res){
    res.render("login");
  });

app.get("/register",function(req,res){
    res.render("register");
  });


app.get("/article",function(req,res){
  if (req.isAuthenticated()) {
    if (req.user.article==undefined) {
      res.render("article",{content:"No current Articles"});
    }
    else {
      res.render("article",{content:req.user.article});
    }

  }
  else {
    res.redirect("/login");
  };
});

// app.get("/:customListName",function(req,res){
//   Client.findOne({name:customListName},function(err,results){
//     if(err)
//     {
//       console.log(err);
//     }
//     else
//     {
//       if (!results) {
//         re
//         res.redirect("/"+ customListName);
//       }
//       else {
//           res.render("lists",{listTitle: customListName , newListItem : results.items });
//       }
//     }
//   });
//
// });


app.post("/article",function(req,res){
  const submittedArticle = req.body.content;
  Client.findOne({username: req.user.username},function(err,result){
    if (err) {
      console.log(err);
    }
    else {
      result.article = submittedArticle;
      result.save()

    }
  });
    res.redirect("/article");
})



app.post("/register",function(req,res){
   Client.register({username:req.body.username,Firstname:req.body.firstname,lastname:req.body.lastname},req.body.password,function(err,client){
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/login");
      });
    }

  });

});

app.post("/login",function(req,res){

  const client = new Client({
    username:req.body.username,
    password:req.body.password
  });
  req.login(client,function(err){
    if (err) {
      console.log(err);
    }
    else {
      passport.authenticate("local")(req,res,function(){
          res.redirect("/article");
      });
    };
  });
});









  app.listen(3000,function(){
      console.log("Server started on port 3000");
  });
