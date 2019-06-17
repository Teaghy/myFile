var timer
var storage = window.localStorage
var msg_key=-1;

$(document).ready(function(){
	storage.clear();
    timer = setInterval(function () {
       var msg_key_stored=storage.getItem("msg_key");
       msg_key_stored=parseInt(msg_key_stored);
        if (msg_key_stored>msg_key){
            var msg =storage.getItem("msg")
            var p_sent = document.createElement('p');
            p_sent.innerText = msg;
            document.getElementById("recordingslist").appendChild(p_sent);
            msg_key=msg_key_stored;
        }
    }, 1500)
    $(".resize-font").click(function () {
        $(this).addClass('active').siblings().removeClass('active')
        var describe = $(this).text()
        switch (describe) {
            case "大":
                $('.lMessage p').css('font-size','18px');
                break;
            case "中":
                $('.lMessage p').css('font-size','15px');
                break;
            case "小":
                $('.lMessage p').css('font-size','12px');
                break;
            default:
                break;
        }
    })
})