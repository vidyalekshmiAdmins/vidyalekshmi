const mongoose = require("mongoose");
const User = require("../model/userModel");
const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const ApplyCertificate = require("../model/applyCertificate");




const index = express();
index.use(bodyParser.urlencoded({ extended: true }));
index.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/user/img');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });




//for loading the applyy for certificate page
const loadApplyForCertificate = async(req,res)=>{
  try {
    res.render('./user/pages/applyCertificate')
  } catch (error) {
    throw new Error(error);
  }
}





  const applyForCertificate = async (req, res) => {
    try {
      const formData = {
          name: req.body.name,
          dateOfBirth: req.body.dateOfBirth,
          fathersName: req.body.fathersName,
          mothersName: req.body.mothersName,
          email: req.body.mailId,
          mobileNumber: req.body.mobNo,
          collegeName: req.body.collegeName,
          modeOfStudy: req.body.modeOfStudy,
          university: req.body.university,
          course: req.body.course === 'Other' ? req.body.otherCourse : req.body.course,
          mainSubject: req.body.mainSubject,
          secondLanguage: req.body.secondLanguage,
          schemaOfStudy: req.body.schemaOfStudy,
          schemaDetails: req.body.schemaDetails,
          purposeOfApplication: req.body.purpose === 'Other' ? req.body.otherPurpose : req.body.purpose,
          documents: req.files.map(file => ({
            name: file.originalname,
            path: file.path
          }))
      };
  
      const newApplication = new ApplyCertificate(formData);
      await newApplication.save();
  
      res.send('Form submitted successfully');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while processing your application.');
    }
  };



module.exports ={ loadApplyForCertificate,
  applyForCertificate}