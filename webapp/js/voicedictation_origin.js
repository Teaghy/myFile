import 'scss/services/voicedictation.scss'
import 'babel-polyfill'
import {
  serviceQA,
  serviceTopbar
} from 'js/libs/utils-services'
import {
  init as initServiceOpen,
  showserviceOpenModal
} from 'js/libs/utils-services-open'
import { config } from 'config'
import 'js/libs/gt'
import { layer } from 'js/libs/utils-layer'
import * as userApi from 'js/api/user'
import { showLoginModal } from 'js/libs/utils-login'
import * as servicesApi from 'js/api/services'
initServiceOpen()

$(function () {
  var context, recorder
  $('.apply-use-dialect').click(function () {
    var $this = $(this)
    var href = $this.data('href')
    userApi.checkLogin().then(result => {
      if (result.code === 80000) {
        showLoginModal()
      } else {
        window.open(href)
      }
    })
  })
  $('#tryFirst').click(function () {
    userApi.checkLogin().then(result => {
      if (result.code === 80000) {
        showLoginModal()
      } else {
        // location.href = `${config.CONSOLE}app/create?source=WebAPI`
        window.open(`${config.CONSOLE}app/create?source=WebAPI`)
      }
    })
  })
  $('.to-service-open').click(function () {
    showserviceOpenModal({
      urlParams: {'currPage': '1'}
    }, {
      detailUrl: `${config.CONSOLE}/app/myapp`,
      appIdKey: 'keyword',
      needBase64: false
    })
  })
  serviceQA()
  serviceTopbar()
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
        $('.taste-content').css('display', 'none')
        $('.start-taste').addClass('flex-display-1')
        $('.dialect-select').css('display', 'none')
        $('.start-button').text('结束识别')
        $('.time-box').addClass('flex-display-1')
        $('.dialect').text(dialect).css('display', 'inline-block')
        oneMinute($('.used-time'))
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
    })
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    reader.onload = function (e) {
      var base64 = btoa(new Uint8Array(reader.result)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      var p = {
        engineType: $('#dialect_select').val(),
        audio: base64
      }
      var challenge = encodeURI(result.geetest_challenge)
      var validate = encodeURI(result.geetest_validate)
      var seccode = encodeURI(result.geetest_seccode)
      servicesApi.getVoiceAudioSrc(p, challenge, validate, seccode).then(result => {
        layer.close('.modal-wrapper-alert')
        if (result.code === 0) {
          $('#result_output').text(result.data)
        } else if (result.code === 99999) {
          $.alerts.alert('系统异常，请稍后重试')
        } else if (result.code === 20011) {
          $.alerts.alert('验证码校验失败，请重试')
        }
      })
    }
    // open(URL.createObjectURL(blob))
  }
  function returnStart () {
    time = 0
    clearTimeout(timeout)
    $('.time-box').removeClass('flex-display-1').css('display', 'none')
    $('.start-button').text('开始识别')
    $('.dialect').css('display', 'none')
    $('.dialect-select').css('display', 'inline-block')
  }
  function finish () {
    recorder.disconnect()
    encodeWAV()
  }
  var time = 0
  var timeout
  function oneMinute (o) {
    if (time === 60) {
      o.text('01: 00')
      recorder.disconnect()
      finish()
      $('hr').removeClass('hr')
      time++
    } else if (time === 61) {
      returnStart()
      return false
    } else if (time >= 0 && time < 10) {
      o.text('00: 0' + time)
      time++
    } else {
      o.text('00: ' + time)
      time++
    }
    // encodeWAV()
    timeout = setTimeout(function () {
      oneMinute(o)
    }, 1000)
  }
  var handler = function (captchaObj) {
    captchaObj.onReady(function () {
      // layer.close('.modal-wrapper-alert')
      $('#wait').hide()
    }).onSuccess(function () {
      result = captchaObj.getValidate()
      if (!result) {
        return $.alerts.alert('请完成验证')
      }
      $('hr').addClass('hr')
      startRecord()
    }).onError(function () {
      $.alerts.alert('验证码校验失败，请重试')
    })
    $('#taste_button').click(function () {
      if (window.AudioContext || window.webkitAudioContext) {
        context = new (window.AudioContext || window.webkitAudioContext)()
        recorder = context.createScriptProcessor(4096, 1, 1)
      }
      if (window.ActiveXObject || 'ActiveXObject' in window) {
        $.alerts.alert('您现在使用的浏览器暂时不支持体验功能，推荐使用谷歌浏览器Chrome')
      } else {
        captchaObj.verify()
      }
    })
    $('.start-button').click(function () {
      if ($(this).text() === '开始识别') {
        $('#result_output').text('')
        captchaObj.verify()
      } else {
        returnStart()
        finish()
      }
    })
  }

  $.ajax({
    url: '/herapi/plug/validate?t=' + (new Date()).getTime(),
    type: 'get',
    dataType: 'json',
    success: function (data) {
      // 调用 initGeetest 进行初始化
      if (data.flag === true) {
        initGeetest({
          gt: data.data.gt,
          challenge: data.data.challenge,
          offline: !data.data.success, // 表示用户后台检测极验服务器是否宕机
          new_captcha: data.data.new_captcha, // 用于宕机时表示是新验证码的宕机

          product: 'bind', // 产品形式，包括：float，popup
          width: '300px'
        }, handler)
      } else {
        $.alerts.alert('系统异常，请稍后重试')
      }
    }
  })
})



// WEBPACK FOOTER //
// ./src/js/entry/services/voicedictation.js