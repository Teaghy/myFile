function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
  }

  var audio_context;
  var recorder;
  var is_recording=false;



  function btn_start_stop(btn){
   
    if(!is_recording){//is doing,stop
        $(btn).val("停止录音");
        startRecording();       
    }else{//is not doing ,start
        $(btn).val("开始录音");
        stopRecording();
    }
    is_recording=!is_recording;
    console.log("is_recording:"+is_recording);
  }
  function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    __log('Media stream created.');
    recorder = new Recorder(input);
    __log('Recorder initialised.');
  }

  function startRecording() {
    recorder && recorder.record();
    __log('Recording...');
  }

  function stopRecording() {
    recorder && recorder.stop();
    __log('Stopped recording.');
    createDownloadLink();
    recorder.clear();
  }

  function createDownloadLink() {
    recorder && recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      var li = document.createElement('p');
      var au = document.createElement('audio');
      var hf = document.createElement('a');
      
      au.controls = true;
      au.src = url;
      hf.href = url;
      hf.download = new Date().toISOString() + '.wav';
      hf.innerHTML = hf.download;
      li.appendChild(au);
      li.appendChild(hf);
      recordingslist.appendChild(li);

      soundBlob=blob;
    });
  }
  var constraints = { audio:true,video:false };
  //constraints={ audio: {echoCancellation: true,autoGainControl: true,sampleRate:16000, channelCount: 2, volume: 1.0 }, video:false };
  window.onload = function init() {
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      window.URL = window.URL || window.webkitURL;
      
      audio_context = new AudioContext;
    //   audio_context.sampleRate=16000;
    //   audio_context.destination.channelCount=1;
      __log('Audio context set up.');
      __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      alert('No web audio support in this browser!');
    }
    
    navigator.getUserMedia(constraints, startUserMedia, function(e) {
      __log('No live audio input: ' + e);
    });
  };