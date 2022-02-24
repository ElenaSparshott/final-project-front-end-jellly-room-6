// Import Header here
import { useState, useEffect, useLayoutEffect } from "react";
import styles from "../styles/home.module.css";
import NavBar from "../src/components/NavBar";
import { useUser, getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import Image from "next/image";
import CategoryContainer from "../src/components/Home/CategoryContainer";
import HomeStatsDisplay from "../src/components/Home/HomeStatsDisplay";
//Plan
//-onClick go to questions (loading page, etc.)
//-stats: we need to fetch user info.
//states for the user: {xp, beans}
//state for categories:[""]

/*Categories logic plan
 - once user id has been fetched, need to know which categories have been unlocked and which states to fetch for the loop to work (comparing the array on the page to what's in the database)
 - continue by doing a fetch request for categories that user has unlocked (categories/userid)
 - store categories unlocked in a state (as an array)
 - check which category completed by comparing list of categories
 - add state of categories checked as a prop down to container relating to section
 - when looping through category buttons, pass down a prop called 'completed' which will be true or false, depending on if found in that state 
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const sections = [
  {
    id: 1,
    categories: ["Addition", "Subtraction", "Multiplication"],
  },
  {
    id: 2,
    categories: ["Category 4", "Category 5", "Category 6"],
  },
  {
    id: 3,
    categories: ["Category 7", "Category 8", "Category 9"],
  },
];

export default function Home({ authenticatedUser }) {
  const { user, error, isLoading } = useUser();
  const [userInfo, setUserInfo] = useState("");

  // UseEffect to get user info will run any time the authenticatedUser variable changes in value
  useEffect(() => {
    async function createNewUser(username) {
      // POST /users
      // Adds a new user to our database, using the username fetched from Auth0 (see get serverside props below for the Auth0 fetch)
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!data.payload || data.payload.length === 0) return;
      await fetchUser();
    }

    async function getCategories(id) {
      // Get the categories associated with the user with id
      const res = await fetch(`${API_URL}/categories/${id}`);
      const data = await res.json();
      // Returns an array of category objects I.E. [{category_id: 1, category_name: 'Addition', user_id: 1}, {...anotherOne} etc]
      return data.payload;
    }

    async function fetchUser() {
      // If no authenticated user/authenticated user is Null, do not run the rest of funtion
      if (!authenticatedUser) return;
      // Get user info from our database (including XP/Beans etc)
      const res = await fetch(`${API_URL}/users/${authenticatedUser}`);
      const data = await res.json();
      // If no user found, create new user in our database
      if (!data.payload || data.payload.length === 0) {
        createNewUser(authenticatedUser);
        return;
      }
      // Storing user object
      const user = data.payload[0];
      // Get categories for the user by id
      let categories = await getCategories(user.user_id);
      // Mapping over the array of category objects, and replacing each object with just the string of the category name
      categories = categories.map(category => category.category_name);

      console.log("Found user:", { ...data.payload[0], categories });
      // Set userInfo state to user object with categories included
      setUserInfo({ ...user, categories });
    }

    fetchUser();
  }, [authenticatedUser]);

  // If userInfo is undefined or isLoading is true, display "Loading..."
  if (isLoading || !userInfo) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;
  // If user is not logged in when navigating to home page, redirect back to landing page
  if (!user) {
    window.location.href = "/";
  }
  return (
    user && (
      <div>
        <NavBar />
        <div className={styles.grid}>
          {sections.map((section, index) => {
            return (
              <CategoryContainer
                key={index}
                id={section.id}
                categories={section.categories}
                userId={userInfo.user_id}
                completedCategories={userInfo.categories}
              />
            );
          })}

          <HomeStatsDisplay userInfo={userInfo} />

          <div className={`${styles.gridItem} ${styles.gridItemLogo} `}>
            <div className={`${styles.gridItemLogoContainer}`}>
              <Image src="/logojelly.png" width="350" height="400"></Image>
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    // Gives you the basic user info from Auth0
    const session = getSession(ctx.req, ctx.res);

    const getUsername = async () => {
      const domain = "jelllyapp.eu.auth0.com";

      // Try/Catch -> Try some functions and if it fails then Catch errors and log them
      try {
        // URL to fetch from (Auth0 API which gives detailed user info inc. username)
        const userDetailsByIdUrl = `https://${domain}/api/v2/users/${session.user.sub}`;

        // Fetching the user information stored in the Auth0 database for the user with id user.sub
        const metadataResponse = await fetch(userDetailsByIdUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        const data = await metadataResponse.json();
        return data.username;
      } catch (e) {
        console.log(e.message);
      }
    };
    // Storing username
    const username = await getUsername();

    // Send username prop into the component as 'authenticatedUser'
    return { props: { authenticatedUser: username || "No user" } };
  },
});
