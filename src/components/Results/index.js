import Link from "next/link";
import Router from "next/router";
import React, { useEffect } from "react";

export default function Results({ user, score, hasWon }) {
  useEffect(() => {
    async function rewardUser(XP, beans) {
      await fetch(`http://localhost:3001/users/${user}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ XP, beans }),
      });
    }
    hasWon && rewardUser(score * 10, 20);
  }, []);

  return (
    <div>
      {hasWon && (
        <div>
          <h2>Score: {score}</h2>
          <h2>XP: {score * 10}</h2>
          <h2>Beans: 20</h2>
          <Link href="/home">
            <a>
              <button>Continue</button>
            </a>
          </Link>
        </div>
      )}
      {!hasWon && (
        <div>
          <h2>You Lose!</h2>
          <button onClick={() => Router.reload(window.location.pathname)}>Try Again?</button>
          <Link href="/home">
            <a>
              <button>Exit</button>
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
