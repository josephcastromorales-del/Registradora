// main.js - copia esto entero

// -----------------------------
// Helpers
// -----------------------------
function safePlay(audioEl) {
    if (!audioEl) return;
    try {
        audioEl.currentTime = 0;
        audioEl.play().catch(()=>{});
    } catch (e) {}
}

// -----------------------------
// Referencias DOM
// -----------------------------
const resultado = document.querySelector('.box-resultado');
const botones = document.querySelectorAll('.box-numeros button');

const pip = document.getElementById('pipSound');
const verificado = document.getElementById('verificadoSound');
const errorSound = document.getElementById('errorSound');

const tarjeta = document.getElementById('tarjeta');
const btnBorrar = document.getElementById('btn-borrar');
const btnPagar = document.getElementById('btn-pagar');

// -----------------------------
// Desbloquear audio en la primera interacción del usuario
// -----------------------------
function unlockAudioOnce() {
    safePlay(pip);
    safePlay(verificado);
    safePlay(errorSound);
}
document.body.addEventListener('pointerdown', unlockAudioOnce, { once: true });

// -----------------------------
// Botones numéricos (escribir en pantalla)
// -----------------------------
botones.forEach(btn => {
    btn.addEventListener('click', () => {
        // agrega el texto del botón (puede ser ".", "#" o dígitos)
        resultado.textContent += btn.textContent;
        safePlay(pip);
    });
});

// -----------------------------
// Tarjeta: genera código de 10 dígitos y suena
// -----------------------------
tarjeta.addEventListener('click', () => {
    // reproducir pip
    safePlay(pip);

    // generar 10 dígitos (0-9)
    let codigo = "";
    for (let i = 0; i < 10; i++) {
        codigo += Math.floor(Math.random() * 10); // 0..9
    }

    resultado.textContent = codigo;
});

// -----------------------------
// Botón PAGAR: valida y reproduce verificado/error
// -----------------------------
btnPagar.addEventListener('click', () => {
    // leer contenido visible
    const contenidoVisible = (resultado.textContent || "").trim();

    // limpiamos todo lo que no sea dígito para validar longitud
    const onlyDigits = contenidoVisible.replace(/\D/g, ""); // elimina . # y letras

    // validar exactamente 10 dígitos
    if (onlyDigits.length !== 10) {
        // inválido
        safePlay(errorSound);

        // mostrar mensaje temporal
        const antes = resultado.textContent;
        resultado.textContent = "❌ Faltan números";

        setTimeout(() => {
            resultado.textContent = antes;
        }, 1000);

        return;
    }

    // válido -> pago aceptado
    safePlay(verificado);
    const prev = resultado.textContent;
    resultado.textContent = "✅ Pago realizado";

    setTimeout(() => {
        resultado.textContent = "";
    }, 1500);
});

// -----------------------------
// Botón BORRAR
// -----------------------------
btnBorrar.addEventListener('click', () => {
    resultado.textContent = "";
});

// -----------------------------
// Sensor de proximidad (si existe) - como lo tenías
// -----------------------------
function activarSensorProximidad() {
    if ('ondeviceproximity' in window) {
        window.addEventListener('deviceproximity', (e) => {
            if (e.value < e.max) safePlay(pip);
        });
        return true;
    }

    if ('ProximitySensor' in window) {
        try {
            const sensor = new ProximitySensor();
            sensor.start();
            sensor.onreading = () => {
                if (sensor.distance < 5) safePlay(pip);
            };
            return true;
        } catch (err) {
            // fallo creando sensor
        }
    }

    return false;
}

// -----------------------------
// Detector por cámara (fallback)
// -----------------------------
function activarDeteccionCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.createElement('video');
            video.style.position = "fixed";
            video.style.top = "-9999px";
            video.style.left = "-9999px";
            document.body.appendChild(video);

            video.srcObject = stream;
            video.play();

            let prevBrightness = 0;

            setInterval(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 40;
                canvas.height = 40;

                ctx.drawImage(video, 0, 0, 40, 40);
                const data = ctx.getImageData(0, 0, 40, 40).data;

                let total = 0;
                for (let i = 0; i < data.length; i += 4) {
                    total += (data[i] + data[i+1] + data[i+2]) / 3;
                }

                const avg = total / (40 * 40);

                if (prevBrightness && avg < prevBrightness * 0.6) {
                    safePlay(pip);
                }

                prevBrightness = avg;
            }, 300);
        })
        .catch(()=>{ /* usuario negó cámara o no disponible */ });
}

// -----------------------------
// Activar sensores
// -----------------------------
if (!activarSensorProximidad()) activarDeteccionCamara();
