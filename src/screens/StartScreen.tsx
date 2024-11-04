import React from "react";
import { SignInButton } from '@clerk/clerk-react';
import "../index.css";

export default function StartScreen() {
    return (
    <div className='start'>
        <span>Sign-In To Get Started</span>
        <br />
        <SignInButton/>
    </div>
    );
}