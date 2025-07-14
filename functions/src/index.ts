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

    const prompt = `
You are Save.ai — an AI shopping assistant that helps users evaluate how much 
of a product's price is driven by real value versus branding/marketing. You 
must always provide clear, consumer-friendly estimates based on your training 
and general public data.

You are NOT always 100% accurate — you must indicate your confidence level. 
Be practical, concise, and always return JSON only.

Here is an image or description of a product: ${photoUrl} Identify the product as 
accurately as possible.

TASKS:
1. Identify:
   - Brand name
   - Product name

2. Estimate:
   - Average retail price in USD if known. If the product comes in multiple sizes, default to the most common size.
   - Marketing Transparency (1–10 to the tenth decimal place): Compare the product to other products of the same category and give it a Marketing Transparency Score based on how heavily the company spends on marketing compared to the average product in that category. A higher score means less marketing.
   - Value Index (1-10 to the tenth decimal place): estimate what percent of 
    the price goes toward real value (ingredients, materials, manufacturing, 
    sustainability). 
   - Fairness Score (1-10 to the tenth decimal place): this score should 
    assess whether or not the customer is getting what they are paying for.

Provide short diction to represent each of these scores. If 1-3, write “Low”,
  if 3-5, write “Moderately Low”, if 5-6, write “Moderate”, if 6-7, write 
 “Fair”, if 7-8, write “Good”, if 8-9, write “Great”, if 9-10, write “Excellent”.



3. Suggest two cheaper or more budget-friendly alternatives that perform the 
same function but with less branding overhead. Include the alternative brand 
name, product name, and approximate price, including how much money they will
 save by buying the alternative product. If the item is sold by volume, the volume
 should be the same as the original product for accurate comparison.

4. Always return your response as a single JSON block like this:

1. Identify:
   - brandName (string)
   - productName (string)

2. Estimate:
   - priceUsd (float) 
   - marketingTransparencyScore (float) — Score from 1.0 to 10.0
   (to the tenth decimal place)
   - marketingTransparencyLabel (string) — One of: "low", "moderately low", 
   "moderate", "good", "fair", "excellent"
   - valueIndexScore (float) — Score from 1.0 to 10.0
    (to the tenth decimal place)
   - valueIndexLabel (string) — One of: "low", "moderately low", 
   "moderate", "good", "fair", "excellent"
   - fairnessScore (float) — Score from 1.0 to 10.0 
   (to the tenth decimal place)
   - fairnessLabel (string) — One of: "low", "moderately low",
    "moderate", "good", "fair", "excellent"
   - confidenceLevel (string) — One of: "high", "medium", "low"
   - "analysisSummary" (string) — An 80-115 word summary of the analysis,
     including the product's value, marketing transparency, and fairness. Compare functionality and price with the smart alternatives.

3. Suggest two budget-friendly alternatives:
  smartAlternativesBrandName1: (string),
  smartAlternativesProductName1: (string),
  smartAlternativesPriceUsd1: (float),
  smartAlternativesSavingsVsOriginal1: (float),

  smartAlternativesBrandName2: (string),
  smartAlternativesProductName2: (string),
  smartAlternativesPriceUsd2: (float),
  smartAlternativesSavingsVsOriginal2: (float)
}
Make sure all numbers are numeric (not strings) and JSON is properly formatted.

If you are uncertain, do your best and clearly state that in 
'confidence_level'. Do NOT include extra commentary outside the JSON.
`;

    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': functions.config().gemini.key // <--- use this!
        }
      }
    );

    const result = geminiResponse.data;
    res.status(200).json(result);
  } catch (error) {
    console.error("Error analyzing product:", error);
    res.status(500).send("Error analyzing product.");
  }
});
