const {app, ipcMain, BrowserWindow, globalShortcut} = require('electron');
const fs = require('fs');
const path = require('path');
const {format, parseISO} = require('date-fns');
const {utcToZonedTime} = require('date-fns-tz');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: '/assets/icons/stopwatchicon.png'
    });

    win.loadFile('index.html');
    win.setFullScreen(true);
}

app.whenReady().then(() => {
    createWindow();
    createDataDirectory();

    const ret = globalShortcut.register('ESC', () => {
        win.webContents.send('requestSaveData');
    });

    if (!ret) {
        console.log('ESC key registration failed');
    }
});

app.on('will-quit', () => {
    globalShortcut.unregister('ESC');
    globalShortcut.unregisterAll();
});

ipcMain.on('closeApp', () => {
    win.close();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


ipcMain.on('saveDataCSV', (event, data) => {
    const header = 'participant_id,time_point,experiment_start_time,experiment_start_time_conv,block,trial,trial_timestamp,trial_timestamp_conv,isi,rt,stimulus_onset,response_timestamp\n';
    let csvContent = header;

    data.forEach((row, index) => {
        let start_time_conv = convertTimestamp(row.experiment_start_time);
        let trial_timestamp_conv = convertTimestamp(row.timestamp);
        let rowTimePoint = row.time_point.slice(1);

        csvContent += row.participant_id + ',' + rowTimePoint + ',' + row.experiment_start_time + ',' + start_time_conv + ',' + row.block + ',' + (index + 1) + ',' + row.timestamp + ',' + trial_timestamp_conv + ',' + row.isi + ',' + row.rt + ',' + row.stimulus_onset + ',' + row.response_timestamp + '\n';
    });

    const dataFolderPath = path.join(app.getPath('documents'), 'Turbo Tap Time', 'data');
    if (!fs.existsSync(dataFolderPath)) {
        fs.mkdirSync(dataFolderPath, {recursive: true});
    }

    const filename = data[0].participant_id + '_' + data[0].time_point + '.csv';
    const filePath = path.join(dataFolderPath, filename);

    fs.writeFile(filePath, csvContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing CSV file:', err);
        } else {
            console.log('Data saved as', filePath);
        }
    });
});

function createDataDirectory() {
    const dataDirectoryPath = path.join(app.getPath('documents'), 'Turbo Tap Time', 'data');
    if (!fs.existsSync(dataDirectoryPath)) {
        fs.mkdirSync(dataDirectoryPath, {recursive: true});
    }
}

function convertTimestamp(isoTimestamp, timeZone = 'America/New_York') {
    const date = utcToZonedTime(parseISO(isoTimestamp), timeZone);
    return format(date, 'yyyy MMM dd HH:mm:ss', {timeZone});
}



