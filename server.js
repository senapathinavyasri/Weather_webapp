var express = require('express')  
var app = express()
const parser = require('body-parser');
const axios = require('axios');
const ejs = require('ejs');
var passwordHash = require("password-hash");
app.use(parser.urlencoded({ extended: true }));
app.set(parser.json());
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Filter } = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount)
});

app.set("view engine","ejs");
app.use(express.static(__dirname + '/weather'));
const db = getFirestore();
app.get('/signin', function (req, res) {  
    res.render("signin.ejs",{used : " "});
});
app.post("/signinsubmit", function (req, res) {
     db.collection("users1")
       .where(
         Filter.or(
            Filter.where("Email", '==', req.body.Email),
            Filter.where("Name", "==" ,req.body.name)
         )
       )
       .get()
       .then((docs) => {
          if(docs.size > 0){
            const str = "user name or email already exists";
            res.render("signin.ejs",{used : str});
          }  else{
            db.collection("users1").add({
              Email: req.body.Email,
              Name: req.body.name,
              Password1: passwordHash.generate(req.body.Password),
          }).then(()=>{
              res.render("login.ejs");
          });
          }
       })
});
app.post("/loginsubmit", function (req, res) {
    db.collection("users1")
    .where("Email", "==", req.body.Email)
    .get()
    .then((docs) => {
      let check=false;
      docs.forEach((doc) => {
        check=passwordHash.verify(req.body.Password, doc.data().Password1);
      }
    );
    if(check){
      res.render("index.ejs",{ temp: " " ,icon : " " ,text : " ",c : " ",history:" "});
    }
    else{
      res.send("INVALID CREDENTIALS.\nKindly enter valid details");
    }
    });
});
 let history = [];
app.post('/', (req, res) => {
    const location = req.body.loc;
    db.collection("weather_history")
      .get()
      .then((docs) => {
        docs.forEach((doc) => {
          history.push(doc.data());
        })
      });
    const apiurl = `https://api.weatherapi.com/v1/current.json?key=ec915c577f0141109d2133528232908&q=${location}&aqi=no`;
    axios.get(apiurl)
      .then((response) => {
        const t = response.data.current.temp_c;
        const  icon = response.data.current.condition.icon;
        const text = response.data.current.condition.text;
        const cd= "°C"; 
        res.render("index.ejs", { temp: t ,icon : icon ,text : text, c:cd,history:"chennai,hyderabad,tanuku"});
      })
      .catch((error) => {
        console.log(error.message);
        res.render("index.ejs", {temp:'Error in fetching the data',icon:'',text:'',c:" ",history:" "});
      });
  });

  console.log(history);
  app.listen(3400, function () {  
    console.log('Example app listening on port 3000!')  
    }) 
