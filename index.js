import express from 'express'
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import bodyParser from "body-parser";

const app = express();
dotenv.config();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

app.use(bodyParser.json());

async function createconnection() {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("Mongo DB connected");
    return client;
}
const client = await createconnection();

app.get("/", (req, res) => {
    res.send("Welcome to HALL-BOOKING-API");
});

let rooms = [];
let bookingRegister = [];


// Creating-Room :
app.post("/create-room", async (req, res) => {
    let room = {};
    const seats = req.body.noofseats;
    const amenities = req.body.amenities;
    const price = req.body.pricefor1hour;
    const roomId = req.body.roomId;

    const roomid = await client
        .db("plaza")
        .collection("rooms")
        .findOne({ roomId: roomId });

    // check the roomid already assigned
    if (roomid) {
        res.status(400).send({ Msg: "Room Already Booked" });
        return;
    } else {
        room.roomId = roomId;
    }
    // check the No.Of.Seats in the room
    if (seats) room.noofseats = seats;
    else {
        res.status(400).send({ Msg: "Please specify No of seats in the Room" });
        return;
    }

    // check the amenities data present in body then assign to amenities
    if (amenities) room.amenities = amenities;
    else {
        res.status(400).send({
            Msg: "Please specify all Amenities for Room in Array format",
        });
        return;
    }

    // check the price data present in body then assign to price
    if (price) room.price = price;
    else {
        res.status(400).send({ Msg: "Please specify price per hour for Room" });
        return;
    }

    //push the room data into rooms
    rooms.push(room);

    await client.db("plaza").collection("rooms").insertOne(room);
    room
        ? res.status(200).send({ Msg: " Room created Successfully" })
        : res.status(500).send({ Msg: " Please provide details " });
});


// Create-Room-Booking 
app.post("/room-booking", async (req, res) => {
    let booking = {};
    const roomId = req.body.roomId;
    const customerName = req.body.customerName;
    const date = req.body.date;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;

    // check the roomId data present in database
    const roomid = await client
        .db("plaza")
        .collection("bookings")
        .findOne({ roomId: roomId });
    if (roomid) {
        res.status(400).send({ Msg: "Room no already booked" });
        return;
    } else {
        booking.roomId = roomId;
    }

    // check the customerName data present in body then assign to customerName
    if (customerName) booking.customerName = customerName;
    else {
        res.status(400).send({ Msg: "Please Specify Customer Name" });
        return;
    }

    // check the Date data present in body then assign to Date
    if (date) booking.Date = date;
    else {
        res.status(400).send({ Msg: "Please Specify date for Booking" });
        return;
    }

    // check the startTime data present in body then assign to startTime
    if (startTime) booking.startTime = startTime;
    else {
        res.status(400).send({ Msg: "Please Specify Start Time for Booking" });
        return;
    }

    // check the endTime data present in body then assign to endTime
    if (endTime) booking.endTime = endTime;
    else {
        res.status(400).send({ Msg: " Please Specify End Time for Booking " });
        return;
    }

    //push booking data into bookingRec
    bookingRegister.push(booking);
    await client.db("plaza").collection("bookings").insertOne(booking);
    bookingRegister
        ? res.status(200).send({ Msg: " Room booked Successfully" })
        : res.status(500).send({ Msg: " Please provide details " });
});

//Get Booking Customer Details
app.get("/booked-customer", async (req, res) => {
    const bookingRec = await client
        .db("plaza")
        .collection("bookings")
        .find()
        .toArray();
    bookingRec
        ? res.status(200).send(bookingRec)
        : res.status(500).send({ Msg: "Internal Server Error" });
});

//Get Booking Room Details
app.get("/booked-rooms", async (req, res) => {
    const rooms = await client
        .db("plaza")
        .collection("rooms")
        .aggregate([
            {
                $lookup: {
                    from: "bookings",
                    localField: "roomId",
                    foreignField: "roomId",
                    as: "booking",
                },
            },
        ])
        .toArray();
    rooms
        ? res.status(200).send(rooms)
        : res.status(500).send({ Msg: "Internal Server Error" });
});

app.listen(PORT, () => console.log("App is started in:", PORT));
