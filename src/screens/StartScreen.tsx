import React from "react";
import { SignInButton } from '@clerk/clerk-react';
import "../index.css";

export default function StartScreen() {
    return (
    <div className='start'>
        <text>Sign in to get started</text>
        <br />
        <SignInButton />
    </div>
    );
}