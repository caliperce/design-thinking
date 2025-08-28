import React from "react";
import Prism from './Prism/Prism';
import { Button } from "./ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "./ui/card"
  import { Input } from "./ui/input";
  import { useState } from "react";
  import { useRouter } from "next/router";
    import firebaseConfig from "../../firebasecofig.js"
  import {doc, setDoc, collection, query, where, getDocs} from "firebase/firestore";
  import {db} from "../../firebasecofig.js";
  





const Hero = () => {
    const router = useRouter(); // Initialize the Next.js router
    const [email, setEmail] = useState("");
    const [userData, setUserData] = useState(null); // Store the found user data
    const [isLoading, setIsLoading] = useState(false); // Track if we're searching
    const [errorMessage, setErrorMessage] = useState(""); // Store any error messages
    
    // Function to search for user by email in Firebase
    const searchUserByEmail = async (emailToSearch) => {
        try {
            setIsLoading(true); // Show loading state
            setErrorMessage(""); // Clear any previous errors
            setUserData(null); // Clear previous user data
            
            // Create a query to find users with matching email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", emailToSearch));
            
            // Execute the query
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                // No user found with this email
                setErrorMessage("No user found with this email address");
                setUserData(null);
            } else {
                // User found! Get the first matching document
                const userDoc = querySnapshot.docs[0];
                const foundUser = { id: userDoc.id, ...userDoc.data() };
                setUserData(foundUser);
                setErrorMessage("");
                console.log("User found:", foundUser);
                
                // Navigate to image-upload page with user data
                router.push({
                    pathname: '/image-upload',
                    query: { 
                         userId: foundUser.id,
                        userEmail: foundUser.email,
                        userName: foundUser.name || 'User' // fallback if name doesn't exist
                    }
                });
            }
        } catch (error) {
            console.error("Error searching for user:", error);
            setErrorMessage("Error searching for user. Please try again.");
        } finally {
            setIsLoading(false); // Hide loading state
        }
    };

    const handleSubmit = () => {
        if (!email.trim()) {
            setErrorMessage("Please enter an email address");
            return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setErrorMessage("Please enter a valid email address");
            return;
        }
        
        // Search for the user
        searchUserByEmail(email);
    }
  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
<div className="absolute inset-0 flex justify-center items-center z-10">
<Card className="w-1/2 h-40px bg-background/50 border-none  ">
  <CardHeader>
    <CardTitle className="text-white text-2xl font-bold text-center font-mono ">Enter the user email</CardTitle>
  </CardHeader>
  <CardContent className="flex justify-center items-center">
    <Input type="text" placeholder="Enter the input email" className="text-white border-0.7px solid white" value={email} onChange={(e) => setEmail(e.target.value)} />
  </CardContent>
  <CardFooter className="flex justify-center items-center">
    <Button className="bg-white text-black hover:bg-white/80 w-1/4" onClick={handleSubmit}>Submit</Button>
  </CardFooter>
</Card>
</div>


  <Prism
    animationType="rotate"
    timeScale={0.5}
    height={3.5}
    baseWidth={5.5}
    scale={3.6}
    hueShift={0}
    colorFrequency={1}
    noise={0}
    glow={1}
    
  />
 
</div>
  
  );
};

export default Hero;