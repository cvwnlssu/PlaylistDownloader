const path = require('path');
const os = require('os');
require('dotenv/config');
const child = require('child_process');
const ytdl = require("@distube/ytdl-core");
var search = require('youtube-search');
const ffmpeg = require('ffmpeg-static');
const { Notification } = require('electron')
const { ipcRenderer } = require('electron');
const downloadsFolder = require('downloads-folder');

const tracker = {
  start: Date.now(),
  audio: { downloaded: 0, total: Infinity },
  video: { downloaded: 0, total: Infinity },
  merged: { frame: 0, speed: '0x', fps: 0 },
};

YTTOKEN = process.env.YTTOKEN;



const fs = require('fs');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
var chosen = [];
var checked = [];
const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';
var downloadLocation;
var resultList = [];

//Audio only
function downloadPlaylistAudio() {
  let location;
  if (isMac === false){
    location = path.join(os.homedir(), 'Downloads\\YoutubePlaylistDownloads\\');
  }else{
    location = path.join(downloadsFolder(), 'YoutubePlaylistDownloads')
  }
  console.log(location);
  if (!fs.existsSync(location)) {
    fs.mkdirSync(location, {recursive: true}, err => {});
  }

  for (let i = 0; i < chosen.length; i++) {
    if (checked[i].checked) {
      console.log(chosen[i][0].textContent);
      console.log(chosen[i][1]);

     if (isMac){
      ytdl(chosen[i][1], { quality: 'highestaudio' })
        .pipe(fs.createWriteStream(path.join(downloadsFolder(), 'YoutubePlaylistDownloads',chosen[i][0].textContent.replace(/[#%&{}\\<>*\/?$!\'\":@+`|=]/g, ' ') + '.mp4')));
     }else{
      ytdl(chosen[i][1], { quality: 'highestaudio' })
        .pipe(fs.createWriteStream(location + '\\' + chosen[i][0].textContent.replace(/[#%&{}\\<>*\/?$!\'\":@+`|=]/g, ' ') + '.mp4'));
     }

    }
  }
  shell.openPath(location);
}


//Lower quality ver
function downloadPlaylist() {
  let location;
  if (isMac === false){
    location = path.join(os.homedir(), 'Downloads\\YoutubePlaylistDownloads\\');
  }else{
    location = path.join(downloadsFolder(), 'YoutubePlaylistDownloads')
  }
  console.log(location);
  if (!fs.existsSync(location)) {
    fs.mkdirSync(location, {recursive: true}, err => {});
  }
  for (let i = 0; i < chosen.length; i++) {
    if (checked[i].checked) {
      console.log(chosen[i][0].textContent);
      console.log(chosen[i][1]);
      if (!isMac){
      ytdl(chosen[i][1], { filter: 'videoandaudio' })
        .pipe(fs.createWriteStream(location + '\\' + chosen[i][0].textContent.replace(/[#%&{}\\<>*\/?$!\'\":@+`|=]/g, ' ') + '.mp4'));

      }else{
        ytdl(chosen[i][1], { filter: 'videoandaudio' })
          .pipe(fs.createWriteStream(path.join(downloadsFolder(), 'YoutubePlaylistDownloads',chosen[i][0].textContent.replace(/[#%&{}\\<>*\/?$!\'\":@+`|=]/g, ' ') + '.mp4')));
      }

    }

  }
  shell.openPath(location);
}
//Higher qual ver
function downloadPlaylistHighQuality() {
  let location;
  if (isMac === false){
    location = path.join(os.homedir(), 'Downloads\\YoutubePlaylistDownloads\\');
  }else{
    location = path.join(downloadsFolder(), 'YoutubePlaylistDownloads')
  }
  let fileLoc = location;
  let slash;
  if (isMac === false){
    location = path.join(os.homedir(), 'Downloads\\YoutubePlaylistDownloads\\' + chosen[0][0].textContent.replace(/[#%&{}\\<>*\/?$!\'\":@+`|=]/g, ''));
    slash = '\\';
  }else{
    location = path.join(downloadsFolder(), 'YoutubePlaylistDownloads');
    slash = '/';
  }
    
  console.log(location);
  if (!fs.existsSync(location)) {
    fs.mkdirSync(location, {recursive: true}, err => {});
  }
  for (let i = 0; i < chosen.length; i++) {
    if (checked[i].checked) {
      var audio = ytdl(chosen[i][1], { quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
          tracker.audio = { downloaded, total };
        });
      var video = ytdl(chosen[i][1], { quality: 'highestvideo' })
        .on('progress', (_, downloaded, total) => {
          tracker.video = { downloaded, total };
        });
      const ffmpegProcess = child.spawn(ffmpeg, [
        '-loglevel', '8', '-hide_banner',
        '-progress', 'pipe:3',
        '-i', 'pipe:4',
        '-i', 'pipe:5',
        '-map', '0:a',
        '-map', '1:v',
        '-c:v', 'copy',
        location + slash + chosen[i][0].textContent.replace(/[#%&{}\\<>*\/?$!\'\":@+`|=]/g, ' ') + '.mp4',
      ], {
        windowsHide: true,
        stdio: [
          'inherit', 'inherit', 'inherit',
          'pipe', 'pipe', 'pipe',
        ],
      });

      ffmpegProcess.stdio[3].on('data', chunk => {
        const lines = chunk.toString().trim().split('\n');
        const args = {};
        for (const l of lines) {
          const [key, value] = l.split('=');
          args[key.trim()] = value.trim();
        }
        tracker.merged = args;
      });
      audio.pipe(ffmpegProcess.stdio[4]);
      video.pipe(ffmpegProcess.stdio[5]);

    }
  }
  shell.openPath(fileLoc);
}




function getVideoData() {
  iterator = 0;
  for (item of resultList) {
    if (item.title != "Private video") {
      var a = document.createElement("a");
      var li = document.createElement("li");
      let img = document.createElement('img');
      var checkBox = document.createElement('input');
      checkBox.setAttribute("type", "checkbox");
      checkBox.checked = 'true';
      checkBox.id = 'check' + iterator.toString();
      li.appendChild(checkBox);
      try {
        img.src = item.thumbnails.default.url;
      }
      catch (err) { console.log(err); }
      a.textContent = item.title;
      a.setAttribute('href', 'https://www.youtube.com/watch?v=' + item.videoId);
      a.setAttribute('target', '_blank');
      li.appendChild(a);
      li.id = "li" + iterator.toString();
      iterator++;
      document.getElementById('list').appendChild(li);
      document.getElementById('list').appendChild(img);
      chosen.push([li, 'https://www.youtube.com/watch?v=' + item.videoId]);
      checked.push(checkBox);
    }
  }
  console.log(checked);
}

function playlistSearch(opts) {
  var searchMessage = document.getElementById('playlistInfo').value;
  let message = searchMessage.split('=');
  searchMessage = message[1];
  return new Promise((resolve) => {
    search(searchMessage, opts, 'playlistItems', function (err, results) {
      if (err) return console.log(err);
      resolve(results);
    })
  })
}

async function findFullPlaylist(opts) {

  while (opts.pageToken != undefined) {
    let results = await playlistSearch(opts);
    opts.pageToken = results[0].nextPageToken;
    resultList = resultList.concat(results);
  }
  getVideoData()
}

const ERROR_TITLE = "Error: Missing YT API token"
const ERROR_MSG = "Please supply a valid Youtube API token in the source code"
function findPlaylist() {
  if (YTTOKEN === null) {
    const errormsg = document.createElement('yt-api-error');
    errormsg.textContent = "Please supply a valid YT API key";
    errormsg.style.color = "#ff0000";
    document.body.appendChild(errormsg);
    return;
  }
  document.getElementById('list').innerHTML = "";//Clear previous playlist info
  nextPageToken = '';
  chosen = [];
  checked = [];
  var searchMessage = document.getElementById('playlistInfo').value;
  if (!searchMessage.includes("youtube.com/playlist?list=")) {
    alert("Not a valid playlist!");
    return;
  }
  let message = searchMessage.split('=');
  searchMessage = message[1];
  console.log(searchMessage);
  let opts = {
    part: 'snippet',
    playlistId: searchMessage,
    maxResults: 50,
    pageToken: '',
    key: YTTOKEN
  }
  resultList = [];
  search(searchMessage, opts, 'playlistItems', function (err, results) {
    if (err) {
      const errormsg = document.createElement('playlist-error');
      errormsg.textContent = "Error occured when getting playlist";
      errormsg.style.color = "#ff0000";
      document.body.appendChild(errormsg);
      return;
    }
    console.log(results);
    resultList = resultList.concat(results);
    console.log(resultList);
    let iterator = 0;
    opts.pageToken = resultList[0].nextPageToken;
    if (opts.pageToken != undefined) {
      findFullPlaylist(opts);
    } else {
      getVideoData();
    }

  });

}

function download() {
  let selection = document.getElementById('quality').value;
  if (resultList.length == 0) {
    alert("Please submit a playlist!");
    return;
  }
  switch (selection) {
    case 'high':
      downloadPlaylistHighQuality();
      break;
    case 'normal':
      downloadPlaylist();
      break;
    case 'audio':
      downloadPlaylistAudio();
      break;
    default:
      break;
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'goofydownload')
  });
  /*
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
    */
  mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  console.log("Starting");
  createMainWindow();
  //const mainMenu = Menu.buildFromTemplate(createMenu);
  //Menu.setApplicationMenu(mainMenu);

  mainWindow.on('closed', () => (mainWindow = null));
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
});

const createMenu = () => {
  let menuTemplate = [
    {
      label: app.getName(),
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
};

app.on('window-all-closed', () => {
  //if (!isMac) {
    app.quit()
  //}
})