import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';
import {doc, setDoc, collection, query, where, getDocs} from "firebase/firestore";
import {db} from "../../../firebasecofig.js";
import { config } from 'dotenv';

// Load environment variables
config();

// --- Azure config ---
const azure = createAzure({
  resourceName: process.env.AZURE_RESOURCE_NAME,
  apiKey: process.env.AZURE_API_KEY,
  // apiVersion will use default supported version
});

// Fetch & base64-encode the image
async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr).toString('base64');
}

// Next.js API handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    // Get the image URL and email from the request body
    const { imageUrl, email } = req.body;
    
    if (!imageUrl || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing imageUrl or email in request body' 
      });
    }

    console.log('Processing image for user:', email);

    // Convert image to base64
    const base64Image = await fetchImageAsBase64(imageUrl);

    // Use your Azure deployment name from environment variables
    const deployment = process.env.AZURE_DEPLOYMENT_NAME;
    
    const result = await generateText({
      model: azure(deployment),
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Find expiry date in format YYYY-MM-DD' },
            { type: 'image', image: `data:image/jpeg;base64,${base64Image}` },
          ],
        },
      ],
    });

    const expiryDate = result.text?.trim() || 'No expiry date found';
    console.log('AI Analysis result:', expiryDate);

    // Save the result to Firebase
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User found - update their document
        const userDoc = querySnapshot.docs[0];
        const userRef = userDoc.ref;
        
        await setDoc(userRef, {
          ...userDoc.data(), // Keep existing user data
          expiryDate: expiryDate,
          productname: "Britannia Bread",
          lastAnalyzed: new Date(),
          imageUrl: imageUrl
        });
        
        console.log('Successfully saved analysis result to Firebase for user:', email);
      } else {
        console.log('No user found with email:', email);
        return res.status(404).json({
          success: false,
          message: 'User not found with provided email'
        });
      }
    } catch (firebaseError) {
      console.error('Firebase save error:', firebaseError);
      // Continue to send the AI result even if Firebase fails
    }

    // Send successful response back to the frontend
    res.status(200).json({ 
      success: true, 
      response: expiryDate
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Send error response back to the frontend
    res.status(500).json({ 
      success: false, 
      message: error?.data?.error?.message || error?.message || 'Analysis failed' 
    });
  }
}
