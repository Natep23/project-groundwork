import { SignInButton } from "@clerk/clerk-react";

export default function StartScreen() {
  return (
    <main className="start-hero">
      <div className="start-hero__plot">
        <div className="eyebrow start-hero__eyebrow">GroundWork · Personal dev tracking</div>
        <h1>
          Break <em>ground</em> on the next build.
        </h1>
        <p>
          One board for every side project: research it, build it, ship it. Cards carry their own
          tasks and Obsidian notes, so the whole plan stays in one place.
        </p>
        <SignInButton mode="modal">
          <button className="btn btn--primary">Sign in to start</button>
        </SignInButton>
      </div>
    </main>
  );
}
