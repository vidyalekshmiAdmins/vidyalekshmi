const myEnv = require('dotenv').config()

const sessionSecret=process.env.SESSIONSECRET




module.exports = { 
  myEnv,
  sessionSecret
 
}