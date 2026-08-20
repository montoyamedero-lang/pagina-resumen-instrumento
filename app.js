document.addEventListener("DOMContentLoaded", async function () {

  // =========================================================
  // 1. OBTENER EL TOKEN DE LA DIRECCIÓN DE LA PÁGINA
  // =========================================================
  const parametros = new URLSearchParams(window.location.search);
  const token = parametros.get("token");

  if (!token) {
    mostrarError(
      "No se encontró el token de la respuesta. " +
      "Esta página debe abrirse desde el enlace generado para cada participante."
    );
    return;
  }

  // =========================================================
  // 2. COMPROBAR QUE CONFIG.JS ESTÉ DISPONIBLE
  // =========================================================
  if (
    typeof CONFIG === "undefined" ||
    !CONFIG.WEBHOOK_URL
  ) {
    mostrarError(
      "No se pudo encontrar la configuración de conexión."
    );
    return;
  }

  try {

    // =======================================================
    // 3. CONSULTAR APPS SCRIPT CON EL TOKEN
    // =======================================================
    const url =
      CONFIG.WEBHOOK_URL +
      "?token=" +
      encodeURIComponent(token);

    const respuestaHttp = await fetch(url, {
      method: "GET",
      cache: "no-store"
    });

    if (!respuestaHttp.ok) {
      throw new Error(
        "Error de conexión: " + respuestaHttp.status
      );
    }

    const datos = await respuestaHttp.json();

    if (!datos.ok) {
      throw new Error(
        datos.error || "No se pudieron recuperar los datos."
      );
    }

    const respuestas = datos.respuesta || {};

    // =======================================================
    // 4. CONVERTIR LAS RESPUESTAS EN UNA LISTA
    // =======================================================
    const campos = Object.values(respuestas)
      .filter(function (campo) {
        return (
          campo &&
          typeof campo === "object" &&
          campo.titulo !== undefined &&
          campo.valor !== undefined
        );
      });

    // =======================================================
    // 5. LOCALIZAR LOS NOMBRES DE LAS LÍNEAS
    // =======================================================
    const campoLineaA = campos.find(function (campo) {
      const titulo = normalizar(campo.titulo);

      return (
        titulo.includes("nombre") &&
        titulo.includes("linea") &&
        titulo.includes("investigacion a")
      );
    });

    const campoLineaB = campos.find(function (campo) {
      const titulo = normalizar(campo.titulo);

      return (
        titulo.includes("nombre") &&
        titulo.includes("linea") &&
        titulo.includes("investigacion b")
      );
    });

    // =======================================================
    // 6. LOCALIZAR LAS ELECCIONES DE IMAGEN
    // =======================================================
    const camposImagen = campos.filter(function (campo) {
      return normalizar(campo.titulo).includes(
        "selecciona la imagen"
      );
    });

    // =======================================================
    // 7. LOCALIZAR LAS ELECCIONES DE EMOTICÓN
    // =======================================================
    const camposEmoticon = campos.filter(function (campo) {
      const titulo = normalizar(campo.titulo);

      return (
        titulo.includes("selecciona el emoticon") ||
        titulo.includes("selecciona el emoticono")
      );
    });

    // =======================================================
    // 8. EXTRAER LOS SEIS VALORES
    // =======================================================
    const lineaA =
      campoLineaA?.valor || "Línea A";

    const lineaB =
      campoLineaB?.valor || "Línea B";

    const imagenA =
      camposImagen[0]?.valor || "";

    const imagenB =
      camposImagen[1]?.valor || "";

    const emoticonA =
      camposEmoticon[0]?.valor || "";

    const emoticonB =
      camposEmoticon[1]?.valor || "";

    // =======================================================
    // 9. LOCALIZAR LAS DOS TARJETAS DEL HTML
    // =======================================================
    const tarjetas =
      document.querySelectorAll(".tarjeta");

    if (tarjetas.length < 2) {
      throw new Error(
        "No se encontraron las dos tarjetas de Línea A y Línea B."
      );
    }

    // =======================================================
    // 10. RELLENAR LÍNEA A
    // =======================================================
    rellenarTarjeta(
      tarjetas[0],
      lineaA,
      imagenA,
      emoticonA
    );

    // =======================================================
    // 11. RELLENAR LÍNEA B
    // =======================================================
    rellenarTarjeta(
      tarjetas[1],
      lineaB,
      imagenB,
      emoticonB
    );

    console.log(
      "Datos cargados correctamente:",
      {
        lineaA,
        imagenA,
        emoticonA,
        lineaB,
        imagenB,
        emoticonB
      }
    );

  } catch (error) {

    console.error(error);

    mostrarError(
      "No fue posible cargar las elecciones del participante. " +
      error.message
    );
  }
});


// ===========================================================
// FUNCIÓN PARA RELLENAR CADA TARJETA
// ===========================================================

function rellenarTarjeta(
  tarjeta,
  nombreLinea,
  opcionImagen,
  opcionEmoticon
) {

  const titulo =
    tarjeta.querySelector(".titulo-linea");

  const marcoImagen =
    tarjeta.querySelector(".marco-imagen");

  const emoticono =
    tarjeta.querySelector(".emoticono");

  if (titulo) {
    titulo.textContent = nombreLinea;
  }

  if (marcoImagen) {

    marcoImagen.innerHTML = "";

    const textoImagen =
      document.createElement("p");

    textoImagen.textContent =
      opcionImagen || "Imagen no disponible";

    marcoImagen.appendChild(textoImagen);
  }

  if (emoticono) {

    emoticono.textContent =
      opcionEmoticon || "—";
  }
}


// ===========================================================
// NORMALIZAR TEXTO PARA HACER LAS BÚSQUEDAS MÁS SEGURAS
// ===========================================================

function normalizar(texto) {

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


// ===========================================================
// MOSTRAR MENSAJES DE ERROR SIN ROMPER LA PÁGINA
// ===========================================================

function mostrarError(mensaje) {

  console.error(mensaje);

  let aviso =
    document.getElementById("mensaje-app");

  if (!aviso) {

    aviso =
      document.createElement("div");

    aviso.id = "mensaje-app";

    aviso.style.maxWidth = "900px";
    aviso.style.margin = "20px auto";
    aviso.style.padding = "15px";
    aviso.style.textAlign = "center";

    document.body.prepend(aviso);
  }

  aviso.textContent = mensaje;
}
