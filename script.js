
function generarMatriz() {

    let filas = Number(
        document.getElementById("filas").value
    );

    let columnas = Number(
        document.getElementById("columnas").value
    );

    let tipo = document.getElementById("tipo").value;

    let contenedor = document.getElementById("contenedorMatriz");

    contenedor.innerHTML = "";

    
    document.getElementById("procedimiento").textContent =
        "Aquí aparecen las operaciones realizadas.";

    if (
        !Number.isInteger(filas) ||
        !Number.isInteger(columnas) ||
        filas <= 0 ||
        columnas <= 0
    ) {
        alert("Ingrese dimensiones enteras mayores que cero.");
        return;
    }

    if (tipo === "inversa" && filas !== columnas) {
        alert("Para calcular una inversa, la matriz debe ser cuadrada.");
        return;
    }

    let totalColumnas = columnas;


    if (tipo === "sistema") {
        totalColumnas = columnas + 1;
    }

    let tabla = document.createElement("table");
    tabla.dataset.tipo = tipo;

    for (let i = 0; i < filas; i++) {

        let fila = document.createElement("tr");

        for (let j = 0; j < totalColumnas; j++) {

            let celda = document.createElement("td");

            let campo = document.createElement("input");

            campo.type = "number";
            campo.step = "any";
            campo.required = true;

            campo.dataset.fila = i;
            campo.dataset.columna = j;

            if (tipo === "sistema" && j === columnas) {
                celda.className = "resultado-ecuacion";
            }

            celda.appendChild(campo);
            fila.appendChild(celda);
        }

        tabla.appendChild(fila);
    }

    contenedor.appendChild(tabla);
}


function obtenerValores() {

    let tabla = document.querySelector("#contenedorMatriz table");

    if (tabla === null) {
        alert("Primero debe generar una matriz.");
        return null;
    }

    let matriz = [];

    for (let i = 0; i < tabla.rows.length; i++) {

        matriz[i] = [];

        let campos = tabla.rows[i].querySelectorAll("input");

        for (let j = 0; j < campos.length; j++) {

            if (campos[j].value === "") {
                alert("Complete todos los valores de la matriz.");
                return null;
            }

            let numero = Number(campos[j].value);

            if (!Number.isFinite(numero)) {
                alert("Ingrese un número válido.");
                return null;
            }

            matriz[i][j] = numero;
        }
    }

    return matriz;
}


// Conecta la tabla generada con la operación seleccionada.
function calcular() {

    let tipo = document.getElementById("tipo").value;
    let tabla = document.querySelector("#contenedorMatriz table");

    if (tabla !== null) {
        let filas = Number(document.getElementById("filas").value);
        let columnas = Number(document.getElementById("columnas").value);
        let totalColumnas = columnas;

        if (tipo === "sistema") {
            totalColumnas = columnas + 1;
        }

        if (
            tabla.dataset.tipo !== tipo ||
            tabla.rows.length !== filas ||
            tabla.rows[0].cells.length !== totalColumnas
        ) {
            alert("Cambió la operación o las dimensiones. Genere la matriz nuevamente.");
            return;
        }
    }

    let matriz = obtenerValores();

    if (matriz === null) {
        return;
    }

    document.getElementById("procedimiento").innerHTML = "";

    try {
        if (tipo === "sistema") {
            resolverSistema(matriz);
        } else if (tipo === "inversa") {
            calcularInversa(matriz);
        }
    } catch (error) {
        mostrarTexto(error.message);
    }
}


// Copia cada fila: los pasos anteriores no deben cambiar al operar la matriz.
function registrarPaso(pasos, operacion, matriz) {

    let copia = [];

    for (let i = 0; i < matriz.length; i++) {
        copia[i] = [];

        for (let j = 0; j < matriz[i].length; j++) {
            if (!Number.isFinite(matriz[i][j])) {
                throw new Error("El cálculo supera el rango numérico disponible. Revise la magnitud de los valores ingresados.");
            }

            copia[i][j] = matriz[i][j];
        }
    }

    pasos.push({ operacion: operacion, matriz: copia });
}


// Reduce únicamente las columnas de A; b o I acompañan las operaciones.
function gaussJordan(matriz, columnasCoeficientes, descripcionInicial) {

    let reducida = [];

    for (let i = 0; i < matriz.length; i++) {
        reducida[i] = matriz[i].slice();
    }

    let pasos = [];
    let pivotes = [];
    let filaPivote = 0;
    let determinante = 1;
    let signoDeterminante = 1;
    let logDeterminante = 0;
    let usarLogDeterminante = false;

    registrarPaso(pasos, descripcionInicial, reducida);

    for (let columna = 0; columna < columnasCoeficientes; columna++) {

        if (filaPivote === reducida.length) {
            break;
        }

        // Elegir el mayor valor absoluto reduce errores con decimales.
        let mejorFila = filaPivote;

        for (let i = filaPivote + 1; i < reducida.length; i++) {
            if (Math.abs(reducida[i][columna]) > Math.abs(reducida[mejorFila][columna])) {
                mejorFila = i;
            }
        }

        if (reducida[mejorFila][columna] === 0) {
            continue;
        }

        if (mejorFila !== filaPivote) {
            let auxiliar = reducida[filaPivote];
            reducida[filaPivote] = reducida[mejorFila];
            reducida[mejorFila] = auxiliar;
            determinante = -determinante;
            signoDeterminante = -signoDeterminante;

            registrarPaso(pasos, "F" + (filaPivote + 1) + " ↔ F" + (mejorFila + 1), reducida);
        }

        let pivote = reducida[filaPivote][columna];
        determinante = determinante * pivote;
        logDeterminante = logDeterminante + Math.log10(Math.abs(pivote));

        // Evitar pérdida de precisión por productos intermedios extremos.
        if (!Number.isFinite(determinante) || Math.abs(determinante) < 1e-300) {
            usarLogDeterminante = true;
        }

        if (pivote < 0) {
            signoDeterminante = -signoDeterminante;
        }

        if (pivote !== 1) {
            for (let j = 0; j < reducida[filaPivote].length; j++) {
                reducida[filaPivote][j] = reducida[filaPivote][j] / pivote;
            }

            reducida[filaPivote][columna] = 1;
            registrarPaso(pasos, "F" + (filaPivote + 1) + " = F" + (filaPivote + 1) + " / (" + formatearNumero(pivote) + ")", reducida);
        }

        // Eliminar tanto por encima como por debajo del pivote.
        for (let i = 0; i < reducida.length; i++) {

            if (i === filaPivote) {
                continue;
            }

            let factor = reducida[i][columna];

            if (factor === 0) {
                continue;
            }

            for (let j = 0; j < reducida[i].length; j++) {
                let anterior = reducida[i][j];
                let termino = factor * reducida[filaPivote][j];
                let nuevo = anterior - termino;

                // Limpiar solo ruido de cancelación, sin borrar entradas pequeñas.
                let tolerancia = 64 * Number.EPSILON * Math.max(Math.abs(anterior), Math.abs(termino));

                if (Number.isFinite(nuevo) && Math.abs(nuevo) <= tolerancia) {
                    nuevo = 0;
                }

                reducida[i][j] = nuevo;
            }

            reducida[i][columna] = 0;
            registrarPaso(pasos, "F" + (i + 1) + " = F" + (i + 1) + " - (" + formatearNumero(factor) + ") · F" + (filaPivote + 1), reducida);
        }

        pivotes.push({ fila: filaPivote, columna: columna });
        filaPivote++;
    }

    return {
        matriz: reducida,
        pasos: pasos,
        pivotes: pivotes,
        determinante: determinante,
        signoDeterminante: signoDeterminante,
        logDeterminante: logDeterminante,
        usarLogDeterminante: usarLogDeterminante
    };
}


function resolverSistema(matriz) {

    let columnas = matriz[0].length - 1;
    let resultado = gaussJordan(matriz, columnas, "Matriz aumentada inicial [A | b].");

    mostrarPasos(resultado.pasos, columnas);
    mostrarTexto("Resultado final", "h3");

    // Una fila [0 ... 0 | b], con b distinto de cero, es una contradicción.
    for (let i = 0; i < resultado.matriz.length; i++) {
        let filaCero = true;

        for (let j = 0; j < columnas; j++) {
            if (resultado.matriz[i][j] !== 0) {
                filaCero = false;
            }
        }

        if (filaCero && resultado.matriz[i][columnas] !== 0) {
            mostrarTexto("El sistema no tiene solución. La fila " + (i + 1) + " representa 0 = " + formatearNumero(resultado.matriz[i][columnas]) + ", una contradicción.");
            return;
        }
    }

    if (resultado.pivotes.length === columnas) {
        mostrarTexto("El sistema tiene solución única.");

        for (let i = 0; i < resultado.pivotes.length; i++) {
            let pivote = resultado.pivotes[i];
            mostrarTexto("x" + (pivote.columna + 1) + " = " + formatearNumero(resultado.matriz[pivote.fila][columnas]));
        }

        return;
    }

    mostrarTexto("El sistema tiene infinitas soluciones. Los parámetros t1, t2, ... pueden tomar cualquier valor real.");

    let columnasLibres = [];

    for (let j = 0; j < columnas; j++) {
        let tienePivote = false;

        for (let i = 0; i < resultado.pivotes.length; i++) {
            if (resultado.pivotes[i].columna === j) {
                tienePivote = true;
            }
        }

        if (!tienePivote) {
            columnasLibres.push(j);
            mostrarTexto("x" + (j + 1) + " = t" + columnasLibres.length);
        }
    }

    for (let i = 0; i < resultado.pivotes.length; i++) {
        let pivote = resultado.pivotes[i];
        let expresion = formatearNumero(resultado.matriz[pivote.fila][columnas]);

        for (let j = 0; j < columnasLibres.length; j++) {
            let coeficiente = -resultado.matriz[pivote.fila][columnasLibres[j]];

            if (coeficiente !== 0) {
                if (coeficiente > 0) {
                    expresion = expresion + " + ";
                } else {
                    expresion = expresion + " - ";
                }

                if (Math.abs(coeficiente) !== 1) {
                    expresion = expresion + formatearNumero(Math.abs(coeficiente)) + " · ";
                }

                expresion = expresion + "t" + (j + 1);
            }
        }

        mostrarTexto("x" + (pivote.columna + 1) + " = " + expresion);
    }
}


function calcularInversa(matriz) {

    let filas = matriz.length;

    for (let i = 0; i < filas; i++) {
        if (matriz[i].length !== filas) {
            mostrarTexto("Para calcular una inversa, la matriz debe ser cuadrada.");
            return;
        }
    }

    let aumentada = [];

    for (let i = 0; i < filas; i++) {
        aumentada[i] = matriz[i].slice();

        for (let j = 0; j < filas; j++) {
            if (i === j) {
                aumentada[i].push(1);
            } else {
                aumentada[i].push(0);
            }
        }
    }

    let resultado = gaussJordan(aumentada, filas, "Matriz aumentada inicial [A | I].");

    mostrarPasos(resultado.pasos, filas);
    mostrarTexto("Resultado final", "h3");

    // A es invertible si existe un pivote en cada columna de A.
    if (resultado.pivotes.length !== filas) {
        mostrarTexto("La matriz no tiene inversa porque su determinante es cero (det(A) = 0).");
        return;
    }

    mostrarTexto("det(A) = " + formatearDeterminante(resultado) + ". Es distinto de cero, por lo tanto la matriz es invertible.");
    mostrarTexto("Se obtuvo [I | A⁻¹]. La matriz inversa es:");

    let inversa = [];

    for (let i = 0; i < filas; i++) {
        inversa[i] = [];

        for (let j = filas; j < filas * 2; j++) {
            inversa[i].push(resultado.matriz[i][j]);
        }
    }

    document.getElementById("procedimiento").appendChild(crearTablaMatriz(inversa, -1));
}


// El determinante es el producto de pivotes, con el signo de los intercambios.
function formatearDeterminante(resultado) {

    if (!resultado.usarLogDeterminante && resultado.determinante !== 0 && Number.isFinite(resultado.determinante)) {
        return formatearNumero(resultado.determinante);
    }

    // Notación científica si el producto desborda o es demasiado pequeño.
    let exponente = Math.floor(resultado.logDeterminante);
    let mantisa = resultado.signoDeterminante * Math.pow(10, resultado.logDeterminante - exponente);

    return formatearNumero(mantisa) + " × 10^(" + exponente + ")";
}


function formatearNumero(numero) {
    if (numero === 0) {
        return "0";
    }

    if (Number.isInteger(numero)) {
        return numero.toString();
    }

    // Mostrar fracciones simples sin alterar los calculos de Gauss-Jordan.
    let signo = numero < 0 ? "-" : "";
    let valor = Math.abs(Number(numero.toPrecision(12)));
    let maximoDenominador = 1000000;
    let numeradorAnterior = 0;
    let numeradorActual = 1;
    let denominadorAnterior = 1;
    let denominadorActual = 0;
    let restante = valor;

    for (let i = 0; i < 32; i++) {
        let entero = Math.floor(restante);
        let numerador = entero * numeradorActual + numeradorAnterior;
        let denominador = entero * denominadorActual + denominadorAnterior;

        if (denominador > maximoDenominador ||
            !Number.isSafeInteger(numerador) ||
            !Number.isSafeInteger(denominador)) {
            break;
        }

        // Aceptar fracciones equivalentes dentro de la precision de visualizacion.
        if (numerador !== 0 &&
            Math.abs(numerador / denominador - valor) <= Math.abs(valor) * 1e-10) {
            if (denominador === 1) {
                return signo + numerador;
            }
            return signo + numerador + "/" + denominador;
        }

        numeradorAnterior = numeradorActual;
        numeradorActual = numerador;
        denominadorAnterior = denominadorActual;
        denominadorActual = denominador;

        let parteDecimal = restante - entero;
        if (parteDecimal === 0) {
            break;
        }
        restante = 1 / parteDecimal;
    }

    // Si no existe una fraccion corta, convertir el decimal mostrado
    // en una fraccion exacta de hasta 12 cifras significativas.
    let partes = valor.toString().split("e");
    let exponente = partes.length === 2 ? Number(partes[1]) : 0;
    let numeroDecimal = partes[0].split(".");
    let decimales = numeroDecimal.length === 2 ? numeroDecimal[1].length : 0;
    let numerador = BigInt(numeroDecimal.join(""));
    let potencia = exponente - decimales;
    let denominador = 1n;

    if (potencia >= 0) {
        numerador = numerador * (10n ** BigInt(potencia));
    } else {
        denominador = 10n ** BigInt(-potencia);
    }

    let a = numerador;
    let b = denominador;
    while (b !== 0n) {
        let residuo = a % b;
        a = b;
        b = residuo;
    }

    numerador = numerador / a;
    denominador = denominador / a;

    if (denominador === 1n) {
        return signo + numerador.toString();
    }

    return signo + numerador.toString() + "/" + denominador.toString();
}


function crearTablaMatriz(matriz, separador) {

    let tabla = document.createElement("table");

    for (let i = 0; i < matriz.length; i++) {
        let fila = document.createElement("tr");

        for (let j = 0; j < matriz[i].length; j++) {
            let celda = document.createElement("td");
            celda.textContent = formatearNumero(matriz[i][j]);

            if (j === separador) {
                celda.className = "resultado-ecuacion";
            }

            fila.appendChild(celda);
        }

        tabla.appendChild(fila);
    }

    return tabla;
}


function mostrarPasos(pasos, separador) {

    let procedimiento = document.getElementById("procedimiento");
    mostrarTexto("Los valores se muestran como fracciones simplificadas.");

    for (let i = 0; i < pasos.length; i++) {
        let paso = document.createElement("div");
        paso.className = "paso";

        let titulo = document.createElement("h3");
        titulo.textContent = "Paso " + (i + 1) + ": " + pasos[i].operacion;

        paso.appendChild(titulo);
        paso.appendChild(crearTablaMatriz(pasos[i].matriz, separador));
        procedimiento.appendChild(paso);
    }
}


function mostrarTexto(texto, etiqueta = "p") {
    let elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    document.getElementById("procedimiento").appendChild(elemento);
}
