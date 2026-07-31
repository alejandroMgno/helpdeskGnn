# Mapeo de (zona, departamento) -> (técnico_principal_id, técnico_secundario_id)
# Usa los IDs de usuario correspondientes.
# Para agregar más, simplemente añade nuevas entradas al diccionario.

TECNICOS_MAP = {
    ("Norte", "Sistemas"): {"principal": 1, "secundario": 2},
    ("Sur", "Finanzas"): {"principal": 3, "secundario": 1},
    # Añade aquí tus combinaciones reales de (Zona, Departamento)
}

def obtener_tecnicos(zona, departamento):
    return TECNICOS_MAP.get((zona, departamento), {"principal": None, "secundario": None})
