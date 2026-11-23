// Dirección donde corre tu servidor FastAPI
const API = "http://127.0.0.1:8000";

// Pide datos a la API y devuelve el JSON
export async function pedir(ruta) {
  const respuesta = await fetch(`${API}${ruta}`);
  if (!respuesta.ok) {
    throw new Error(`La API respondió con error ${respuesta.status}`);
  }
  return respuesta.json();
}