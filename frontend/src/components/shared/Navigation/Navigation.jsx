import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { logout } from "../../../http";
import { setAuth } from "../../../store/authSlice";
import styles from "./Navigation.module.css";

const Navigation = () => {
  const dispatch = useDispatch();
  const brandStyle = {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
  };

  const logoText = {
    marginLeft: "10px",
    marginBottom:"10px"

  };

  const { isAuth, user } = useSelector((state) => state.auth);

  async function logoutUser() {
    try {
      const { data } = await logout();
      dispatch(setAuth(data));
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <nav className={`${styles.navbar} container`}>
      <Link style={brandStyle} to="/">
        {/*<img src="/images/logo.png" alt="logo" />*/}
        <span style={logoText}>Edu-Voice</span>
      </Link>
      {isAuth && <div className={styles.navRight}>
        <h3>{user?.name}</h3>
        <Link to="/" className={styles.avatar} >
          <img src={user.avatar ? user.avatar : '/images/monkey-avatar.png'} width="40" alt="photoes" height="40" />
        </Link>
        
        <button className={styles.logoutButton} onClick={logoutUser}><img src="/images/logout.png" alt="logout"/></button>
      </div>
    }

      
    </nav>
  );
};

export default Navigation;
