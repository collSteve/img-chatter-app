const socket = io();

let nickName = Date.now();

// sumbit chat 
const messages = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const userJoinP = document.getElementById('user-join');
const userNameSpan = document.getElementById('userName');

const user_name_input = document.getElementById('user-name-input');
const password_input = document.getElementById('password-input');
const permit_code_input = document.getElementById('permit-code-input');
const sign_up_btn = document.getElementById('sign-up-btn');

sign_up_btn.addEventListener('click', function(e){
    e.preventDefault();
    if (user_name_input.value && password_input.value && permit_code_input.value) {
        const sign_up_info = {
            user_type: 'user',
            user_name: user_name_input.value,
            password: password_input.value,
            permit_code: permit_code_input.value
        }
        socket.emit('sign up', sign_up_info);
    }
    else {
        console.log('invalid input');
    }
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        const msgData = {
            user: nickName,
            msg: input.value,
            time: Date.now()
        };
        socket.emit('chat message', msgData); // emit socket event
        input.value = '';
    }
});

socket.on('display-full-chat', (msgDataArray)=>displayFullChat(msgDataArray));

socket.on('chat message', function(msgDataArray) {
    displayFullChat(msgDataArray);

    // var item = document.createElement('li');
    // item.textContent =  `${msgData.user}: ${msgData.msg}`;
    // messages.appendChild(item);
    // window.scrollTo(0, document.body.scrollHeight);
});

socket.on('new user', (msg)=>{
    nickName = promptNickName();
    let userData = {
        name: nickName
    };
    socket.emit('new user', userData); // emit socket event
    userNameSpan.innerText = nickName;
});

socket.on('named user joined', (userData)=>{
    userJoinP.textContent = `${userData.name} joined in the room`;
});

function promptNickName() {
    let rawName = prompt("Welcome to Chat, please enter a nickname:");
    if (rawName == null || rawName == "") {
        promptNickName();
    } else {
        return rawName;
    }
}

function displayFullChat(msgDataArray) {
    messages.innerHTML = '';
    msgDataArray.forEach(msgData => {
        const item = document.createElement('li');
        item.textContent =  `${msgData.user}: ${msgData.msg}`;
        messages.appendChild(item);
    });
}

socket.on('allow access',()=>{
    userJoinP.textContent='Allow Access';
    console.log('Allow Access');
});

socket.on('on connection', ()=>{
    console.log('on connection emitted');
});