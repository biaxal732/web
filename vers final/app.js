const API = "https://script.google.com/macros/s/AKfycby2XPI67GuE6AM9VuDb6PJivK_y3tjJFGpQ3miMA0t3q9VTbqU_pp6rcGlY2f77IbkG/exec";

let usuario = {};
let inventario = [];
let ventaActual = [];
let sucursalVentaFija = "";

/******** LOGIN ********/
function login(){
  const user = userInput("user");
  const pass = userInput("pass");
  if(!user||!pass) return alert("Ingrese usuario y contraseña");

  jsonp({action:"login",user,pass},r=>{
    if(!r.ok) return alert("Usuario o contraseña incorrectos");
    usuario=r;
    cargarSucursales();
    show(r.rol==="admin"?"menuAdmin":"menuEmpleado");
    cargarInventario();
  });
}

/******** NAVEGACIÓN ********/
function show(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}
function go(id){show(id)}
function goMenu(){show(usuario.rol==="admin"?"menuAdmin":"menuEmpleado")}
function logout(){location.reload()}

/******** SUCURSALES ********/
let sucursales=[];
function cargarSucursales(){
  jsonp({action:"getSucursales"},r=>{
    sucursales=r;
    ["invSucursal","ventaSucursal"].forEach(id=>{
      const s=document.getElementById(id);
      if(!s) return;
      s.innerHTML="";
      r.forEach(x=>s.innerHTML+=`<option>${x[0]}</option>`);
    });
  });
}

/******** INVENTARIO ********/
function cargarInventario(){
  jsonp({action:"getInventario"},r=>{
    inventario=r;
    pintarInventario();
    cargarProductosVenta();
  });
}

function pintarInventario(){
  const c=document.getElementById("inventarioLista");
  if(!c) return;
  c.innerHTML="";
  inventario.slice(1).forEach(p=>{
    c.innerHTML+=`
    <div class="card">
      <b>${p[0]}</b><br>
      ${p[1]} | ${p[2]}<br>
      Stock: ${p[5]}
    </div>`;
  });
}

function guardarInventario(){
  const row=[
    val("invProducto"),
    val("invUnidad"),
    val("invSucursal"),
    val("invCompra"),
    val("invVenta"),
    val("invCantidad")
  ];
  if(!row[0]) return alert("Producto requerido");
  jsonp({action:"add",sheet:"inventario",row:JSON.stringify(row)},()=>{
    alert("Guardado");
    go("inventario");
    cargarInventario();
  });
}

/******** VENTAS ********/
function cargarProductosVenta(){
  const s=document.getElementById("ventaProducto");
  if(!s) return;
  s.innerHTML="";
  inventario.slice(1).forEach(p=>{
    const sinStock=p[5]<=0;
    s.innerHTML+=`<option ${sinStock?"disabled style='color:red'":""}>${p[0]}</option>`;
  });
}

function autoPrecio(){
  const p=inventario.find(x=>x[0]===val("ventaProducto"));
  if(!p||p[5]<=0) return alert("Producto sin stock");
  set("ventaPrecio",p[4]);
  calcularTotal();
}

function calcularTotal(){
  set("ventaTotal",(num("ventaCantidad")*num("ventaPrecio")).toFixed(2));
}

function agregarVenta(){
  if(!val("ventaProducto")||num("ventaCantidad")<=0) return;
  ventaActual.push({
    producto:val("ventaProducto"),
    cantidad:num("ventaCantidad"),
    precio:num("ventaPrecio"),
    total:num("ventaTotal")
  });
  pintarVenta();
}

function pintarVenta(){
  const c=document.getElementById("ventaLista");
  c.innerHTML="";
  ventaActual.forEach(v=>{
    c.innerHTML+=`
    <div class="card">
      ${v.producto} x${v.cantidad} = $${v.total}
    </div>`;
  });
}

function generarVenta(){
  if(!ventaActual.length) return;
  jsonp({action:"registrarVenta",
    sucursal:val("ventaSucursal"),
    items:JSON.stringify(ventaActual),
    vendedor:usuario.nombre
  },()=>{
    alert("Venta realizada");
    ventaActual=[];
    pintarVenta();
    cargarInventario();
  });
}

/******** MERMAS ********/
function guardarMerma(){
  jsonp({action:"add",sheet:"mermas",
    row:JSON.stringify([
      val("mermaProducto"),
      usuario.sucursal,
      val("mermaDescripcion"),
      val("mermaCantidad"),
      new Date().toLocaleString()
    ])
  },()=>alert("Merma guardada"));
}

/******** USUARIOS ********/
function guardarUsuario(){
  jsonp({action:"add",sheet:"usuarios",
    row:JSON.stringify([
      "",
      val("uUsuario"),
      val("uPass"),
      val("uRol"),
      val("uSucursal")
    ])
  },()=>alert("Usuario agregado"));
}

/******** SUCURSALES ********/
function guardarSucursal(){
  jsonp({action:"add",sheet:"sucursales",
    row:JSON.stringify([
      val("sNombre"),
      val("sDireccion"),
      val("sTelefono")
    ])
  },()=>alert("Sucursal guardada"));
}

/******** TICKET ********/
function guardarTicket(){
  jsonp({action:"add",sheet:"ticket_config",
    row:JSON.stringify([
      val("tEmpresa"),
      val("tLeyenda")
    ])
  },()=>alert("Ticket guardado"));
}

/******** HELPERS ********/
function val(id){return document.getElementById(id).value.trim()}
function num(id){return Number(val(id)||0)}
function set(id,v){document.getElementById(id).value=v}

/******** JSONP ********/
function jsonp(p,cb){
  const c="cb"+Date.now();
  p.callback=c;
  window[c]=r=>{cb(r);delete window[c];s.remove()};
  const s=document.createElement("script");
  s.src=API+"?"+new URLSearchParams(p);
  document.body.appendChild(s);
}
