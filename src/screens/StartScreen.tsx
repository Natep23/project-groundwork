import React from "react";
import { SignInButton } from '@clerk/clerk-react';
import "../index.css";

export default function StartScreen() {
    return (
    <div className='start'>
        <text>Sign-In To Get Started</text>
        <br />
        <SignInButton/>
    </div>
    );
}