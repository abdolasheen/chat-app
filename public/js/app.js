const socket = io();

//Elements
const $form = document.querySelector("form");
const $formInput = document.querySelector("form input");
const $formMsgBtn = document.querySelector("#sendMessage");
const $formLocationBtn = document.querySelector("#location");
const $messages = document.querySelector("#messages");
//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}); //this data will be enitted to the server
const autoscroll = () => {
  // //new message
  // const $newMessage = $messages.lastElementChild;
  // //Height of the new message
  // const newMessageStyles = getComputedStyle($newMessage);
  // const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  // //new mesage height
  // const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  // // Visible height
  // const visibleHeight = $messages.offsetHeight;
  // //height of message container
  // const containerHeight = $messages.scrollHeight;
  // //how far i scrolled
  // const scrollOffset = $messages.scrollTop + visibleHeight;
  // if (containerHeight - newMessageHeight <= scrollOffset) {
  //   $messages.scrollTop = $messages.scrollHeight;
  // }
  $messages.scrollTop = $messages.scrollHeight;
};
$form.addEventListener("submit", (e) => {
  e.preventDefault();
  const $message = e.target.elements.message.value;

  $formInput.setAttribute("disabled", "disabled");
  $formMsgBtn.setAttribute("disabled", "disabled");

  socket.emit("sendMessage", $message, (error) => {
    if (error) {
      //error msg comes from the server
      $formInput.removeAttribute("disabled");
      $formMsgBtn.removeAttribute("disabled");
      return console.log(error);
    }
    console.log("the message was delivered !"); //callback acknowledgement from the server this fcn i gonna be called from the server
    $formInput.removeAttribute("disabled");
    $formMsgBtn.removeAttribute("disabled");
    $formInput.value = " ";
    $formInput.focus();
  });
});
socket.on("message", (m) => {
  const html = Mustache.render(messageTemplate, {
    username: m.username,
    message: m.text,
    time: moment(m.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (m) => {
  const html = Mustache.render(locationTemplate, {
    username: m.username,
    url: m.url,
    time: moment(m.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});
$formLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  $formLocationBtn.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
      },
      () => {
        console.log("Location shared!");
        $formLocationBtn.removeAttribute("disabled");
      }
    );
    // console.log(position.coords.latitude);
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert("this user name is taken choose another one");
    location.href = "/";
  }
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});
