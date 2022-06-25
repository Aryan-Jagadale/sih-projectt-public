import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { useWebRTC } from "../../hooks/useWebRTC";
import styles from "./Room.module.css";
import { getRoom } from "../../http";

const Room = () => {
  const { id: roomId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const { clients, provideRef,handleMute } = useWebRTC(roomId, user);
  const history = useHistory();
  const [room, setRoom] = useState(null);
  const [isMute,setMute] = useState(true)

  useEffect(() => {
    handleMute(isMute,user.id);
  }, [isMute])
  



  const handleMenuleave = () => {
    history.push("/rooms");
  };
  const handleMuteClick = (clientId)=>{
    if(clientId !== user.id){
      return;
    }
    setMute((isMute)=>!isMute)
  }

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await getRoom(roomId);
      //console.log(data[0].topic)
      setRoom(data[0].topic);
      /*console.log(typeof data)
      console.log(data)
      console.log(data[0].topic)*/
    };
    fetchRoom();
  }, [roomId]);

  return (
    <div>
      <div className={styles.container}>
        <button onClick={handleMenuleave} className={styles.goBack}>
          <img src="/images/arrow-left.png" alt="go back button" />
          <span>All voice rooms</span>
        </button>
      </div>

      <div className={styles.clientsWrap}>
        <div className={styles.header}>
          <h2 className={styles.topic}>{room}</h2>
          <div className={styles.actions}>
            <button className={styles.actionBtn}>
              <img src="/images/palm.png" alt="raise-hand" />
            </button>
            <button onClick={handleMenuleave} className={styles.actionBtn}>
              <img src="/images/win.png" alt="leave" />
              <span>Leave quietly</span>
            </button>
          </div>
        </div>

        <div className={styles.clientList}>
          {clients.map((client) => {
            return (
              <div key={client.id} className={styles.client}>
                <div className={styles.userHead}>
                  <audio
                    ref={(instance) => {
                      provideRef(instance, client.id);
                    }}
                    autoPlay
                  ></audio>
                  <img
                    className={styles.userAvatar}
                    src={client.avatar}
                    alt="avatar"
                  />
                  <button onClick={()=>{
                    handleMuteClick(client.id)
                  }} className={styles.micBtn}>
                    {client.muted ? (
                      <img
                        className={styles.micBtn}
                        src="/images/mic-mute.png"
                        alt="mic"
                      />
                      
                    ) : (
                      <img
                        className={styles.micImg}
                        src="/images/mic.png"
                        alt="mic"
                      />
                      
                    )}
                  </button>
                </div>
                <h4>{client.name}</h4>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Room;
