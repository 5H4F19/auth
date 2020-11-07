const fs = require('fs');

// ----------------------------------------------------------------------------------------------------//
//          userController
//-----------------------------------------------------------------------------------------------------//

const userController = `

const { verify } = require("jsonwebtoken");
const User = require("../models/userModel");


exports.home_view = (req, res) => {
    try {

        res.status(200).render('home',{
          // parameter
        });
    } catch (err) {
       
        res.status(200).render('failed',{
          //parameter
        });
    }
};

exports.signup_view = (req, res) => {
    try {
        res.status(200).render('signup', {
            //parameter
        });

    } catch (err) {
       res.status(200).render('failed',{
          //parameter
        });
    }
};

exports.login_view =async(req, res) => {
    try {
         const valid = req.params.slug;
         if (valid) {
             const decode =verify( req.params.slug, 'J3mH^j$Rzxqh2UbQRD0ZF0TgmVmtehy');
             if (decode) {
                 const user = await User.findByIdAndUpdate(decode.id, { active: 'true' }).select('+active');
                 if (user) {
                     res.redirect('http://127.0.0.1:3000/login');
                     
                 }
              
             }
         }
       
      
    } catch (err) {
         res.status(200).render('failed',{
          
        });
  }
};

exports.login_page = async (req, res) => {
    try {
      res.status(200).render('login',{
        // code here
      });
    } catch (e) {
        console.log(e)
  }
};`;

// ----------------------------------------------------------------------------------------------------//
//          authController
//-----------------------------------------------------------------------------------------------------//


const authController = `
const { sign } = require('jsonwebtoken');
const User = require('../models/userModel');
const Email = require('../utilities/email');

const signToken = id => {
    return sign({ id },'J3mH^j$Rzxqh2UbQRD0ZF0TgmVmtehy', {
            expiresIn:'10d'
        });
}
const createSendToken = (user, res) => {
    
    const token = signToken(user._id);
    const cokieOptions = {
        expires :new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    res.cookie('jwt', token, cokieOptions);
    res.status(200).json({
        data: {
            status: 'success',
            message:'Succesful login'
      }
    });

       
};

const mail = async (email, name, token) => {
    
    const mail = new Email(email).send(name, token);
    return mail ? 1 : 0;

}

exports.signup = async (req, res) => {
    try {
        const existUser = await User.findOne({ email: req.body.email });
        if (!existUser) {
        
             const newUser = await User.create({
                username: req.body.username,
                institution:req.body.institution, 
                email: req.body.email,
                password: req.body.password
             });
            if (newUser) {
                const token = signToken(newUser._id);
            
                if (await mail(newUser.email, newUser.name, token)) {
                res.status(200).json({
                data: {
                    status: 'success',
                    message:'Check your email to verify your account'
                }
                });
                } else {
                res.status(200).json({
                data: {
                    status: 'danger',
                    message:'Could not send email'
                }
                });
                }
            } else {
                 res.status(200).json({
                data: {
                    status: 'danger',
                    message:'Could not create an account'
              }
            });
            }
        } else {
            res.status(200).json({
                data: {
                    status: 'danger',
                    message:'User exists'
              }
            });
        }
    } catch (e) {
        res.status(200).json({
           data: {
                    status: 'danger',
                    message:'Something went wrong, try again'
              }
        });
  }
};

exports.isLogggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            res.locals.user = 1;
            next();
           
        } else {
            res.locals.user = 0;
            next();
           
      }
    } catch (e) {
        console.log(e)
  }
};

exports.protect = async (req, res,next) => {
    try {
        if (req.cookies.jwt) {
            next();
        } else {
            res.redirect('http://127.0.0.1:3000/login');
        }
        
    } catch (e) {
        res.redirect('http://127.0.0.1:3000/');
    }
};

exports.protect2 = async (req, res,next) => {
    try {
        if (!req.cookies.jwt) {
            next();
        } else {
            res.redirect('http://127.0.0.1:3000');
        }
        
    } catch (e) {
        res.redirect('http://127.0.0.1:3000');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const existUser =await User.findOne({email}).select('+active').select('+password');
        if (existUser) {
            if (existUser.active) {
    
                if (!(await existUser.correctPassword(password, existUser.password))) {
                    console.log('invaid email or password')
                    res.status(200).json({
                        data: {
                            status: 'danger',
                            message:'Invalid email or password'
                      }
                    });
                } else {
                    createSendToken(existUser, res);
                    
                    
                }

            } else {
                console.log('your email not verified')
                res.status(200).json({
                    data: {
                        status: 'danger',
                        message:'Your email not verified'
                  }
                });
            }
        } else {
            console.log('user does not exist')
             res.status(200).json({
                    data: {
                        status: 'danger',
                        message:'User does not exist'
                  }
                });
        }
    } catch (e) {
        console.log(e)
  }
    
};

exports.logout = async (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
};`;

// ----------------------------------------------------------------------------------------------------//
//          userRouter
//-----------------------------------------------------------------------------------------------------//

const userRouter = `


const express = require('express');
const { signup, login, protect2, logout } = require('../controllers/authController');
const { signup_view ,login_view, login_page, home_view } = require('../controllers/userController');
const userRouter = express.Router();
       
userRouter.route('/').get(home_view);
userRouter.route('/signup').get( protect2, signup_view);
userRouter.route('/signup').post(signup);
userRouter.route('/login/:slug').get(login_view);
userRouter.route('/login').get( protect2, login_page);
userRouter.route('/login').post(login);
userRouter.route('/logout').get(logout);


module.exports = userRouter;`;


// ----------------------------------------------------------------------------------------------------//
//          userModel
//-----------------------------------------------------------------------------------------------------//

const userModel = `
const { hash, compare } = require('bcryptjs');
const mongoose = require('mongoose');


const Schema =new mongoose.Schema({
 
    username: {
        type: String,
        required: true,
        trim:true
    },
    institution: {
        type: String,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true   
        
    },
    password: {
        type: String,
        minlength: 8,
        select: false,
        required:true
    },
    active: {
        type: Boolean,
        default: false,
        select:false
    }

});

Schema.pre('save', async function (next) {
 
    // Hash the password with 12
    this.password = await hash(this.password, 12);
    next();
});

Schema.methods.correctPassword = async function (candPass, userPass) {
    console.log(candPass);
    console.log(userPass);
    return await compare(candPass, userPass);
};


const User = mongoose.model('User', Schema);
module.exports = User;`;


// ----------------------------------------------------------------------------------------------------//
//          utilities
//-----------------------------------------------------------------------------------------------------//

const email = `

const { createTransport } = require("nodemailer");
const pug = require('pug');
const htmlToText = require('html-to-text');



module.exports = class Email{

    constructor(email) {
        this.to = email;
        this.url = '127.0.0.1:3000';
        this.from = 'shafiqsoweb@gmail.com';
    }


    createNewTransport() {
        return createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "f888011e6e5d5c",
                pass: "f013b751d10d5a"
            }
        });
        
        
    }

    async send(name,token) {
        // 1. Render HTML based on a pug templete
        
        const html = pug.renderFile('../views/emails/mailtrap.pug', {
            name: name,
            token:token
        });
        // 2. Define email options
        const mailOptions = {
        from: this.from,
        to: this.to,
        url: this.url,
        html,
        text: htmlToText.fromString(html)
        };

        await this.createNewTransport().sendMail(mailOptions);
    }
    
    
}`;


// ----------------------------------------------------------------------------------------------------//
//          pug
//-----------------------------------------------------------------------------------------------------//

const signup = `

extends index
block content
  .container
    .box.mx-auto.d-block
      .inner-box.mx-auto.d-block
        p.loginv signup
      .inner-box.mx-auto.d-block
        input#username(type='text' name='name' placeholder='Username')
      .inner-box.mx-auto.d-block
        input#institution(type='text' name='institution' placeholder='Institution')
      .inner-box.mx-auto.d-block
        input#email(type='email' name='email' placeholder='Email address')
      .inner-box.mx-auto.d-block
        input#password(type='password' name='password' placeholder='Password')
      .inner-box.mx-auto.d-block
        input#confirmPassword(type='password' name='confirmPassword' placeholder='Confirm Password')
      .inner-box.mx-auto.d-block
        button.btn#Verify(type='submit') Submit

  script(src='js/bundle.js')`;


const login = `

extends index
block content
  .container
    .box.mx-auto.d-block
      .inner-box.mx-auto.d-block
        p.loginv login
      .inner-box.mx-auto.d-block
        input#email(type='email' name='email' placeholder='Email address')
      .inner-box.mx-auto.d-block
        input#password(type='password' name='password' placeholder='Password')
      .inner-box.mx-auto.d-block
        button.btn(type='submit') Submit

  script(src='js/bundle.js')`;

const index = `
doctype html
head
  meta(charset='UTF-8')
  meta(name='viewport' content='width=device-width, initial-scale=1.0')
  title index
  link(rel='stylesheet' href='css/bootstrap.min.css' type='text/css')
  link(rel='stylesheet' href='css/login.css' type='text/css')
  link(rel='stylesheet' href='css/fontawesome-free-5.13.1-web/css/all.css')

block content`;

const home = `
extends index
block content
    .container.text-right
        if user
            a(href='/logout') logout
        else
            a(href='/signup') signup
            a(href='/login') login
    .container
        .container-fluid.p-5
            .text-center.my-auto.h1.p-5
            | Authentication
`;

const email_pug = `
doctype html
head
  meta(charset='UTF-8')
  meta(name='viewport' content='width=device-width, initial-scale=1.0')
  title Email verification
  style.
    .box{
    min-width: 300px;
    width: 400px;
    margin: 0 auto;
    padding: 20px;
    font-family:Arial, Helvetica, sans-serif;
    background: url(iconic.png);
    background-size: 200px;
    background-repeat: no-repeat;
    background-position-x:20px;
    height:300px;
    padding-top: 60px;
    }
    .name{
    font-size: 20px;
    color: rgb(20, 20, 20);
    font-family: Arial, Helvetica, sans-serif;
    font-weight: bolder;
    }
    .btn{
    text-decoration: none;
    border: none;
    border-radius: 5px;
    padding: 10px 17px;
    color: rgb(255, 255, 255);
    background: #5BD9F3;
    font-family:Arial, Helvetica, sans-serif;
    font-weight:;
    }
.box
  div
    p.name= 'Hi %{name}'
    p You are almost done.Just click the button to verify
  div
    a.btn(href='http://127.0.0.1:3000/login/%{token}') Confirm your email
  div
    p or
    p
      a(href='http://127.0.0.1:3000/login/%{token}')= 'http://127.0.0.1:3000/login/%{token}'
`;

const webpack_config = `
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/js'),
    filename: 'bundle.js'
  }
};`;

const alerts = `
export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
};


export const showAlert = (type, msg) => {
    hideAlert();
    const markup = '< div class="alerting text-center bg-%{type}" > %{ msg }</div > ';
    document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
    window.setTimeout(() => {
        hideAlert(); 
    },1500);
};
`;

const indexjs = `

import '@babel/polyfill';
import { sendRequest, sendRequest2 } from './requests';
import validator from 'validator';

//reload
   function myFunction() {
    document.querySelector('.btn').innerHTML = 'Submitted';
    document.querySelector('.btn').classList.add('clicked');
};

function reload() {
    setTimeout(function () {
        window.location.reload(1);
    }, 10000);
};
     

     
// Sending request for sign up
if (window.location.href === 'http://127.0.0.1:3000/signup') {

    const submition = document.querySelector('#Verify');

    submition.addEventListener('click', function () {
        const username = document.querySelector('#username').value;
        const institution = document.querySelector('#institution').value;
        const email = document.querySelector('#email').value;
        const passoword = document.querySelector('#password').value;
        const confirmPassword = document.querySelector('#confirmPassword').value;
        const validPass = username && institution && validator.isEmail(email) && validator.isLength(passoword, { min: 8 }) && validator.equals(passoword,confirmPassword);
    
        if (validPass) {
            sendRequest(
                username,
                institution,
                email,
                passoword
            );
            myFunction();
            document.querySelector('#email').value = '';
            document.querySelector('#password').value = '';
            document.querySelector('#username').value = '';
            document.querySelector('#institution').value = '';
            document.querySelector('#confirmPassword').value = '';
            reload();


         
       
        }

    });
}
// Sending request for sign in
if (window.location.href === 'http://127.0.0.1:3000/login') {

    document.querySelector('.btn').addEventListener('click', function () {
        const email = document.querySelector('#email').value;
        const passoword = document.querySelector('#password').value;
        const valid = validator.isEmail(email) && validator.isLength(passoword, { min: 8 });
        if (valid) {
            sendRequest2(email, passoword);
            myFunction();
            document.querySelector('#email').value = '';
            document.querySelector('#password').value = '';
            reload();
           
        }
      
              
    });
}`;

const request = `
import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alerts';

export const sendRequest = async (username,institution,email,password) => {
    try {
       const res = await axios({
            method: 'post',
            url: 'http://127.0.0.1:3000/signup',
            data: {
                username,
                institution,
                email,
                password
            }
       });
        
        showAlert(res.data.data.status, res.data.data.message);
        
    } catch (e) {
        console.log(e);
    }

    
};

export const sendRequest2 = async (email, password) => {
    try {
        const res = await axios({
            method: 'post',
            url: 'http://127.0.0.1:3000/login',
            data: {
                email,
                password
            }
        });
        console.log(res);

        if (res.data.data.status === 'success') {
           
            showAlert('success', res.data.data.message);
            location.assign('/');
        } else {
           
             showAlert('danger', res.data.data.message);
        }
        
    } catch (e) {
        console.log(e);
  }
};`;

const server = `
const mongoose = require('mongoose');
const app = require('./app');

// // MongoDB CONNECTION
const DB ='mongodb+srv://shafiq:abdunnur01787@cluster0.6fikq.mongodb.net/al-maariz?retryWrites=true&w=majority';


mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(con => {
    console.log('connection successful')
});
// // mongoose.connect(process.env.DATABASE_LOCAL);

const port = 3000;
app.listen(port, () => {
    console.log('app running on port %{port}...'); 
});`;



const app = `
const helmet = require('helmet');
const express = require('express');
const userRouter = require('./routes/userRouter');
const path = require('path');
const cookieParser = require('cookie-parser');
const { isLogggedIn } = require('./controller/authController');



// CREATE APP
const app = express();
app.use(cookieParser());
app.use(isLogggedIn);

// Serving static files

app.use(express.static(path.join(__dirname, 'dist')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// GLOBAL MIDDLEWIRES

// Set security HTTP headers
app.use(helmet());



// Body perser, reading data from book into req,body
app.use(express.json());

// ROUTES
app.use('/',userRouter);

// EXPORT APP
module.exports = app;`;

exports.auth = () => {

    fs.mkdir('controllers', function () {
        fs.writeFile(`controllers/userController.js`, userController, function (err) { if (err) throw err; });
        fs.writeFile(`controllers/authController.js`, authController, function (err) { if (err) throw err; });
    
    });
    fs.mkdir('routes', function () {
        fs.writeFile(`routes/userRouter.js`, userRouter, function (err) { if (err) throw err; });
    
    });
    fs.mkdir('views', function () {
        fs.writeFile(`views/index.pug`, index, function (err) { if (err) throw err; });
        fs.writeFile(`views/home.pug`, home, function (err) { if (err) throw err; });
        fs.writeFile(`views/login.pug`, login, function (err) { if (err) throw err; });
        fs.writeFile(`views/signup.pug`, signup, function (err) { if (err) throw err; });
        fs.writeFile(`views/mailtrap.pug`, email_pug, function (err) { if (err) throw err; });
    
    });
    fs.mkdir('utilities', function () {
        fs.writeFile(`utilities/email.js`, email, function (err) { if (err) throw err; });
    });
    fs.mkdir('models', function () {
        fs.writeFile(`models/userModel.js`, userModel, function (err) { if (err) throw err; });
    });
    fs.mkdir('dist', function () {
        fs.mkdir('dist/css', function () { });
        fs.mkdir('dist/img', function () { });
        fs.mkdir('dist/js', function () { });
    });
    fs.mkdir('src', function () {
        fs.writeFile(`src/alerts.js`, alerts, function (err) { if (err) throw err; });
        fs.writeFile(`src/index.js`, indexjs, function (err) { if (err) throw err; });
        fs.writeFile(`src/requests.js`, request, function (err) { if (err) throw err; });
    });



    fs.writeFile(`webpack.config.js`, webpack_config, function (err) { if (err) throw err; });
    fs.writeFile(`server.js`, server, function (err) { if (err) throw err; });
    fs.writeFile(`app.js`, app, function (err) { if (err) throw err; });
}