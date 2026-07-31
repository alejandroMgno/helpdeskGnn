from fpdf import FPDF
import base64
import os
import tempfile
from datetime import datetime

class PDFResguardoPro(FPDF):
    def __init__(self, datos):
        super().__init__()
        self.datos = datos
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        # Professional header
        self.set_font("Arial", 'B', 14)
        self.cell(0, 10, "GAS NATURAL DEL NOROESTE S.A. DE C.V.", ln=True, align='C')
        self.set_font("Arial", '', 10)
        self.cell(0, 5, "C. Juan F. Brittingham 311, Cd Industrial, 27019 Torreón, Coah.", ln=True, align='C')
        self.cell(0, 5, "Departamento de Sistemas y Tecnologías de Información", ln=True, align='C')
        self.ln(5)

    def footer(self):
        self.set_y(-25)
        self.set_font("Arial", 'I', 8)
        self.multi_cell(0, 4, "Este documento constituye un acuerdo de responsabilidad sobre el uso de activos informáticos propiedad de Gas Natural del Noroeste. El uso inadecuado o no autorizado será sancionado conforme a los reglamentos internos de la empresa.", align='C')
        self.set_y(-15)
        self.cell(0, 10, f'Página {self.page_no()}', align='C')

    def generar_documento(self, firma_recibe=None):
        self.add_page()

        # Date and Location
        self.set_font("Arial", '', 10)
        self.cell(0, 5, f"Torreón, Coahuila, a {self.datos.get('fecha_larga', '')}.", ln=True, align='R')
        self.ln(5)

        # Body
        self.set_font("Arial", '', 11)
        intro = (
            "Por medio de la presente, yo " + self.datos.get('recibe_nombre', '________________') + 
            ", con número de empleado/identificador, manifiesto recibir de conformidad el equipo de cómputo y/o periféricos "
            "que se detallan a continuación, propiedad de GAS NATURAL DEL NOROESTE S.A. DE C.V., para el desempeño exclusivo de mis funciones laborales."
        )
        self.multi_cell(0, 6, intro, align='J')
        self.ln(5)

        # Equipment details
        self.set_font("Arial", 'B', 10)
        self.set_fill_color(240, 240, 240)
        self.cell(60, 8, "Categoría", border=1, fill=True)
        self.cell(60, 8, "Marca / Modelo", border=1, fill=True)
        self.cell(70, 8, "N° Serie / ID", border=1, fill=True, ln=True)

        self.set_font("Arial", '', 10)
        self.cell(60, 8, self.datos.get('tipo', 'N/A'), border=1)
        self.cell(60, 8, self.datos.get('equipo', 'N/A'), border=1)
        self.cell(70, 8, self.datos.get('serie', 'N/A'), border=1, ln=True)
        self.ln(5)

        # Liability clauses
        self.set_font("Arial", 'B', 10)
        self.cell(0, 8, "CLAUSULADO DE RESPONSABILIDAD Y SEGURIDAD DE LA INFORMACIÓN:", ln=True)
        self.set_font("Arial", '', 9)
        clauses = [
            "1. El usuario se compromete a mantener el equipo en óptimas condiciones y reportar cualquier falla de inmediato al departamento de TI.",
            "2. El usuario es responsable de la seguridad de la información almacenada en el equipo, cumpliendo con las políticas de ciberseguridad vigentes de la empresa.",
            "3. Queda estrictamente prohibido el uso de los equipos para fines personales, la instalación de software no autorizado o la alteración física de los componentes.",
            "4. En caso de terminación laboral o cambio de puesto, el equipo deberá ser entregado en las mismas condiciones en que se recibió.",
            "5. El usuario autoriza a GNN a realizar auditorías sobre el uso del equipo y el cumplimiento de las políticas de seguridad."
        ]
        for clause in clauses:
            self.multi_cell(0, 4, clause)
            self.ln(1)

        self.ln(10)

        # Signatures
        self.set_font("Arial", 'B', 10)
        self.cell(95, 5, "Dirección de Sistemas", align='C')
        self.cell(95, 5, "Colaborador / Receptor", align='C', ln=True)

        self.ln(15)

        x_start = self.get_x()
        y_start = self.get_y()
        self.line(35, y_start, 85, y_start)
        self.line(125, y_start, 175, y_start)

        self.set_xy(35, y_start + 2)
        self.cell(50, 5, "Emisor y Validador", align='C')
        self.set_xy(125, y_start + 2)
        self.cell(50, 5, self.datos.get('recibe_nombre', ''), align='C')

        if firma_recibe:
            self._insertar_firma_base64(firma_recibe, 125, y_start - 20)

    def _insertar_firma_base64(self, firma_b64, x, y):
        try:
            if "base64," in firma_b64:
                firma_b64 = firma_b64.split("base64,")[1]
            img_data = base64.b64decode(firma_b64)

            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_img:
                temp_img.write(img_data)
                temp_img_path = temp_img.name

            self.image(temp_img_path, x=x+5, y=y, w=40, h=20)
            os.remove(temp_img_path)
        except Exception:
            pass

def generar_pdf_resguardo(activo_id, activo_nombre, activo_codigo, usuario_nombre, fecha, firma_base64=None):
    datos = {
        'equipo': activo_nombre,
        'serie': activo_codigo, 
        'fecha_larga': fecha,
        'recibe_nombre': usuario_nombre,
        'tipo': 'Equipo de Cómputo'
    }

    pdf = PDFResguardoPro(datos)
    pdf.generar_documento(firma_recibe=firma_base64)

    # Setup directory and keep only last 3 files
    directorio_resguardos = f"uploads/resguardos/{activo_id}"
    os.makedirs(directorio_resguardos, exist_ok=True)

    # Cleanup: keep only 2 older files, this will be the 3rd
    archivos = [os.path.join(directorio_resguardos, f) for f in os.listdir(directorio_resguardos) if f.endswith('.pdf')]
    archivos.sort(key=os.path.getmtime)
    while len(archivos) >= 3:
        os.remove(archivos.pop(0))

    nombre_archivo = f"resguardo_{activo_codigo}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.pdf"
    ruta_archivo = os.path.join(directorio_resguardos, nombre_archivo)
    pdf.output(ruta_archivo)

    return ruta_archivo