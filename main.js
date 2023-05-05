const {app, ipcMain, BrowserWindow} = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
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

app.whenReady().then(createWindow);
/*
ipcMain.on('closeApp', () => {
    win.close();
});
*/
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
    const header = 'participant_id,time_point,experiment_start_time,trial,isi,response_time,stimulus_onset,response_timestamp\n';
    let csvContent = header;

    data.forEach((row, index) => {
        csvContent += row.participant_id + ',' + row.time_point + ',' + row.experiment_start_time + ',' + (index + 1) + ',' + row.isi + ',' + row.rt + ',' + row.stimulus_onset + ',' + row.response_timestamp + '\n';
    });

    const dataFolder = 'data';
    const dataFolderPath = path.join(__dirname, dataFolder);
    if (!fs.existsSync(dataFolderPath)) {
        fs.mkdirSync(dataFolderPath);
    }

    const filename = dataFolder + '/' + data[0].participant_id + '_' + data[0].time_point + '.csv';
    const filePath = path.join(__dirname, filename);
    fs.writeFile(filePath, csvContent, 'utf8', (err) => {
        if (err) {
            console.error('Error writing CSV file:', err);
        } else {
            console.log('Data saved as', filePath);
        }
    });
});





