const canvas = document.getElementById("canvas");
const canvasFondo = document.getElementById("canvasFondo");
const ctx = canvas.getContext("2d", { alpha: false });
const ctxFondo = canvasFondo.getContext("2d", { alpha: false });

const btnOrientacion = document.getElementById('cambiarOrientacion');

const colorSelector = document.getElementById("colorSelector");
const colorInputs = colorSelector.getElementsByClassName("colorInput");

// parametros
let compasesPantalla = parseInt(document.getElementById('compasesPantalla').value);
let pulsosPorCompas = parseInt(document.getElementById('pulsosPorCompas').value);
let subdivisiones = parseInt(document.getElementById('subdivisiones').value);
let BPM = parseInt(document.getElementById('BPM').value);
let notaMasBaja = parseInt(document.getElementById('notaMasBaja').value);
let notaMasAlta = parseInt(document.getElementById('notaMasAlta').value);
let rangoNotas = parseInt(notaMasAlta - notaMasBaja - 5);
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
	for(let i = 0; i < colorInputs.length; i++) {
		colores[i] = colorInputs[i].value;
	}
}

const actualizarGrilla = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctxFondo.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.rotate(90 * Math.PI / 180);
    
	for (let i = divisionCanvas; i <= canvas.height; i += divisionCanvas) {
		ctx.fillStyle = "black";
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
	let color1 = document.getElementById("color1");
	let tiempoInicial = new Date();
	var canvasGuardado = new Array();
	var guardadoBool = false;

	//DEBUG PARA PROBAR TECLADO DE LA PC	
	const logKey = function(e) {
		if(e.key == "k"){
			player(37, 64);
			setTimeout(function(){ player(37, 0); }, 1000);
		} else if(e.key == "j"){
			player(36, 64);
			setTimeout(function(){ player(36, 0); }, 1000);
		} else if(e.key == "h"){
            player(55, 64);
            setTimeout(function(){ player(55, 0); }, 1000);
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
		ctxFondo.fillStyle = color;
	
		if(horizontalidad) {
			ctxFondo.fillRect(velocidad,0,  1, canvas.width);
			ctxFondo.clearRect(velocidad-10, 0, 10, canvas.width);
			
		} else {
			ctxFondo.fillRect(0, velocidad, canvas.height, 1);
			ctxFondo.clearRect(0, velocidad-10, canvas.height, 10);
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
	const guardado = document.getElementById('guardado');

	function onMIDISuccess(midiAccess) {
		console.log('MIDI Access Object', midiAccess);
		midi = midiAccess;
		const inputs = midi.inputs.values();
		for(let input = inputs.next(); input && !input.done; input = inputs.next()) {
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
				if(indiceColor > 0) {
					indiceColor--;
					color = colores[indiceColor];
				}
				return;
			}
			if(note == notaMasBaja) {
				if(indiceColor < colorInputs.length) {
					indiceColor++;
					color = colores[indiceColor];
					return;
				}
			}
			if(note == notaMasBaja+1) {
				colores[indiceColor] = shadeColor(colores[indiceColor], -10);
				color = colores[indiceColor];
				color1.value = color;
				return;
			}
			if(note == notaMasBaja+2) {
				colores[indiceColor] = shadeColor(colores[indiceColor], 10);
				color = colores[indiceColor];
				color1.value = color;
				return;
			}
			if(note == notaMasBaja+3) {
				guardadoBool = true;
				canvasGuardado = document.getElementById('canvas').toDataURL();
				guardado.textContent = 'guardado';
				return;
			}
			if(note == notaMasBaja+4) {
				if(guardadoBool == true) {
					var canvasPic = new Image();
					canvasPic.src = canvasGuardado;
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					canvasPic.onload = function () { ctx.drawImage(canvasPic, 0, 0); }
					guardado.textContent = 'restaurado';
					return;
				}
			}

			if(notas.length < 15) {
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
					ctx.fillRect(velocidad, ((notaActual - notaMasBaja - 5) / rangoNotas)* canvas.height, 5, 10);
				} else {
					ctx.fillRect(((notaActual - notaMasBaja - 5) / rangoNotas)* canvas.height,velocidad, 10, 5);
				}
			}
		}
	}

//utilidad
	function inArray(needle, haystack) {
		const length = haystack.length;
		for(let i = 0; i < length; i++) {
			if(haystack[i] == needle) return true;
		}
		return false;
	}

	function shadeColor(color, percent) {

		var R = parseInt(color.substring(1,3),16);
		var G = parseInt(color.substring(3,5),16);
		var B = parseInt(color.substring(5,7),16);
	
		R = parseInt(R * (100 + percent) / 100);
		G = parseInt(G * (100 + percent) / 100);
		B = parseInt(B * (100 + percent) / 100);
	
		R = (R<255)?R:255;  
		G = (G<255)?G:255;  
		B = (B<255)?B:255;  
	
		var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
		var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
		var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
		console.log("#"+RR+GG+BB);
		return "#"+RR+GG+BB;
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


colorSelector.addEventListener("change", function (e) {
	actualizarColores();
});

colorSelector.addEventListener("click", function(e) {
	if (e.target.id === "addColor") {
		const addColor = document.getElementById("addColor");
		const clone = addColor.cloneNode();
		addColor.parentElement.removeChild(addColor);

		const newRGB = "#" + Math.floor(Math.random()*16777215).toString(16);
	
		const newInput = document.createElement("input");
		newInput.setAttribute("type", "color");
		newInput.classList.add("colorInput");
		newInput.setAttribute("value", newRGB)
		colorSelector.appendChild(newInput);
	
		colorSelector.appendChild(clone);
		actualizarColores();
	}

})

const formParametros = document.getElementById("parametrosTempo");
formParametros.addEventListener("change", function () {
    actualizarParametros();
    actualizarTempo();
});

window.onload = function () {
    actualizarTempo();
    actualizarColores();
}