function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}
var socket = io("https://j-zone.xyz");
let record_msg = null;
let isSign = false
document.addEventListener("DOMContentLoaded", () => {
    var status = document.getElementById("status");
    var online = document.getElementById("online");

    socket.on("connect", function () {
        status.innerText = "Connected.";
        let userCookie = getCookie('user_id');
        if (userCookie !== 'Admin') {
            socket.emit('join', userCookie);
            document.getElementById('name').value = userCookie;

            socket.on('getRecord', (msgRecord) => {
                if (!isSign) {
                    console.log(msgRecord);
                    record_msg = msgRecord;
                    showOldMsg(record_msg);
                    isSign = true;
                }

            })

        } else {
            socket.emit('join', userCookie);
            document.getElementById('name').value = 'Admin';

            socket.on('getRecord', (msgRecord) => {
                if (!isSign) {
                    console.log(msgRecord);
                    record_msg = msgRecord;
                    showOldMsg(record_msg);
                    isSign = true;
                }

            })
        }

    });

    socket.on("disconnect", function () {
        socket.emit('leave');
        status.innerText = "Disconnected.";
    });

    socket.on("online", function (amount) {
        online.innerText = amount;
    });


    //處理訊息
    var sendForm = document.getElementById("send-form"); // 加入這行
    var content = document.getElementById("content");

    sendForm.addEventListener("submit", function (e) {
        e.preventDefault();

        var ok = true;
        var formData = {};
        var formChild = sendForm.children;

        for (var i = 0; i < sendForm.childElementCount; i++) {
            var child = formChild[i];
            if (child.name !== "") {
                var val = child.value;
                if (val === "" || !val) { // 如果值為空或不存在
                    ok = false;
                    child.classList.add("error");
                } else {
                    child.classList.remove("error");
                    formData[child.name] = val;
                }
            }
        }

        // ok 為真才能送出
        if (ok) {
            let new_msg = {};
            if (document.getElementById('name').value === 'Admin') {
                new_msg.msg_from = "Admin";
                new_msg.msg_to = "";

            } else {
                new_msg.msg_from = document.getElementById('name').value;
                new_msg.msg_to = "Admin";
            }

            new_msg.msg = formData.msg;
            new_msg.time = Date.now();
            console.log(new_msg);

            let urlArray = document.URL.split("/");
            console.log(urlArray);
            if (urlArray[urlArray.length - 1] === "chat") {
                socket.emit("broadcast", new_msg);
                console.log("是公告");

            } else {
                socket.emit("send", new_msg);

            }
        }
    });

    socket.on("msg", function (d) {
        var msgBox = document.createElement("div")
        if (d.msg_from === document.getElementById('name').value) {
            msgBox.className = "msg rightMsg";
            var nameBox = document.createElement("span");
            nameBox.className = "name";
            var name = document.createTextNode(d.msg_from);
            var msg = document.createTextNode(d.msg);

            msgBox.appendChild(msg);
            nameBox.appendChild(name);
            msgBox.appendChild(nameBox);
            content.appendChild(msgBox);
        } else {
            msgBox.className = "msg leftMsg";
            var nameBox = document.createElement("span");
            nameBox.className = "name";
            var name = document.createTextNode(d.msg_from);
            var msg = document.createTextNode(d.msg);

            nameBox.appendChild(name);
            msgBox.appendChild(nameBox);
            msgBox.appendChild(msg);
            content.appendChild(msgBox);

        }
    });

    function showOldMsg(record_msg) {
        for (let i = 0; i < record_msg.length; i++) {
            var msgBox = document.createElement("div")
            if (record_msg[i].msg_from === document.getElementById('name').value) {
                msgBox.className = "msg rightMsg";
                var nameBox = document.createElement("span");
                nameBox.className = "name";
                var name = document.createTextNode(record_msg[i].msg_from);
                var msg = document.createTextNode(record_msg[i].msg);

                msgBox.appendChild(msg);
                nameBox.appendChild(name);
                msgBox.appendChild(nameBox);
                content.appendChild(msgBox);

            } else {
                msgBox.className = "msg leftMsg";
                var nameBox = document.createElement("span");
                nameBox.className = "name";
                var name = document.createTextNode(record_msg[i].msg_from);
                var msg = document.createTextNode(record_msg[i].msg);

                nameBox.appendChild(name);
                msgBox.appendChild(nameBox);
                msgBox.appendChild(msg);
                content.appendChild(msgBox);
            }
        }

    }
});