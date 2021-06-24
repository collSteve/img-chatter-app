const socket = io();

            let nickName = Date.now();

            // sumbit chat 
            const messages = document.getElementById('messages');
            const form = document.getElementById('form');
            const input = document.getElementById('input');
            const userJoinP = document.getElementById('user-join');
            const userNameSpan = document.getElementById('userName');

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