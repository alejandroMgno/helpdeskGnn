import os
from PIL import Image
import io

def compress_image(file_content, output_path, quality=85):
    """
    Comprime una imagen y la guarda en la ruta especificada.
    """
    try:
        img = Image.open(io.BytesIO(file_content))
        # Convertir a RGB si es necesario (ej. PNG con transparencia a JPG o similar)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Guardar comprimido
        img.save(output_path, "JPEG", quality=quality, optimize=True)
        return True
    except Exception as e:
        print(f"Error comprimiendo imagen: {e}")
        return False
