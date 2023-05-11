const {ipcRenderer} = require('electron');

function saveDataCSV(data) {
    ipcRenderer.send('saveDataCSV', data);
}

let start_time;
let timePoint;

var jsPsych = initJsPsych({
    on_finish: function () {
        const reactionTimeData = jsPsych.data.get().filter({task: 'response'}).values();
        const fixationData = jsPsych.data.get().filter({task: 'fixation'}).values();

        const missedTrials = reactionTimeData.filter(trial => trial.rt === null).length;
        const meanReactionTime = Math.round(reactionTimeData.filter(trial => trial.rt !== null).reduce((sum, trial) => sum + trial.rt, 0) / (reactionTimeData.length - missedTrials));

        console.log('Number of missed trials:', missedTrials);
        console.log('Mean reaction time:', meanReactionTime);

        const combinedData = fixationData.map((fixation, index) => {
            return {
                ...fixation,
                ...reactionTimeData[index]
            };
        });

        saveDataCSV(combinedData);
    }
});

var timeline = [];

var preload = {
    type: jsPsychPreload,
    auto_preload: true
};
timeline.push(preload);

var participant_info = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
    <p style="font-size:48px;">Please enter the Participant's ID and the Time Point</p>
    <form id="participant-form">
      <label for="participant-id">Participant ID:</label>
      <input type="text" id="participant-id" name="participant-id" required><br><br>
      <label for="time-point">Time Point:</label>
      <input type="text" id="time-point" name="time-point" required><br><br>
      <input type="submit" value="Submit">
    </form>
  `,
    on_load: function () {
        document.getElementById("participant-form").addEventListener("submit", (event) => {
            event.preventDefault();
            let participantId = document.getElementById("participant-id").value;
            let timePoint = document.getElementById("time-point").value;

            // Remove non-numeric characters from participantId
            participantId = participantId.replace(/[^0-9]/g, '');

            // Remove non-numeric characters from timePoint
            timePoint = timePoint.replace(/[^0-9]/g, '');

            if (participantId === '' || timePoint === '') {
                alert('Please provide valid inputs for both Participant ID and Time Point.');
                return;
            }

            if (!/^[0-9]+$/.test(timePoint)) {
                alert('Please enter only numbers for the Time Point.');
                return;
            }
            timePoint = 'T' + timePoint; // append 'T' to time point


            const experimentStartTime = new Date().toISOString();
            jsPsych.data.addProperties({
                participant_id: participantId,
                time_point: timePoint,
                experiment_start_time: experimentStartTime
            });
            jsPsych.finishTrial();
        });
    },
    choices: 'NO_KEYS'
};

timeline.push(participant_info);

var welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<p style="font-size:48px;">Welcome to</p>
        <p style="font-size:60px;">Turbo Tap Time</p><br><br>
        <p><strong>Press spacebar to begin</strong></p>
        `,
    choices: " ",
    post_trial_gap: 1000
};

timeline.push(welcome);

var practice_instruction1 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>In this game, a square will appear in the center of the screen.</p>
      <p>Each time the square appears, your task is to press the <strong>spacebar</strong>
      as fast as you can.</p>
      <p>Let's play a practice round!</p><br><br>
      <p><strong>Press spacebar to begin</strong></p>
      `,
    choices: " ",
    post_trial_gap: 2000,
    on_finish: function () {
        start_time = new Date().getTime(); // Set the start_time when the instruction trial finishes
    }
};

var practice_instruction2 = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>Great job!</p><br>
        <p>Now you are ready to play the real game. Remember...</p>
        <p>Each time the square appears, your task is to press the
        <strong>spacebar</strong> as fast as you can.</p><br>
        <p>Are you ready?</p><br><br>
        <p><strong>Press spacebar to begin</strong></p>
        `,
    choices: " ",
    post_trial_gap: 2000
};

var practice_trial = {
    type: jsPsychImageKeyboardResponse,
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: [' '],
    // trial_duration: 5000,
    data: {
        block: 0,
        task: 'response',
        stimulus_onset: null,
        response_timestamp: null,
        //trial_duration: null // Add trial_duration field to data object
    },
    on_start: function (trial) {
        trial.data.stimulus_onset = new Date().getTime() - start_time; // Calculate elapsed time for stimulus_onset

    },
    on_finish: function (data) {
        data.response_timestamp = new Date().getTime() - start_time; // Calculate elapsed time for response
        //data.trial_duration = data.response_timestamp - data.stimulus_onset; // Calculate trial_duration
    }
};

var instruction = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <p>In this game, a square will appear in the center of the screen.</p>
      <p>Each time the square appears, your task is to press the <strong>spacebar</strong>
      as fast as you can.</p>
      <p>Are you ready to play the game?</p><br><br>
      <p><strong>Press spacebar to begin</strong></p>
      `,
    choices: " ",
    post_trial_gap: 2000,
    on_finish: function () {
        start_time = new Date().getTime(); // Set the start_time when the instruction trial finishes
    }
};

/* UNCOMMENT to add fixation block between instructions and experiment procedure
    var fixation_cross = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<div style="font-size: 60px;">+</div>',
        choices: 'NO_KEYS',
        trial_duration: 2000,
        on_finish: function () {
            start_time = new Date().getTime(); // Set the start_time when the instruction trial finishes
        }
    };

    timeline.push(fixation_cross);
    */

var target = {
    stimulus: 'img/square.png'
};


var fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "",
    choices: 'NO_KEYS',
    trial_duration: function () {
        fixation.isi = jsPsych.randomization.sampleWithoutReplacement([2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000], 1)[0];
        return fixation.isi;
    },
    data: {
        task: 'fixation',
        isi: function () {
            return fixation.isi;
        },
        timestamp: null
    },
    on_start: function (trial) {
        trial.data.timestamp = new Date().toISOString(); // Capture the timestamp when the fixation block starts
    },
};

var trial = {
    type: jsPsychImageKeyboardResponse,
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: [' '],
    data: {
        block: 1,
        task: 'response',
        stimulus_onset: null,
        response_timestamp: null,
        //trial_duration: null // Add trial_duration field to data object
    },
    on_start: function (trial) {
        trial.data.stimulus_onset = new Date().getTime() - start_time; // Calculate elapsed time for stimulus_onset
    },
    on_finish: function (data) {
        data.response_timestamp = new Date().getTime() - start_time; // Calculate elapsed time for response
        //data.trial_duration = data.response_timestamp - data.stimulus_onset; // Calculate trial_duration
    }
};

var practice_procedure = {
    timeline: [fixation, practice_trial],
    timeline_variables: [target],
    repetitions: 1
};

var experiment_procedure = {
    timeline: [fixation, trial],
    timeline_variables: [target],
    repetitions: 3
};

var practice_procedure_wrapper = {
    timeline: [practice_instruction1, practice_procedure, practice_instruction2, experiment_procedure],
    conditional_function: function () {
        // get the data from the last trial,
        const data = jsPsych.data.getLastTrialData().values()[0];
        // check if time_point is T1 or 1
        return data.time_point === 'T1' || data.time_point === '1';
    }
};

var experiment_procedure_wrapper = {
    timeline: [instruction, experiment_procedure],
    conditional_function: function () {
        // get the data from the last trial,
        const data = jsPsych.data.getLastTrialData().values()[0];
        // check if time_point is not T1 or 1
        return data.time_point !== 'T1' && data.time_point !== '1';
    }
};

timeline.push(practice_procedure_wrapper);
timeline.push(experiment_procedure_wrapper);

var debrief_block = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function () {
        // var trials = jsPsych.data.get().filter({task: 'response'});
        // var rt = Math.round(trials.select('rt').mean());

        // return `<p>Your average response time was ${rt}ms.</p>
        return `<p style="font-size:48px;">Thank you for playing Turbo Tap Time!</p><br><br>
            <p>Press any key to close the game</p>`;
    },
    trial_duration: 5000,
    on_finish: function () {
        ipcRenderer.send('closeApp');
    }
};
timeline.push(debrief_block);

jsPsych.run(timeline);

// Listen for 'requestSaveData' event
ipcRenderer.on('requestSaveData', () => {
    const reactionTimeData = jsPsych.data.get().filter({task: 'response'}).values();
    const fixationData = jsPsych.data.get().filter({task: 'fixation'}).values();
    const combinedData = fixationData.map((fixation, index) => {
        return {
            ...fixation,
            ...reactionTimeData[index]
        };
    });

    ipcRenderer.send('saveDataCSV', combinedData);

    // After saving data, request the main process to close the application
    ipcRenderer.send('closeApp');
});