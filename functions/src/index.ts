/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import { setGlobalOptions } from "firebase-functions";
import axios from "axios";

import * as dotenv from 'dotenv';
dotenv.config();

// Optionally, for type safety:
// import { Request, Response } from "express";
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
const geminiApiKey = process.env.GEMINI_API_KEY;

setGlobalOptions({maxInstances: 10});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
export const analyzeProduct = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  try {
    const photoUrl = req.body.photoUrl;

    // ADD THIS CHECK:
    if (!photoUrl || typeof photoUrl !== "string" || !photoUrl.trim()) {
      res.status(400).send({
        error: "No image URL provided. Please include a valid 'photoUrl' in your request."
      });
      return;
    }

    console.log("photoUrl used: " + photoUrl);

    const prompt = `
You are Save.ai — an AI shopping assistant that helps users evaluate how much 
of a product's price is driven by real value versus branding/marketing. You 
must always provide clear, consumer-friendly estimates based on your training 
and general public data.

You are NOT always 100% accurate — you must indicate your confidence level. 
Be practical, concise, and always return JSON only.

Here is an image or description of a product: ${photoUrl} Identify the product as 
accurately as possible.

If you do not receive a valid image URL, respond with an error message
indicating that a valid 'photoUrl' is required. No other text is necessary.

  TASKS:
  Identify the brand name and product name from the image or description.
  Estimate average retail price in USD if known. If the product comes in multiple sizes, default to the most common size.
  Marketing Transparency Score (1.0-10.0 to the tenth decimal place): 
  Compare the product to other products of the same category and give it a 
  Marketing Transparency Score based on how heavily the company spends on 
  marketing compared to the average product in that category. A higher score 
  means less marketing. Value Index (1.0-10.0 to the tenth decimal place): estimate what percent of 
  the price goes toward real value (ingredients, materials, manufacturing, 
  sustainability). Fairness Score (1.0-10.0 to the tenth decimal place): this score should 
  assess whether or not the customer is getting what they are paying for.

  Provide short diction to represent each of these scores. If 1-3, write “Low”,
  if 3-5, write “Moderately Low”, if 5-6, write “Moderate”, if 6-7, write 
  “Fair”, if 7-8, write “Good”, if 8-9, write “Great”, if 9-10, write “Excellent”.


  Suggest two cheaper or more budget-friendly alternatives that perform the 
  same function but with less branding overhead. Include the alternative brand 
  name, product name, and approximate price, including how much money they will
  save by buying the alternative product. If the item is sold by volume, the volume
  should be the same as the original product for accurate comparison.

 Then provide a 100-115 word explanation of the analysis in analysisSummary,
 including the product's value, marketing transparency, and fairness. Compare functionality and price with the smart alternatives with 
 enough detail to give them insight as to whether to buy the original product or one of the alternatives.

Do NOT nest any fields. All fields must be at the top level of the JSON object. Do not group fields under any headings or objects.
Always return your response as a single, flat JSON object like this:

{
  "brandName": "string",
  "productName": "string",
  "priceUsd": 0.0,
  "marketingTransparencyScore": 0.0,
  "marketingTransparencyLabel": "string",
  "valueIndexScore": 0.0,
  "valueIndexLabel": "string",
  "fairnessScore": 0.0,
  "fairnessLabel": "string",
  "confidenceLevel": "High",
  "analysisSummary": "string",
  "smartAlternativesBrandName1": "string",
  "smartAlternativesProductName1": "string",
  "smartAlternativesPriceUsd1": 0.0,
  "smartAlternativesSavingsVsOriginal1": 0.0,
  "smartAlternativesBrandName2": "string",
  "smartAlternativesProductName2": "string",
  "smartAlternativesPriceUsd2": 0.0,
  "smartAlternativesSavingsVsOriginal2": 0.0
}

FLAT JSON ONLY. Do NOT return any Markdown code blocks or other formatting.
Make sure all numbers are numeric (not strings) and JSON is properly formatted. Nothing should be nested.

If you are uncertain, do your best and clearly state that in
'confidenceLevel'. Do NOT include extra commentary outside the JSON.
`;

        const geminiResponse = await axios.post(
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0
    }
  },
  {
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': geminiApiKey
    }
  }
);

console.log("Got Gemini response:\n" + JSON.stringify(geminiResponse.data, null, 2));

// filepath: c:\Users\saamf\firebase\functions\src\index.ts
const rawText = (geminiResponse.data as any)?.candidates?.[0]?.content?.parts?.[0]?.text;

if (!rawText) {
  console.error("No content returned from Gemini:", geminiResponse.data);
  res.status(500).send({ error: "No content returned from Gemini", details: geminiResponse.data });
  return;
}

// Clean Gemini's response of Markdown code blocks
let cleanedText = rawText.trim();
if (cleanedText.startsWith('```json') || cleanedText.startsWith('```')) {
  cleanedText = cleanedText.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
}
try {
  const parsed = JSON.parse(cleanedText);
  res.status(200).json(parsed);
} catch (err) {
  console.error("Failed to parse Gemini response as JSON:", cleanedText);
  res.status(500).send({
    error: "Gemini did not return valid JSON",
    details: cleanedText
  });
}

  } catch (error) {
    console.error("Error analyzing product:", error);
    res.status(500).send("Error analyzing product.");
  }
});
