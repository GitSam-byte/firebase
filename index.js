// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// TODO: Replace this with your actual Firebase project config:
const firebaseConfig = {
  apiKey: "AIzaSyDNitCBXsr2hmMEvbUkX5bwHSoirnF_EHQ",
  authDomain: "save-a-i-adduoy.firebaseapp.com",
  projectId: "save-a-i-adduoy",
  storageBucket: "save-a-i-adduoy.appspot.com",
  messagingSenderId: "26597607080",
  appId: "1:26597607080:web:b5c62d8aa327e98a4f649d"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.analyzeProduct = functions.https.onRequest(async (req, res) => {
  // Handle CORS for FlutterFlow
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  try {
    const {photoUrl} = req.body; // Expecting { "photoUrl": "https://..." }

    console.log('Received photo URL:', photoUrl);

    // TODO: Add your real AI/image analysis logic here.
    // For now, here’s a dummy example response:
    const productName = "EcoClean Laundry Detergent";
    const brandName = "EcoClean";
    const price = 12.99;
    const fairnessScore = 8; // out of 10
    const marketingTransparency = 7; // out of 10
    const valueIndex = 9; // out of 10
    const analysisSummary = "EcoClean Laundry Detergent offers a competitive price point with minimal marketing overhead compared to similar products. Its ingredients are transparent, and the packaging is eco-friendly, giving it a high value index.";
    const confidenceRating = 92; // %

    const smartAlternatives = [
      {
        brandName: "NatureWash",
        productName: "NatureWash Eco Detergent",
        price: 10.99,
        moneySaved: 2.00
      },
      {
        brandName: "GreenPure",
        productName: "GreenPure Laundry Liquid",
        price: 11.49,
        moneySaved: 1.50
      },
      {
        brandName: "SimpleSud",
        productName: "SimpleSud Clean Wash",
        price: 9.99,
        moneySaved: 3.00
      }
    ];

    const result = {
      productName,
      brandName,
      price,
      fairnessScore,
      marketingTransparency,
      valueIndex,
      analysisSummary,
      confidenceRating,
      smartAlternatives
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).send('Error analyzing product.');
  }
});
