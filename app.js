const express = require("express");
const socket = require("socket.io");
const {Chess} = require("chess.js")
const http = require("http"); 
const { log } = require("console");
const path = require("path")

const app = express();    //Express app instance
const server = http.createServer(app);   //http and express ke server ko link kar diya

const io = socket(server);   //io will run on the server created by linking of express and http

const chess = new Chess();  //all the funtion of chess.js in noe copied to chess object

let players = {};
let currentPlayers = "w";

app.set("view engine", "ejs"); //Using EJS templating engine
app.use(express.static(path.join(__dirname, "public")));  //Serve static files from 'public' directory

app.get("/", (req, res)=>{
    res.render("index", {title: "Welcome to the Chess Game"});
});

io.on("connection", function(uniquesocket){
    console.log("connected");  //when someone us conected run the given function


    /*
    uniquesocket.on("disconnect", function(){
        console.log("disconnected");
    })
    */

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else{
        uniquesocket.emit("spectatorRole"); 
    }

    uniquesocket.on("disconnect", function(){
        if (uniquesocket.id === players.white){
            delete players.white;
        }
        else if (uniquesocket.id === players.black){
            delete players.black;
        }
    })

    uniquesocket.on("move", (move) => {
        try {
            if(chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if(chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);
            if(result){
                currentPlayers = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen())
            }
            else{
                console.log("Invalid move: ", move);
                uniquesocket.emit("Invalid move: ", move) 
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("Invalid move: ", move);
        }
    })
})

server.listen(3000, function(){
    console.log("3000 pe sun rha hu");
})