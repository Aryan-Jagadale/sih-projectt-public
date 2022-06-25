const RoomModel = require("../models/room-model");

class RoomService{
    async create(payload){
        const {topic,roomType, ownerId} = payload;
        const room = await RoomModel.create({
            topic,
            roomType,
            ownerId,
            speakers:[ownerId]
        })
        return room;
    }

    async getAllRooms(roomType){
        const rooms = await RoomModel.find({roomType: {$in:roomType }   }).populate('speakers').populate('ownerId').exec();
        return rooms;
    }
    async getRoom(roomId){
        const room = await RoomModel.find({_id: roomId });
        return room;
    }


}
module.exports = new RoomService();