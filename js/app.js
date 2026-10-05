/* ==========================================================
   Campus Weather — app.js
   HTML5 + CSS3 + JavaScript + DOM + Callbacks + Promesas + Fetch
   ========================================================== */

/* ---------- 1. DATOS ---------- */

// Para agregar una nueva ciudad: añade un objeto a este arreglo.
const CIUDADES = [
  { nombre: "Huancayo",  lat: -12.0651, lon: -75.2049 },
  { nombre: "Lima",      lat: -12.0464, lon: -77.0428 },
  { nombre: "Cusco",     lat: -13.5319, lon: -71.9675 },
  { nombre: "Arequipa",  lat: -16.4090, lon: -71.5375 },
  { nombre: "Trujillo",  lat:  -8.1116, lon: -79.0288 },
  { nombre: "Piura",     lat:  -5.1945, lon: -80.6328 },
  { nombre: "Iquitos",   lat:  -3.7437, lon: -73.2516 },
  { nombre: "Tacna",     lat: -18.0146, lon: -70.2533 },
  { nombre: "Puno",      lat: -15.8402, lon: -70.0219 },
  { nombre: "Madrid",    lat:  40.4165, lon: -3.7026 },
  { nombre: "Cartagena",     lat:  10.3982, lon: -75.4933 },

];

  // Códigos WMO de Open-Meteo -> texto + emoji
const CONDICIONES = {
  0:  ["Despejado", "☀️"],
  1:  ["Mayormente despejado", "🌤️"],
  2:  ["Parcialmente nublado", "⛅"],
  3:  ["Nublado", "☁️"],
  45: ["Niebla", "🌫️"],
  48: ["Niebla con escarcha", "🌫️"],
  51: ["Llovizna ligera", "🌦️"],
  53: ["Llovizna moderada", "🌦️"],
  55: ["Llovizna intensa", "🌧️"],
  56: ["Llovizna helada", "🌧️"],
  57: ["Llovizna helada intensa", "🌧️"],
  61: ["Lluvia ligera", "🌧️"],
  63: ["Lluvia moderada", "🌧️"],
  65: ["Lluvia fuerte", "🌧️"],
  66: ["Lluvia helada", "🌧️"],
  67: ["Lluvia helada fuerte", "🌧️"],
  71: ["Nevada ligera", "🌨️"],
  73: ["Nevada moderada", "🌨️"],
  75: ["Nevada fuerte", "❄️"],
  77: ["Granizo fino", "🌨️"],
  80: ["Chubascos ligeros", "🌦️"],
  81: ["Chubascos moderados", "🌧️"],
  82: ["Chubascos violentos", "⛈️"],
  85: ["Chubascos de nieve", "🌨️"],
  86: ["Chubascos de nieve fuertes", "❄️"],
  95: ["Tormenta eléctrica", "⛈️"],
  96: ["Tormenta con granizo", "⛈️"],
  99: ["Tormenta con granizo fuerte", "⛈️"]
};

const TIEMPO_MAXIMO_MS = 8000; // si la API no responde en 8 s, se cancela

// Estado de la aplicación
let ciudadActual = null;   // objeto ciudad consultada
let favoritos = [];        // nombres de ciudades favoritas (solo durante la sesión)

/* ---------- 2. REFERENCIAS AL DOM ---------- */

const formulario      = document.getElementById("formulario");
const selectCiudad    = document.getElementById("selectCiudad");
const btnConsultar    = document.getElementById("btnConsultar");
const btnReintentar   = document.getElementById("btnReintentar");
const btnFavorito     = document.getElementById("btnFavorito");

const estadoVacio     = document.getElementById("estadoVacio");
const estadoCargando  = document.getElementById("estadoCargando");
const estadoError     = document.getElementById("estadoError");
const estadoResultado = document.getElementById("estadoResultado");
const textoError      = document.getElementById("textoError");

const resCiudad       = document.getElementById("resCiudad");
const resFecha        = document.getElementById("resFecha");
const resIcono        = document.getElementById("resIcono");
const resTemperatura  = document.getElementById("resTemperatura");
const resCondicion    = document.getElementById("resCondicion");
const resHumedad      = document.getElementById("resHumedad");
const resViento       = document.getElementById("resViento");
const resLatitud      = document.getElementById("resLatitud");
const resLongitud     = document.getElementById("resLongitud");
const listaPronostico = document.getElementById("listaPronostico");

const listaFavoritos  = document.getElementById("listaFavoritos");
const favoritosVacio  = document.getElementById("favoritosVacio");

/* ---------- 3. ESTADOS DE LA INTERFAZ ---------- */

// Muestra solo uno: "vacio" | "cargando" | "error" | "resultado"
function mostrarEstado(nombre) {
  estadoVacio.hidden     = nombre !== "vacio";
  estadoCargando.hidden  = nombre !== "cargando";
  estadoError.hidden     = nombre !== "error";
  estadoResultado.hidden = nombre !== "resultado";
}

/* ---------- 4. FETCH + PROMESAS ---------- */

// Devuelve una PROMESA con los datos ya convertidos a objeto JS
function obtenerClima(ciudad) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + ciudad.lat +
    "&longitude=" + ciudad.lon +
    "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&timezone=auto&forecast_days=5";

  // Cancelar la petición si tarda demasiado
  const controlador = new AbortController();
  const temporizador = setTimeout(function () {   // callback del temporizador
    controlador.abort();
  }, TIEMPO_MAXIMO_MS);

  // fetch() devuelve una Promesa<Response>
  return fetch(url, { signal: controlador.signal })
    .then(function (respuesta) {
      if (!respuesta.ok) {
        throw new Error("HTTP " + respuesta.status);
      }
      return respuesta.json();            // otra Promesa con el JSON
    })
    .finally(function () {
      clearTimeout(temporizador);
    });
}

// Procesa la respuesta de la API y deja solo los datos que usa la app
function procesarDatos(datos, ciudad) {
  if (!datos || !datos.current || !datos.daily) {
    throw new Error("Respuesta incompleta");
  }

  const codigo = datos.current.weather_code;
  const info = CONDICIONES[codigo] || ["Condición desconocida", "🌡️"];

  const pronostico = datos.daily.time.map(function (fecha, i) {   // callback de map
    const c = CONDICIONES[datos.daily.weather_code[i]] || ["", "🌡️"];
    return {
      fecha: fecha,
      icono: c[1],
      descripcion: c[0],
      max: Math.round(datos.daily.temperature_2m_max[i]),
      min: Math.round(datos.daily.temperature_2m_min[i])
    };
  });

  return {
    ciudad: ciudad.nombre,
    latitud: datos.latitude,
    longitud: datos.longitude,
    fechaHora: datos.current.time,
    temperatura: Math.round(datos.current.temperature_2m),
    humedad: datos.current.relative_humidity_2m,
    viento: datos.current.wind_speed_10m,
    condicion: info[0],
    icono: info[1],
    pronostico: pronostico
  };
}

/* ---------- 5. ACTUALIZACIÓN DEL DOM ---------- */

function formatearFechaHora(texto) {
  return new Date(texto).toLocaleString("es-PE", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit"
  });
}

function nombreDia(texto) {
  const partes = texto.split("-");   // evita desfase de zona horaria
  const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
  return fecha.toLocaleDateString("es-PE", { weekday: "short", day: "numeric" });
}

function mostrarResultado(clima) {
  resCiudad.textContent      = clima.ciudad;
  resFecha.textContent       = formatearFechaHora(clima.fechaHora);
  resIcono.textContent       = clima.icono;
  resTemperatura.textContent = clima.temperatura;      // aquí se muestra la temperatura
  resCondicion.textContent   = clima.condicion;
  resHumedad.textContent     = clima.humedad;
  resViento.textContent      = clima.viento;
  resLatitud.textContent     = clima.latitud.toFixed(4);
  resLongitud.textContent    = clima.longitud.toFixed(4);

  listaPronostico.innerHTML = "";
  clima.pronostico.forEach(function (dia) {            // callback de forEach
    const li = document.createElement("li");
    li.innerHTML =
      '<div class="dia">' + nombreDia(dia.fecha) + "</div>" +
      '<div class="icono" title="' + dia.descripcion + '">' + dia.icono + "</div>" +
      '<div class="temps"><span class="max">' + dia.max + '°</span> ' +
      '<span class="min">' + dia.min + "°</span></div>";
    listaPronostico.appendChild(li);
  });

  actualizarBotonFavorito();
  mostrarEstado("resultado");
}

function mostrarError(error) {
  let mensaje;
  if (error.name === "AbortError") {
    mensaje = "El servicio del clima tardó demasiado en responder. Inténtalo de nuevo.";
  } else if (error instanceof TypeError) {
    mensaje = "No se pudo conectar. Revisa tu conexión a internet.";
  } else {
    mensaje = "No se pudo obtener el clima de esta ciudad. Inténtalo más tarde.";
  }
  textoError.textContent = mensaje;
  mostrarEstado("error");
}

/* ---------- 6. CONSULTA PRINCIPAL ---------- */

function consultarCiudad(ciudad) {
  ciudadActual = ciudad;
  selectCiudad.value = ciudad.nombre;

  mostrarEstado("cargando");            // estado de carga
  btnConsultar.disabled = true;

  obtenerClima(ciudad)                                       // Promesa
    .then(function (datos) {                                 // callback de éxito
      return procesarDatos(datos, ciudad);
    })
    .then(mostrarResultado)                                  // actualiza el DOM
    .catch(mostrarError)                                     // cualquier fallo
    .finally(function () {
      btnConsultar.disabled = false;
    });
}

function buscarCiudad(nombre) {
  return CIUDADES.find(function (c) { return c.nombre === nombre; });
}

/* ---------- 7. FAVORITOS ---------- */

function esFavorita(nombre) {
  return favoritos.includes(nombre);
}

function actualizarBotonFavorito() {
  if (!ciudadActual) return;
  btnFavorito.textContent = esFavorita(ciudadActual.nombre)
    ? "★ Quitar de favoritos"
    : "☆ Agregar a favoritos";
}

function alternarFavorito() {
  if (!ciudadActual) return;
  const nombre = ciudadActual.nombre;

  if (esFavorita(nombre)) {
    favoritos = favoritos.filter(function (f) { return f !== nombre; });
  } else {
    favoritos.push(nombre);
  }
  dibujarFavoritos();
  actualizarBotonFavorito();
}

function quitarFavorito(nombre) {
  favoritos = favoritos.filter(function (f) { return f !== nombre; });
  dibujarFavoritos();
  actualizarBotonFavorito();
}

function dibujarFavoritos() {
  listaFavoritos.innerHTML = "";
  favoritosVacio.hidden = favoritos.length > 0;

  favoritos.forEach(function (nombre) {
    const li = document.createElement("li");

    const btnNombre = document.createElement("button");
    btnNombre.type = "button";
    btnNombre.className = "fav-nombre";
    btnNombre.textContent = nombre;
    btnNombre.addEventListener("click", function () {        // callback
      consultarCiudad(buscarCiudad(nombre));
    });

    const btnQuitar = document.createElement("button");
    btnQuitar.type = "button";
    btnQuitar.className = "fav-quitar";
    btnQuitar.textContent = "✕";
    btnQuitar.setAttribute("aria-label", "Quitar " + nombre + " de favoritos");
    btnQuitar.addEventListener("click", function () {        // callback
      quitarFavorito(nombre);
    });

    li.appendChild(btnNombre);
    li.appendChild(btnQuitar);
    listaFavoritos.appendChild(li);
  });
}

/* ---------- 8. INICIO Y EVENTOS (CALLBACKS) ---------- */

function llenarSelect() {
  CIUDADES.forEach(function (c) {
    const opcion = document.createElement("option");
    opcion.value = c.nombre;
    opcion.textContent = c.nombre;
    selectCiudad.appendChild(opcion);
  });
}

// Callback del evento submit
formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();                       // evita recargar la página
  const ciudad = buscarCiudad(selectCiudad.value);
  if (!ciudad) {                                 // validación
    textoError.textContent = "Primero selecciona una ciudad de la lista.";
    mostrarEstado("error");
    return;
  }
  consultarCiudad(ciudad);
});

// Callback del cambio de ciudad: consulta sin necesidad de botón
selectCiudad.addEventListener("change", function () {
  const ciudad = buscarCiudad(selectCiudad.value);
  if (ciudad) consultarCiudad(ciudad);
});

btnFavorito.addEventListener("click", alternarFavorito);

btnReintentar.addEventListener("click", function () {
  if (ciudadActual) consultarCiudad(ciudadActual);
  else mostrarEstado("vacio");
});

llenarSelect();
dibujarFavoritos();
mostrarEstado("vacio");
