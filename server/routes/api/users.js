const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const key = require('../../config/keys').secret;
const User = require('../../model/User');
const utils = require('../../lib/utils');
const jwtDecode = require("jwt-decode");
const Leaderboard = require('../../model/Leaderboard');
//Should these routes be asycned
//**Note:Removed use from app.js paths may be broken, 
//       may need to include a leadding period
/**
 * @route POST api/users/register -> sending data
 * @desc Register the User
 * @access Public
 */
router.post('/register', (req, res) => {
    //switch to normal
    let {
        name,
        username,
        email,
        password,
        confirm_password
    } = req.body
    if (password !== confirm_password) {
        return res.status(400).json({
            msg: "Password do not match."
        });
    }
    
    // Check for the unique Username
    User.findOne({
        username: username
    }).then(user => {
        if (user) {
            return res.status(400).json({
                msg: "Username is already taken."
            });
        }
    })
    // Check for the Unique Email
    User.findOne({
        email: email
    }).then(user => {
        if (user) {
            return res.status(400).json({
                msg: "Email is already registred. Did you forgot your password."
            });
        }
    });
    // The data is valid and new we can register the user
    let newUser = new User({
        name,
        username,
        password,
        email
    });
    // Hash the password 
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
                .then((user) => {
                    
                   
                    // Add new user to leaderboard
                    let newLeaderboard = new Leaderboard({
                        // ! Might just use the object id as the id for all the actual models id
                        leaderboardID: "0",
                        totalPredictions: 0,
                        userID: user._id,
                        totalWins: 0,
                        averagePointsPerWin:0,
                        winPercentage:0,
                        score:0
                    });
                
                    newLeaderboard.save()
                    .then(()=>{
                        
                        // JWT Attached to response
                        const jwt = utils.issueJWT(user)
                        res.status(201).json({success:true, user: user, token: jwt.token, expiresIn: jwt.expiresIn})


                    }).catch(()=>{
                        return res.status(400).json({error:"Error creating a new leaderboard"});
                    })


                    
                    });
                });
        });
        
        

        // leaderboardID: {
        //     type: String,
        //     required: true
        // },
        // userID: {
        //     type: String,
        //     required: true
        // },
        // totalPredictions: {
        //     type: Number,
        //     required: true
        // },
        // totalWins: {
        //     type: Number,
        //     required: true
        // },
        // averagePointsPerWin: {
        //     type: Number,
        //     required: true
        // },
        // winPercentage: {
        //     type: Number,
        //     required: true
        // },
        // score: {
        //     type: Number,
        //     required: true
        // }

    });
// });
// bcrypt.genSalt(10, (err, salt) => {
//     bcrypt.hash(newUser.password, salt, (err, hash) => {
//         if (err) throw err;
//         newUser.password = hash;
//         newUser.save().then(user => {
//             return res.status(201).json({
//                 success: true,
//                 msg: "Hurry! User is now registered."
//             });
//         });
//     });
// }


//------------------> Will be redesigning this to include sessions and put it 
/**
 * @route POST api/users/login
 * @desc Signing in the User
 * @access Public
 */
router.post('/login', (req, res) => {
    User.findOne({
        username: req.body.username
    }).then(user => {
        if (!user) {
            return res.status(404).json({
                msg: "Username is not found.",
                success: false
            });
        }
        // If there is user we are now going to compare the password
        bcrypt.compare(req.body.password, user.password).then(isMatch => {
            if (isMatch) {

                const tokenObject = utils.issueJWT(user);

                res.status(200).json({success:true, user: user, token: tokenObject.token, expiresIn: tokenObject.expiresIn})

                // User's password is correct and we need to send the JSON Token for that user
                // const payload = {
                //     _id: user._id,
                //     username: user.username,
                //     name: user.name,
                //     email: user.email
                // }
                // //Sign token using package
                // jwt.sign(payload, key, {
                //     expiresIn: 604800
                // }, (err, token) => {
                //     res.status(200).json({
                //         success: true,
                //         token: `Bearer ${token}`,
                //         user: user,
                //         msg: "Hurry! You are now logged in."
                //     });
                // })
            } else {
                return res.status(401).json({
                    msg: "Incorrect password.",
                    success: false
                });
            }
        })
    })
    .catch((err) => {
        // do seomthing with the error
        return res.status(400).json({error:"Error logging in"});
        })
});


//-------------------------------------------------------> Learn sessions
/**
 * @route POST api/users/profile
 * @desc Return the User's Data ->*may add this to session.js later
 * @access Private
 */
// router.get('/profile', passport.authenticate('jwt', {
//     session: false
// }), (req, res) =>{
//     //How you retrieve data stored in a JWT token
//     res.send(jwtDecode(req.headers.authorization).username);

// res.status(200).json({success:true,msg:'You are Authorized'})
// });
router.get('/profile', passport.authenticate('jwt', {
    session: false
    }), (req, res) => {
    console.log("QQQQQQQQQQQQQQQ");
    return res.json({
        user: req.user

    });
    // res.status(200).json({success:true,msg:'You are Authorized'})
    
});
module.exports = router;