import React,{useState,useEffect} from "react";
import AddRoomModal from "../../components/AddRoomModal/AddRoomModal";
import RoomCard from "../../components/RoomCard/RoomCard";
import { getAllRooms } from "../../http";
import styles from "./Rooms.module.css";


  


const Rooms = () => {
  const [showModal,setShowModal] = useState(false)
  const [rooms,setRooms] = useState([])

  useEffect(() => {
    const fetchRooms =  async () => {
      const {data} = await getAllRooms();
      setRooms(data)
    }
    fetchRooms()
  
    
  }, [])
  


  function openModal() {
    setShowModal(true)

  }


  return (
    <>
      <div className="container">
        <div className={styles.roomsHeader}>
          <div className={styles.left}>
            <span className={styles.heading}>All voice rooms</span>
            <div className={styles.searchBox}>
              <img src="/images/search-icon.png" alt="search-icon" />
              <input
                type="text"
                placeholder="Search"
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.right}>
            <button onClick={openModal} className={styles.startRoomButton}>
              <img src="/images/add-room-icon.png" alt="add-room" />
              <span>Start a room</span>
            </button>
          </div>
          
        </div>

        <div className={styles.roomList}>
          {
            rooms.map((room)=>{
              return <RoomCard key={room.id} room={room}/>
            })

          }
        
        </div>  

      </div>
      {showModal && <AddRoomModal onClose={() => setShowModal(false)} />}
      
    </>
  );
};

export default Rooms;
