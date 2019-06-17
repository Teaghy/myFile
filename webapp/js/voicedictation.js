
  var context;
  var recorder;
  var buffer;

  var size = 0;
  var is_recording=false;
  var timeout;
  var count_=0;

  var offset_g=0;

  var sec_Interval=28000;

  function btn_start_stop(btn){
    if(!is_recording){//is doing,stop
        $("#btn_start").text("停止");
        is_recording=true;
        startRecord();
        timeout = setInterval(function () {
          finish()
        }, sec_Interval);          

    }else{//is not doing ,start  
      recordStop();
      is_recording=false;
      $("#btn_start").text("开始");
    }
    console.log("btn_start_stop is_recording status :"+is_recording);
  }

  function finish () {
    count_=count_+1;
    console.log(offset_g+" ******invoke finish"+count_+" buffer.length:"+buffer.length+" time:"+time2str());
    if(buffer !=undefined&&buffer.length>0){
      // recorder.disconnect()
      var buffer_temp;
      if(offset_g>0){
        buffer_temp=buffer.slice(offset_g);
      }else{
        buffer_temp=buffer.slice(0);
      }
      offset_g=buffer.length;

      sendVoice(encodeWAV(buffer_temp));
    }

  }
  //stop
  function recordStop () {
    clearInterval(timeout)
    //stop  record and send voice file
    recorder.disconnect()
    console.log(offset_g+" ******invoke recordStop"+count_+" buffer.length:"+buffer.length+" time:"+time2str());
    if(buffer !=undefined&&buffer.length>0){
      // recorder.disconnect()
      var buffer_temp;
      if(offset_g){
        buffer_temp=buffer.slice(offset_g);
      }else{
        buffer_temp=buffer.slice(0);
      }
      sendVoice(encodeWAV(buffer_temp));
    }
  }


  function sendVoice(voice_blob){
    var my_count=count_;
    console.log("sendVoice my_count:"+my_count+" time:"+time2str());
    if(voice_blob)
      console.log("sendVoice size"+voice_blob.size);
    else{
      console.log("sendVoice size 0 return ");
      return; 
    }
      
    var fd = new FormData();
    fd.append('fname', 't.wav');
    fd.append('file', voice_blob);
        $.ajax({
            url: regcog_url+"?"+my_count,
            type: "post",
            data: fd,
            timeout : 100000,
            processData: false,
            contentType: false,
            dataType: 'json', 
            success: function (res) {
              console.log(res.status+"sendVoice receive my_count:"+my_count+" time:"+time2str());
              console.log(res)
                if(res&&res.status){
                  handleResponse(res.text);
                }else{
                    console.error("语音识别失败!");
                }
                // $("#btn_start").text("开始识别");
            },
            error: function (jqXHR, textStatus, errorThrown) {
            if(textStatus=='timeout'){
              console.error("语音识别超时!");
            }
            if(errorThrown){
              console.error("ajax_error:"+errorThrown);
            }
            // $("#btn_start").text("开始识别");
            }
        });
    }
    function handleResponse(respTxt){
        var curTxt=$("#recog_text").val();
        $("#recog_text").val(curTxt+respTxt);
                    // firstAndText=getNextSentence(res.text);
        if(!$("#first_sent").val())
        {
           if(respTxt){
            firstAndText=getNextSentence(curTxt+respTxt);
            $("#first_sent").val(firstAndText.first);
            $("#recog_text").val(firstAndText.text);
           }
        }
    }
    function getNextSentence(text){
        if(text){
            // var sens=text.split(/[。.,，?!\n]/)
            var sens=text.match(/[^\。.!！\?？]+[\。.!！\?？]+["']?|\s*$/g)
            var first_sens=sens[0]
            text=sens.slice(1).join("");
            return {"first":first_sens,"text":text};
        }else{
            return {"first":"","text":""};
        }
    }
    var msg_key=0;//conference js read only
    function sent_confirm(){
      var confirm_sent=$("#first_sent").val();
      if(confirm_sent){
        var p_sent = document.createElement('p');
        p_sent.innerText=confirm_sent;
        document.getElementById("recordingslist").appendChild(p_sent);
      }
      firstAndText=getNextSentence($("#recog_text").val());
      $("#first_sent").val(firstAndText.first);
      $("#recog_text").val(firstAndText.text);
      
      window.localStorage.setItem("msg",confirm_sent);
      window.localStorage.setItem("msg_key",msg_key++);        

    }
    function sent_restore(){
      firstAndText=getNextSentence($("#recog_text").val());
      $("#first_sent").val(firstAndText.first);
    }
    function wordgen(){
      var datas=new Array();
      $("#recordingslist p").each(function(){
        datas.push($(this).text());
      });
      $("#data").val(datas.join("#split#"));
      document.getElementById("wordform").submit();
    }
    function sent_clear(){
      $("#recordingslist").empty();
    }


    function startRecord () {
      if (navigator.getUserMedia) {
        navigator.getUserMedia({
          audio: true,
          video: false
        }, function (e) {
          // 从麦克风的输入流创建源节点
          console.log(e)
          // oneMinute($('.used-time'))
          var stream = context.createMediaStreamSource(e)
          // 用于录音的processor节点
          buffer = []
          stream.connect(recorder)
          size = 0
          recorder.onaudioprocess = function (e) {
            buffer.push(new Float32Array(e.inputBuffer.getChannelData(0)))
            size += e.inputBuffer.getChannelData(0).length
          }
          recorder.connect(context.destination)
        }, function (e) {
          console.log('请求麦克风失败')
          alert('请求麦克风失败')
        })
      } else {
        alert('您现在使用的浏览器暂时不支持体验功能，推荐使用谷歌浏览器Chrome')
      }
    }
    function compress (buffer_temp) {
      // var data = new Float32Array(size)
      // var offset = 0
      // for (var i = 0; i < buffer_temp.length; i++) {
      //   data.set(buffer[i], offset)
      //   offset += buffer[i].length
      // }

      var sizeOfArray = 0
      for (var i = 0; i < buffer_temp.length; i++) {
        sizeOfArray += buffer_temp[i].length
      }
      var data = new Float32Array(sizeOfArray);

      var offset=0;
      for (var i = 0; i < buffer_temp.length; i++) {
        data.set(buffer_temp[i], offset)
        offset += buffer_temp[i].length
      }


      var fitCount = Math.round(data.length * (16000 / 44100))
      var newData = new Float32Array(fitCount)
      var springFactor = (data.length - 1) / (fitCount - 1)
      newData[0] = data[0]
      for (i = 1; i < fitCount - 1; i++) {
        var tmp = i * springFactor
        var before = Math.floor(tmp).toFixed()
        var after = Math.ceil(tmp).toFixed()
        var atPoint = tmp - before
        newData[i] = data[before] + (data[after] - data[before]) * atPoint
      }
      newData[fitCount - 1] = data[data.length - 1]
      return newData
    }
    function encodeWAV (buffer_temp) {
      // recorder.disconnect()
      var sampleRate = 16000
      var sampleBits = 16
      var bytes = compress(buffer_temp)
      var dataLength = bytes.length * (sampleBits / 8)
      var buffer_local = new ArrayBuffer(44 + dataLength)
      var data = new DataView(buffer_local)
      var channelCount = 1 // 单声道
      var offset = 0
      var writeString = function (str) {
        for (var i = 0; i < str.length; i++) {
          data.setUint8(offset + i, str.charCodeAt(i))
        }
      }
      writeString('RIFF')
      offset += 4
      data.setUint32(offset, 36 + dataLength, true)
      offset += 4
      writeString('WAVE')
      offset += 4
      // 波形格式标志
      writeString('fmt ')
      offset += 4
      // 过滤字节,一般为 0x10 = 16
      data.setUint32(offset, 16, true)
      offset += 4
      // 格式类别 (PCM形式采样数据)
      data.setUint16(offset, 1, true)
      offset += 2
      // 通道数
      data.setUint16(offset, channelCount, true)
      offset += 2
      // 采样率,每秒样本数,表示每个通道的播放速度
      data.setUint32(offset, sampleRate, true)
      offset += 4
      // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
      data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true)
      offset += 4
      // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
      data.setUint16(offset, channelCount * (sampleBits / 8), true)
      offset += 2
      // 每样本数据位数
      data.setUint16(offset, sampleBits, true)
      offset += 2
      // 数据标识符
      writeString('data')
      offset += 4
      // 采样数据总数,即数据总大小-44
      data.setUint32(offset, dataLength, true)
      offset += 4
      for (var i = 0; i < bytes.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, bytes[i]))
        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      }
      
      var blob = new Blob([data], {
        type: 'audio/wav'
      });
      
      return blob;
    }
  
    function voiceInit(){
      try{
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
        if (window.AudioContext || window.webkitAudioContext) {
          context = new (window.AudioContext || window.webkitAudioContext)()
          recorder = context.createScriptProcessor(4096, 1, 1)
        }
        if (window.ActiveXObject || 'ActiveXObject' in window) {
          alert('您现在使用的浏览器暂时不支持体验功能，推荐使用谷歌浏览器Chrome')
        } 
        console.log('Audio context set up.');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
      }catch (e) {
          alert('浏览器没有音频支持,推荐使用谷歌浏览器Chrome');
        } 
    }
  
    function time2str() {
      var new_d = new Date();
      var mm = new_d.getMonth() + 1; // getMonth() is zero-based
      var dd = new_d.getDate();
      var hh=new_d.getHours();
      var mn=new_d.getMinutes();
      var ss=new_d.getSeconds();
      return [(hh>9 ? '' : '0') + hh,(mn>9 ? '' : '0') + mn,(ss>9 ? '' : '0') + ss
            ].join(':');
    };
    