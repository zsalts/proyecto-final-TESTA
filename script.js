// ======== 1. Simular datos remotos ==========
function fetchProductosSimulado() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 1, nombre: "Remera", precio: 5000 },
        { id: 2, nombre: "Pantalón", precio: 12000 },
        { id: 3, nombre: "Zapatillas", precio: 25000 },
        { id: 4, nombre: "Campera", precio: 30000 }
      ]);
    }, 350);
  });
}

// Cargar carrito desde localStorage o iniciar vacío
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

// Pedidos guardados (historial)
let pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];

// ======== 2. Elementos del DOM ==========
const contenedorProductos = document.getElementById("listaProductos");
const contenedorCarrito = document.getElementById("carrito");
const totalHTML = document.getElementById("total");
const btnVaciar = document.getElementById("vaciarCarrito");
const contadorCarrito = document.getElementById("contadorCarrito");
const btnFinalizar = document.getElementById("finalizarCompra");

const modalOverlay = document.getElementById("modalOverlay");
const checkoutForm = document.getElementById("checkoutForm");
const cancelarCheckout = document.getElementById("cancelarCheckout");

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

let productos = []

// ======== 3. Inicializar (carga remota simulada) ==========
async function init() {
  productos = await fetchProductosSimulado();
  mostrarProductos();
  mostrarCarrito();
}
init();

// ======== 4. Mostrar productos ==========
function mostrarProductos() {
  contenedorProductos.innerHTML = "";
  productos.forEach(producto => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p>Precio: ${fmt.format(producto.precio)}</p>
      <button data-id="${producto.id}" class="btn-agregar">Agregar</button>
    `;
    contenedorProductos.appendChild(card);
  });

  contenedorProductos.querySelectorAll(".btn-agregar").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      agregarAlCarrito(id);
    });
  });
}

// ======== 5. Agregar al carrito (con cantidad) ==========
function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const itemEnCarrito = carrito.find(p => p.id === id);

  if (itemEnCarrito) {
    itemEnCarrito.cantidad++;
  } else {
    carrito.push({
      ...producto,
      cantidad: 1
    });
  }

  guardarCarrito();
  mostrarCarrito();
}

// ======== 6. Mostrar carrito ==========
function mostrarCarrito() {
  contenedorCarrito.innerHTML = "";

  if (carrito.length === 0) {
    contenedorCarrito.innerHTML = `<p style="text-align:center; width:100%;">El carrito está vacío.</p>`;
  }

  carrito.forEach((producto, index) => {
    const item = document.createElement("div");
    item.classList.add("card");
    // botones de cantidad y eliminar
    item.innerHTML = `
      <h4>${producto.nombre}</h4>
      <p>Precio unitario: ${fmt.format(producto.precio)}</p>
      <div class="cart-controls">
        <button class="small-btn" data-action="menos" data-index="${index}">-</button>
        <span style="align-self:center; font-weight:700;">${producto.cantidad}</span>
        <button class="small-btn" data-action="mas" data-index="${index}">+</button>
      </div>
      <p>Subtotal: ${fmt.format(producto.precio * producto.cantidad)}</p>
      <button class="small-btn" data-action="eliminar" data-index="${index}">Eliminar</button>
    `;
    contenedorCarrito.appendChild(item);
  });

  contenedorCarrito.querySelectorAll("[data-action]").forEach(btn => {
    const action = btn.dataset.action;
    const index = Number(btn.dataset.index);
    btn.addEventListener("click", () => {
      if (action === "mas") {
        carrito[index].cantidad++;
      } else if (action === "menos") {
        carrito[index].cantidad--;
        if (carrito[index].cantidad <= 0) {
          carrito.splice(index, 1);
        }
      } else if (action === "eliminar") {
        carrito.splice(index, 1);
      }
      guardarCarrito();
      mostrarCarrito();
    });
  });

  let total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  totalHTML.textContent = `Total: ${fmt.format(total)}`;
  contadorCarrito.textContent = carrito.reduce((acc, p) => acc + p.cantidad, 0);
}

// ======== 7. Vaciar carrito ==========
btnVaciar.addEventListener("click", () => {
  if (confirm("¿Querés vaciar el carrito?")) {
    carrito = [];
    guardarCarrito();
    mostrarCarrito();
  }
});

// ======== 8. Guardar en localStorage ==========
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}

// ======== 9. Checkout (simulado) ==========
btnFinalizar.addEventListener("click", () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío. Agregá productos antes de finalizar la compra.");
    return;
  }
  // abrir modal
  modalOverlay.classList.remove("hidden");
});

cancelarCheckout.addEventListener("click", () => {
  modalOverlay.classList.add("hidden");
});

checkoutForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // obtener datos del formulario
  const nombre = document.getElementById("clienteNombre").value.trim();
  const email = document.getElementById("clienteEmail").value.trim();
  const direccion = document.getElementById("clienteDireccion").value.trim();

  if (!nombre || !email || !direccion) {
    alert("Completá todos los campos.");
    return;
  }

  // crear pedido simulado
  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const pedido = {
    id: `PED-${Date.now()}`,
    cliente: { nombre, email, direccion },
    items: carrito.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio, cantidad: p.cantidad })),
    total,
    fecha: new Date().toISOString()
  };

  procesarPagoSimulado(pedido)
    .then(res => {
      // guardar pedido en historial
      pedidos.push(pedido);
      localStorage.setItem("pedidos", JSON.stringify(pedidos));

      // limpiar carrito
      carrito = [];
      guardarCarrito();
      mostrarCarrito();

      modalOverlay.classList.add("hidden");
      checkoutForm.reset();

      alert(`Pago aprobado. Pedido: ${pedido.id}\nTotal: ${fmt.format(pedido.total)}\nGracias por tu compra, ${nombre}!`);
    })
    .catch(err => {
      alert("Hubo un error procesando el pago. Intentá nuevamente.");
      console.error(err);
    });
});

function procesarPagoSimulado(pedido) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ success: true, id: pedido.id });
    }, 800);
  });
}

// ======== 10. Opcional: Mostrar historial de pedidos en consola (para pruebas) ========
function verHistorialPedidos() {
  console.log("Pedidos guardados:", pedidos);
}

window._tienda = {
  carrito,
  productos,
  pedidos,
  verHistorialPedidos
};
