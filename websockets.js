/* * * * * * * * * * * * * * * *
 * WebSocket manager
 *
 * Manage the websockets :
 * - receive & forward setTitle events
 * - receive & forward setIncrust
 * - receive & forward clearIncrust
 *
 * TODO : inherits EventEmitter
 *
 * * * * * * * * * * * * * * * */

const CONNECTION = "connection",
SET_TITLE = "setTitle",
SET_INCRUST = "setIncrust",
SET_PERSONNE = "setPersonne",
CLEAR_INCRUST = "clearIncrust",
CLEAR_SCREEN = "ecranvide"
DEFAULT_TITLE = "GeekInc Remote Regie ready !";


function WebSockets(io) {
  this.setSocketIO(io);
}

WebSockets.prototype.setSocketIO = function(io) {

  io.on(CONNECTION, socket => {

    var config = {
      text: DEFAULT_TITLE,
      timeout: 2
    };

    socket.emit(CLEAR_SCREEN);
    //socket.emit(SET_TITLE, config);

    socket.on(SET_TITLE, data => {
      console.log(data);
      config = data; //TODO merge config & data
      io.sockets.emit(SET_TITLE, data);
    });

    socket.on(SET_INCRUST, data => {
      console.log(data);
      //TODO check the file exists in the directory
      io.sockets.emit(SET_INCRUST, data);
    });
	
	socket.on(SET_PERSONNE, data => {
      console.log(data);
      //TODO check the file exists in the directory
      io.sockets.emit(SET_PERSONNE, data);
    });

    socket.on(CLEAR_INCRUST, data => {
      console.log(data);
      io.sockets.emit(CLEAR_INCRUST, data);
    });

  });
}

module.exports = WebSockets;
