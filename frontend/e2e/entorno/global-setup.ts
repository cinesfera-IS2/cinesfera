// La base de los tests arranca vacía: acá se cargan los datos que algunos
// casos necesitan que ya existan antes de empezar.

import { crearUsuario, USUARIO_EXISTENTE } from "./datos";

export default async function globalSetup() {
  await crearUsuario(USUARIO_EXISTENTE);
}
