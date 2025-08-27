import React from 'react';
import Prism from './ui/Prism';
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useState, useEffect } from 'react';
import { app, signUpWithEmail, signInWithEmail, logOut, db } from '../../firebaseconfig';
import { getAuth } from 'firebase/auth';    
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

import {
    Card,
    CardAction,
    CardContent,
    CardDescription, 
    CardFooter,
    CardHeader,
    CardTitle,
  } from "./ui/card"

const Hero = () => {
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [isSignUp, setIsSignUp] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const auth = getAuth(app);
    const [user, setUser] = useState(null);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            console.log("user", user);
        });
        return () => unsubscribe();
    }, [auth]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Basic validation
        if (!email || !password) {
            setError("Please fill in email and password");
            setLoading(false);
            return;
        }

        if (isSignUp && !phone) {
            setError("Please fill in phone number for sign up");
            setLoading(false);
            return;
        }

        try {
            let result;
            if (isSignUp) {
                // Sign up new user
                result = await signUpWithEmail(email, password, phone);
                if (result.success) {
                    setSuccess("Account created successfully! You are now signed in.");
                    setEmail("");
                    setPhone("");
                    setPassword("");
                }
            } else {
                // Sign in existing user
                result = await signInWithEmail(email, password);
                if (result.success) {
                    setSuccess("Signed in successfully!");
                    setEmail("");
                    setPassword("");
                }
            }

            if (!result.success) {
                setError(result.error);
            }
        } catch (error) {
            setError("An unexpected error occurred: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    const handleLogout = async () => {
        setLoading(true);
        const result = await logOut();
        if (result.success) {
            setSuccess("Logged out successfully!");
        } else {
            setError("Failed to log out: " + result.error);
        }
        setLoading(false);
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    }

    const handlePhoneChange = (e) => {
        setPhone(e.target.value);
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    }

  return (
      <div className="h-screen w-full relative">
  <Prism
    animationType="rotate"
    timeScale={0.5}
    height={3.5}
    baseWidth={5.5} 
    scale={3.6}
    hueShift={0}
    colorFrequency={1}
    noise={0}
    glow={0.7}
  />
  <div className="absolute inset-0 flex items-center justify-center">
    <Card className='w-96 bg-background/50'>
      {user ? (
        // User is signed in - show welcome message
        <>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-center text-foreground'>Welcome!</CardTitle>
            <CardDescription className='text-center'>You are signed in as {user.email}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className='w-full bg-red-600 text-white hover:bg-red-700' 
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? "Logging out..." : "Log out"}
            </Button>
          </CardFooter>
        </>
      ) : (
        // User is not signed in - show auth form
        <>
          <CardHeader>
            <CardTitle className='text-2xl font-bold text-center text-foreground'>
              {isSignUp ? "Sign up" : "Sign in"}
            </CardTitle>
            <CardDescription className='text-center'>
              {isSignUp ? "Create a new account" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 rounded border border-red-300">
                {error}
              </div>
            )}
        
            
            <Input 
              type="email" 
              placeholder="Email" 
              className='text-foreground border-[0.5px] border-foreground/50'
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
            />
            
            <Input 
              type="password" 
              placeholder="Password" 
              className='text-foreground border-[0.5px] border-foreground/50'
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
            />
            
            {isSignUp && (
              <Input 
                type="tel" 
                placeholder="Phone Number" 
                className='text-foreground border-[0.5px] border-foreground/50'
                value={phone}
                onChange={handlePhoneChange}
                disabled={loading}
              />
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <Button 
              className='w-full bg-foreground text-background hover:bg-foreground/70' 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign up" : "Sign in")}
            </Button>
            
            <Button 
              variant="ghost" 
              className='w-full text-foreground hover:text-decoration-line: underline hover:!bg-transparent hover:!text-foreground hover:cursor-pointer' 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              disabled={loading}
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  </div>
</div>
  );
};

export default Hero;