const { User, Message,Upvote } = require('../models/models.js')
const jwt = require('jsonwebtoken')
const { Router } = require('express')
const router = Router()


router.get('/', async function (req, res){
    let messages = await Message.findAll({})

     
try{
    let vote = await Upvote.findAndCountAll()
    let likes = vote.rows;                           //count if count entry is 0, that means no like has been given
   if (vote.count ==0 ){                              //so default like will be zero
    let data = { messages ,likes, votes: vote.count }
    res.render('index.ejs', data)
    }

    else{
    let zero = 0;                       //count is not zero, that means a like has been given, so the value of the score
    let data = {messages, likes, votes: vote.rows[vote.count-1].dataValues.score, zeros: zero} // column in Upote model will be given to upvote at index.ejs
    res.render("index.ejs",data)

    }

}catch(err){
    let data ={messages, votes: 0 }
    res.render('index.ejs',data)
}
})


router.get('/createUser', async function(req, res){
    res.render('createUser.ejs')
})

router.post('/createUser', async function(req, res){
    let { username, password } = req.body

    try {
    (async ()=>await User.create({
            username,
            password,
            role:"user"
        }) ) ()
    } catch (e) {
        console.log(e)
    }

    res.redirect('/login')
})

router.get('/login', function(req, res) {
    res.render('login')
})

router.post('/login', async function(req, res) {
    let {username, password} = req.body


    try {
        let user = await User.findOne({                  //just have to move the previous code below into the scoope of try 
            where: {username}                           //so user can be defined in the if block
        })
        if (user && user.password === password) {
            let data = {
                username: username,
                role: user.role
            }
    
            let token = jwt.sign(data, "theSecret")
            res.cookie("token", token)
            res.redirect('/')
        } else {
            res.redirect('/error')
        }


    } catch (e) {
        console.log(e)
    }

    
})

router.get('/message', async function (req, res) {
    let token = req.cookies.token 

    if (token) {                                      // very bad, no verify, don't do this
        res.render('message')
    } else {
        res.render('login')
    }
})

router.post('/message', async function(req, res){
    let { token } = req.cookies
    let { content } = req.body

    if (token) {
        let payload = await jwt.verify(token, "theSecret")  
 
        let user = await User.findOne({
            where: {username: payload.username}
        })

        let msg = await Message.create({
            content,
            userId: user.id
        })

        res.redirect('/')
    } else {
        res.redirect('/login')
    }
})

router.get("/upvote/:link",function(req,res){
   let originalText = req.params.link;             
   let index = originalText.indexOf("$",0)
   let text = originalText.substring(0,index)         //get the origina ktext which has benn liked
   let count =originalText.substring(index+1, originalText.length)  //get the current numer of likes

    let intCount = parseInt(count)                      //add 1 to it after pasring it  to integer
    let intNextCount = intCount + 1
    if(intCount === 0){
        (async () => await Upvote.create({           //create upvote if score =0
            score: 1,
            userText: text
        }))()
        res.redirect("/")
    }
    else {
        (async()=> await Upvote.create({    //else create a score that is plus 1 to current score
            score: intNextCount,
            userText: text,                //push the text into the table so later at ejs, it will compare and give like to the correct messages
        }
     ))();

            res.redirect("/")
    }   
})



router.get('/error', function(req, res){
    res.render('error')
})

router.all('*', function(req, res){
    res.send('404 dude')
})

module.exports = router