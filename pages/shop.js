import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0";
import getAuth0User from "../src/controllers/Authorisation.js";
import useUserInfo from "../src/hooks/useUserInfo";
import items from "../src/ShopItems";
import NavBar from "../src/components/NavBar";
import ShopCategory from "../src/components/Shop/ShopCategory";
import Loading from "../src/components/Loading";
import InformationCard from "../src/components/Shop/InformationCard";
import Image from "next/image";
import { motion } from "framer-motion";
import useShop from "../src/hooks/useShop.js"

import style from "../styles/shop.module.css";



export default function Shop({ auth0User }) {

  const { user, error, isLoading } = useUser();
  const userInfo = useUserInfo(auth0User.username);
  const {currentBeans, updateBeans, equippedItem, setEquippedItem} = useShop(userInfo);

  if (isLoading || !userInfo) return <Loading redirect="/shop" />;
  if (error) return <div>{error.message}</div>;


  return (
    userInfo && (
      <>
        <NavBar />
        <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.h1 className={style.title} animate={{ y: [20, 0], opacity: [0, 1] }}>
            The Jellly Shop
          </motion.h1>
          <motion.div className={style.container} animate={{ opacity: [0, 1] }}>
            <div>
              {items.map((category, index) => (
                  <ShopCategory
                    key={index}
                    equippedItem={equippedItem}
                    setEquippedItem={setEquippedItem}
                    user={userInfo}
                    categoryTitle={category[0].category}
                    items={category}
                    updateBeans={updateBeans}
                    purchases={userInfo.purchases}
                  />
              ))}
            </div>
            <motion.div
              className={style.panel}
              animate={{ x: [20, 0], opacity: [0, 1] }}
              transition={{ delay: 1 }}
            >
              <InformationCard username={userInfo.username} beans={currentBeans} />
              <motion.div
                className={style.avatar}
                animate={{ scale: [0, 1], opacity: [0, 1] }}
                transition={{ delay: 1.25 }}
              >
                <Image src={equippedItem.src || "/logoJelly.png"} alt="" width={200} height={200} />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.main>
      </>
    )
  );
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {

    return {
      props: {
        auth0User: await getAuth0User(ctx),
        //Add any other props here if needed for more fetching
      },
    };
  },
});
