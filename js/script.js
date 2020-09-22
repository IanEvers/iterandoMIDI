const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const btnOrientacion = document.getElementById('horizontalidad');

// parametros
let compasesPantalla = parseInt(document.getElementById('compasesPantalla').value);
let pulsosPorCompas = parseInt(document.getElementById('pulsosPorCompas').value);
let subdivisiones = parseInt(document.getElementById('subdivisiones').value);
let BPM = parseInt(document.getElementById('BPM').value);
let notaMasBaja = parseInt(document.getElementById('notaMasBaja').value);
let notaMasAlta = parseInt(document.getElementById('notaMasAlta').value);
let rangoNotas = parseInt(notaMasAlta - notaMasBaja);
let divisionCanvas = parseInt((canvas.height / parseInt(compasesPantalla)));

// user settings
let horizontalidad = false;
let colores = [];

const actualizarParametros = function() {
    compasesPantalla = document.getElementById('compasesPantalla').value;
    pulsosPorCompas = document.getElementById('pulsosPorCompas').value;
    subdivisiones = document.getElementById('subdivisiones').value;
    BPM = document.getElementById('BPM').value;
    notaMasBaja = document.getElementById('notaMasBaja').value;
    notaMasAlta = document.getElementById('notaMasAlta').value;
    rangoNotas = notaMasAlta - notaMasBaja;
    divisionCanvas = (canvas.height / parseInt(compasesPantalla));
}

const actualizarColores = function () {
	const inputs = colorSelector.getElementsByClassName("colorInput");
	for(let i = 0; i < inputs.length; i++) {
		colores[i] = inputs[i].value;
    }
}

const actualizarGrilla = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.rotate(90 * Math.PI / 180);
    
	for (let i = divisionCanvas; i <= canvas.height; i += divisionCanvas) {
        
        if (horizontalidad) {
			ctx.fillRect( i, 0, 3, canvas.height);
		} else {
			ctx.fillRect( 0, i, canvas.width, 3);
        }
        
        for ( let lineaSub = 0; lineaSub < pulsosPorCompas; lineaSub++) {
			if (horizontalidad) {
				ctx.fillRect(i - ((divisionCanvas)/pulsosPorCompas) * lineaSub, 0, 1, canvas.height);
			} else {
				ctx.fillRect(0, i - ((divisionCanvas)/pulsosPorCompas) * lineaSub, canvas.width, 1);
			}
        }
        
        /* si quisiera mostrar donde van las notas
		for(const indiceNota = 1; indiceNota < rangoNotas; indiceNota++) {
			if(horizontalidad) {
				ctx.fillRect(0, (indiceNota / rangoNotas)* canvas.height, 1, canvas.height);
			} else {
				console.log((indiceNota / rangoNotas)* canvas.height);
				ctx.fillRect((indiceNota / rangoNotas)* canvas.height, 0, 1, canvas.width);
			}
		}
        */
    }
}

//desde acá manejo el canvas antes de empezar a tocar
const cambiarOrientacion = function() {
	horizontalidad = !horizontalidad; 
	if (horizontalidad) {
		btnOrientacion.innerHTML = "Horizontal";
	} else {
		btnOrientacion.innerHTML = "Vertical";
	}
	actualizarTempo();
}

const actualizarTempo = function() {
    actualizarGrilla();
    metronomeApp.setTempo(BPM * subdivisiones);
}

//desde aca empieza para hacer sonar sonidos

const comienzo = function() {
    console.log(pulsosPorCompas, subdivisiones)
	metronomeApp.toggle(pulsosPorCompas, subdivisiones);
	let midi;
	let AudioContext;
	let context;
	let data, cmd, channel, type, note, velocity;
	let notas = [];
	let audios = [];
	const canvas = document.getElementById("canvas");
	let tiempoInicial = new Date();
	

	//DEBUG PARA PROBAR TECLADO DE LA PC	
	const logKey = function(e) {
		if(e.key == "k"){
			player(37, 64);
			setTimeout(function(){ player(58, 0); }, 3000);
		} else if(e.key == "j"){
			player(36, 64);
			setTimeout(function(){ player(58, 0); }, 3000);
		} else if(e.key == "h"){
            player(55, 64);
            setTimeout(function(){ player(58, 0); }, 3000);
        }
	}
	document.addEventListener('keypress', logKey);
	// FIN DEL DEBUG PARA PROBAR TECLADO DE LA PC
	let indiceColor = 0;
	let color = colores[indiceColor];
	
	const tiempo = new Date() - tiempoInicial;
	setInterval(timer, tiempo);

	const pulsosPantallaTotal = compasesPantalla * pulsosPorCompas;

	function timer() {
		const tiempo = new Date() - tiempoInicial;

		velocidad = (tiempo/1000) / (( pulsosPantallaTotal / BPM) * 60) * canvas.height;
		ctx.fillStyle = color;
	
		if(horizontalidad) {
			ctx.fillRect(velocidad, 0, 1, 10);
		} else {
			ctx.fillRect(0, velocidad, 10, 1);
		}
		const tiempo2 = new Date() - tiempoInicial;
	
		if(velocidad > canvas.height) {
			tiempoInicial = new Date();
		}
	}
	
	try {
		AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
	}
	catch(e) {
		alert('Web Audio API is not supported in this browser');
	}
	if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({
        sysex: false 
    }).then(onMIDISuccess, onMIDIFailure);
	} else {
		alert("No MIDI support in your browser.");
	}

	const keyData = document.getElementById('key_data');

	function onMIDISuccess(midiAccess) {
		console.log('MIDI Access Object', midiAccess);
		midi = midiAccess;
		const inputs = midi.inputs.values();
		for(const input = inputs.next(); input && !input.done; input = inputs.next()) {
			input.value.onmidimessage = onMIDIMessage;
		}
	}

	function onMIDIMessage(event) {
		data = event.data,
		cmd = data[0] >> 4,
		channel = data[0] & 0xf,
		type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
		note = data[1],
		velocity = data[2];
		function onMIDIMessage(message) {
			data = message.data; // this gives us our [command/channel, note, velocity] data.
			console.log('MIDI data', data); // MIDI data [144, 63, 73]
		}
		switch (type) {
			case 144: // noteOn message 
				noteOn(note, velocity);
				break;
			case 128: // noteOff message 
				noteOff(note, velocity);
				break;
		}
    //console.log('data', data, 'cmd', cmd, 'channel', channel);
        logger(keyData, 'key data', data);
	}


	function player(note, velocity) {
		if (type == (0x80 & 0xf0) || velocity == 0) {
			for (let i = notas.length - 1; i >= 0; i--) {
				if (Math.round(notas[i].frequency.value) == Math.round(frequencyFromNoteNumber(note))) {
					notas[i].frequency.value = 0;
					for (let i = audios.length - 1; i >= 0; i--) {
						if (Math.round(frequencyFromNoteNumber(audios[i])) == Math.round(frequencyFromNoteNumber(note))) {
							audios.splice(i, 1);
						}
					}
				}
			}
			return;
		} else {
			if(note == notaMasBaja-1) {
				indiceColor--;
				color = colores[indiceColor];
				return;
			}
			if(note == notaMasBaja) {
				indiceColor++;
				color = colores[indiceColor];
				return;
			}

			if(notas.length < 11) {
				context = new AudioContext();
				const oscillator = context.createOscillator();
				oscillator.type = "sine";
				oscillator.frequency.value = frequencyFromNoteNumber(note);
				oscillator.connect(context.destination);
				notas.push(oscillator); 
				audios.push(note); 
				oscillator.start(0);
				pintar(oscillator, note);
			} else {
				let i;
				for(i = notas.length - 1; i >= 0; i--) {
				
					if(Math.round(notas[i].frequency.value) == 0) {
						
						notas[i].frequency.value = frequencyFromNoteNumber(note);
						audios.push(note); 
						break;
					}
				}
				pintar(notas[i], note);
			}
		}
	}

	function pintar(oscillator, notaActual) {
		const ctxNota = canvas.getContext("2d");
		tiempoInicial2 = new Date();
		const tiempo3 = new Date() - tiempoInicial2;
		setInterval(nota, tiempo3);
		function nota() {
			const tiempo3 = new Date() - tiempoInicial;
		
			if(inArray(notaActual, audios) && oscillator.frequency.value != 0) {
				ctx.fillStyle = color;
				if(horizontalidad) {
					ctx.fillRect(velocidad, ((notaActual - notaMasBaja) / rangoNotas)* canvas.height, 5, 10);
				} else {
					ctx.fillRect(((notaActual - notaMasBaja) / rangoNotas)* canvas.height,velocidad, 10, 5);
				}
			}
		}
	}

//utilidad
	function inArray(needle, haystack) {
		const length = haystack.length;
		for(const i = 0; i < length; i++) {
			if(haystack[i] == needle) return true;
		}
		return false;
	}

	function noteOn(midiNote, velocity) {
		player(midiNote, velocity);
	}

	function noteOff(midiNote, velocity) {
		player(midiNote, velocity);
	}

	function onMIDIFailure(e) {
		// when we get a failed response, run this code
		console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
	}

	function frequencyFromNoteNumber(note) {
    	return 440 * Math.pow(2, (note - 69) / 12);
	}

	function logger(container, label, data) {
        messages = label + " [channel: " + (data[0] & 0xf) + ", cmd: " + (data[0] >> 4) + ", type: " + (data[0] & 0xf0) + " , note: " + data[1] + " , velocity: " + data[2] + "]";
        container.textContent = messages;
	}

}

const colorSelector = document.getElementById("colorSelector");
colorSelector.addEventListener("change", actualizarColores);

const formParametros = document.getElementById("parametrosTempo");
formParametros.addEventListener("change", function () {
    actualizarParametros();
    actualizarTempo();
    comienzo();
});

window.onload = function () {
    actualizarTempo();
    actualizarColores();
}