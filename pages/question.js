import { useEffect, useState, useRef } from "react";
import getAuth0User from "../src/controllers/Authorisation.js";
import useUserInfo from "../src/hooks/useUserInfo";
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Results from "../src/components/Results";
import styles from "../styles/questions.module.css";
import Button from "react-bootstrap/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { playSound } from "../src/controllers/Audio.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const showAnswer = false;

export default function Question({ questions, category, auth0User }) {
  const { user, error, isLoading } = useUser();
  const userInfo = useUserInfo(auth0User.username);

  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(questions[0]);
  const [win, setWin] = useState(false);
  const [complete, setComplete] = useState(false);
  const score = useRef(0);

  useEffect(() => {
    setCurrentQuestion(questions[questionCount]);
  }, [questionCount, questions]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  function checkAnswer(e) {
    // Check if text inside clicked button is equal to correct answer
    if (e.target.textContent == currentQuestion.correct) {
      playSound("correct-answer");
      score.current++;
    } else playSound("incorrect-answer");
    // Only increment question count if there is a question available to increment to
    if (questionCount < questions.length - 1) return setQuestionCount(questionCount + 1);
    calculateScore();
  }

  function calculateScore() {
    // More than 50% correct at end of quiz, setWin to true
    if (score.current >= questions.length * 0.5) {
      setWin(true);
      playSound("win", 500);
    } else {
      setWin(false);
      playSound("lose", 750);
    }
    setComplete(true);
  }

  const meterProgressPercentage = (100 / questions.length) * questionCount;

  const meterBarStyle = {
    height: `${complete ? 100 : meterProgressPercentage}%`,
    width: "100%",
    backgroundImage: 'url("/static/beanMeterFilled.png")',
    backgroundSize: "100%",
    borderRadius: "5px",
    transition: "2s",
  };
  const meterBarStyleResponsive = {
    width: `${complete ? 100 : meterProgressPercentage}%`,
    height: "100%",
    backgroundImage: 'url("/static/beanMeterFilledHorizontal.png")',
    backgroundSize: "auto 100%",
    borderRadius: "5px",
    transition: "2s",
  };

  return (
    user && (
      <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {!complete && (
          <div className={styles.exitButton}>
            <Link href="/home">
              <a>
                <h1>X</h1>
              </a>
            </Link>
          </div>
        )}

        <motion.div
          className={styles.meterContainer}
          animate={{ x: [-500, 0] }}
          transition={{ delay: 1 }}
        >
          <div className={styles.meterBackground}>
            <div style={meterBarStyle}></div>
          </div>

          <h1 className={styles.meterTitle}>Bean-O-Meter</h1>
        </motion.div>

        <motion.div
          className={styles.meterContainerResponsive}
          animate={{ y: [1000, 0] }}
          transition={{ delay: 1 }}
        >
          <div className={styles.meterBackgroundResponsive}>
            <div style={meterBarStyleResponsive}></div>
          </div>

          <h1 className={styles.meterTitleResponsive}>Bean-O-Meter</h1>
        </motion.div>

        {!complete && (
          <motion.div
            className={styles.questionContainer}
            animate={{ opacity: [0, 1] }}
            transition={{ duration: 1 }}
          >
            <h2 className={styles.questionText}>{currentQuestion.question}</h2>

            <motion.div
              className={styles.answers}
              animate={{ opacity: [0, 1] }}
              transition={{ delay: 1 }}
            >
              <Button className={styles.btn} onClick={checkAnswer}>
                {currentQuestion.answers[0]}
              </Button>
              <Button className={styles.btn} onClick={checkAnswer}>
                {currentQuestion.answers[1]}
              </Button>
              <Button className={styles.btn} onClick={checkAnswer}>
                {currentQuestion.answers[2]}
              </Button>
              <Button className={styles.btn} onClick={checkAnswer}>
                {currentQuestion.answers[3]}
              </Button>
            </motion.div>

            <motion.div className={styles.remainingQuestions} animate={{ opacity: [0, 1] }} transition={{ delay: 1 }}>
              <h3 className={styles.questionCount}>
                Question: {questionCount + 1}/{questions.length}
              </h3>
              <p>{showAnswer && currentQuestion.correct}</p>
            </motion.div>
          </motion.div>
        )}
        {complete && (
          <Results
            numQuestions={questions.length}
            category={category}
            score={score.current}
            hasWon={win}
            user={userInfo}
          />
        )}

        <audio id="correct-answer" src="/audio/correct_answer.wav" />
        <audio id="incorrect-answer" src="/audio/incorrect_answer.wav" />
        <audio id="win" src="/audio/win.wav" />
        <audio id="lose" src="/audio/lose.wav" />
      </motion.div>
    )
  );
}

// Context gives us access to queries in the URL I.E. /questions?category=Addition
export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    // Getting questions from our API by category passed in URL queries
    const res = await fetch(`${API_URL}/questions/${ctx.query.category}`);
    const data = await res.json();
    // Storing questions

    function getQuestions(arr) {
      if (!arr)
        throw new Error(`API did not return any questions for category: ${ctx.query.category}`);

      return shuffleArray(data.payload).slice(0, questionCount);
    }
    const questionCount = 5;
    function shuffleArray(arr) {
      return arr.sort(() => Math.random() - 0.5);
    }
    const questions = getQuestions(data.payload);

    //Set to max 3 questions for testing

        //If there's an error, and its not because of too many requests being made, then logout the user..
        const authenticated = await getAuth0User(ctx);
        if(authenticated.error && authenticated.error !== "Too Many Requests"){
          console.log("Found error, so redirecting to logout");
          return {
            redirect: {
              permanent: false,
              destination: "/api/auth/logout"
            }
          }
        }

    // Sending props into the question page component
    return {
      props: {
        auth0User: authenticated,
        category: ctx.query.category,
        questions,
      },
    };
  },
});
