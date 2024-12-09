const dotenv = require('dotenv');
dotenv.config();
const { initializeApp,cert } =require("firebase-admin/app");
const {getFirestore} = require('firebase-admin/firestore'); 
const base64Cred = process.env.FIREBASE_CRED_BASE64;

const firebaseCred = JSON.parse(Buffer.from(base64Cred, 'base64').toString('utf-8'));

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web apps Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional\





initializeApp({
  credential: cert(firebaseCred)
});
// Initialize Firebase
const db = getFirestore();
module.exports = db;

