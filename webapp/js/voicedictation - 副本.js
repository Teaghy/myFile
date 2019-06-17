
  var context, recorder

  var buffer
  var size = 0
  // var recorder = context.createScriptProcessor(4096, 1, 1)
  var result
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
  function startRecord () {
    var dialect = $('.dialect-select').find('option:selected').text()
    if (navigator.getUserMedia) {
      navigator.getUserMedia({
        audio: true,
        video: false
      }, function (e) {
        // 从麦克风的输入流创建源节点
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
        $.alerts.alert('请求麦克风失败')
      })
    } else {
      $.alerts.alert('您现在使用的浏览器暂时不支持体验功能，推荐使用谷歌浏览器Chrome')
    }
  }
  function compress () {
    var data = new Float32Array(size)
    var offset = 0
    for (var i = 0; i < buffer.length; i++) {
      data.set(buffer[i], offset)
      offset += buffer[i].length
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
  function encodeWAV () {
    // recorder.disconnect()
    var sampleRate = 16000
    var sampleBits = 16
    var bytes = compress()
    var dataLength = bytes.length * (sampleBits / 8)
    var buffer = new ArrayBuffer(44 + dataLength)
    var data = new DataView(buffer)
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

    window.soundBlob=blob;

    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    reader.onload = function (e) {
      var base64 = btoa(new Uint8Array(reader.result)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      var p = {
        engineType: "sms16k",
        audio: base64
      }

      window.p=p;
    }
    // open(URL.createObjectURL(blob))
  }

  function finish () {
    recorder.disconnect()
    encodeWAV()
  }

  function voiceInit(){
    try{
      if (window.AudioContext || window.webkitAudioContext) {
        context = new (window.AudioContext || window.webkitAudioContext)()
        recorder = context.createScriptProcessor(4096, 1, 1)
      }
      if (window.ActiveXObject || 'ActiveXObject' in window) {
        $.alerts.alert('您现在使用的浏览器暂时不支持体验功能，推荐使用谷歌浏览器Chrome')
      } 
    }catch (e) {
        $.alerts.alert('浏览器没有音频支持,推荐使用谷歌浏览器Chrome');
      } 
  }


  // $('#taste_button').click(function () {
  //   startRecord();

  // })
  // $('.start-button').click(function () {
  //   if ($(this).text() === '开始识别') {
  //     $('#result_output').text('')
  //   } else {
  //     returnStart()
  //     finish()
  //   }
  // })
// WEBPACK FOOTER //
// ./src/js/entry/services/voicedictation.js