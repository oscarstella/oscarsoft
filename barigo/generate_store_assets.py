import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs("store_assets", exist_ok=True)

# 1. App Icon (512x512)
img_icon = Image.new("RGBA", (512, 512), (15, 23, 42, 255)) # Dark navy
draw_icon = ImageDraw.Draw(img_icon)

# Outer circle accent
draw_icon.ellipse([24, 24, 488, 488], outline=(245, 158, 11, 255), width=8)

# Center graphic
draw_icon.rounded_rectangle([100, 100, 412, 412], radius=40, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=4)
draw_icon.text((256, 200), "BariGo", fill=(255, 255, 255, 255), anchor="mm", font_size=58)
draw_icon.text((256, 280), "CHOFER", fill=(245, 158, 11, 255), anchor="mm", font_size=36)
draw_icon.text((256, 340), "🚗 Bariloche", fill=(148, 163, 184, 255), anchor="mm", font_size=24)
img_icon.convert("RGB").save("store_assets/icon_512.png", "PNG")

# 2. Feature Graphic (1024x500)
img_feat = Image.new("RGBA", (1024, 500), (15, 23, 42, 255))
draw_feat = ImageDraw.Draw(img_feat)

# Gradient / Card shape
draw_feat.rounded_rectangle([40, 40, 984, 460], radius=24, fill=(30, 41, 59, 255), outline=(245, 158, 11, 200), width=4)
draw_feat.text((512, 160), "BariGo Chofer", fill=(255, 255, 255, 255), anchor="mm", font_size=64)
draw_feat.text((512, 250), "La mejor app de movilidad en Bariloche", fill=(245, 158, 11, 255), anchor="mm", font_size=32)
draw_feat.text((512, 330), "• Viajes en Tiempo Real  • Navegación GPS  • Cobros Directos", fill=(226, 232, 240, 255), anchor="mm", font_size=24)
img_feat.convert("RGB").save("store_assets/feature_graphic_1024x500.png", "PNG")

# 3. Screenshot 1 (1080x1920)
img_sc1 = Image.new("RGBA", (1080, 1920), (15, 23, 42, 255))
draw_sc1 = ImageDraw.Draw(img_sc1)
draw_sc1.text((540, 160), "BariGo Chofer", fill=(245, 158, 11, 255), anchor="mm", font_size=60)
draw_sc1.text((540, 240), "Panel Principal del Conductor", fill=(255, 255, 255, 255), anchor="mm", font_size=40)
draw_sc1.rounded_rectangle([80, 360, 1000, 1780], radius=32, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=4)

draw_sc1.rounded_rectangle([120, 420, 960, 720], radius=20, fill=(15, 23, 42, 255))
draw_sc1.text((540, 510), "ESTADO: DISPONIBLE", fill=(34, 197, 94, 255), anchor="mm", font_size=36)
draw_sc1.text((540, 610), "Esperando solicitudes cercanas en Bariloche...", fill=(148, 163, 184, 255), anchor="mm", font_size=28)

draw_sc1.rounded_rectangle([120, 780, 960, 1400], radius=20, fill=(24, 34, 49, 255), outline=(245, 158, 11, 150), width=3)
draw_sc1.text((540, 860), "NUEVA OFERTA DE VIAJE", fill=(245, 158, 11, 255), anchor="mm", font_size=38)
draw_sc1.text((540, 960), "Origen: Centro Cívico", fill=(255, 255, 255, 255), anchor="mm", font_size=32)
draw_sc1.text((540, 1040), "Destino: Av. Bustillo Km 8.5", fill=(255, 255, 255, 255), anchor="mm", font_size=32)
draw_sc1.text((540, 1140), "Tarifa Estimada: $ 8.500", fill=(34, 197, 94, 255), anchor="mm", font_size=42)
draw_sc1.rounded_rectangle([200, 1240, 880, 1340], radius=16, fill=(34, 197, 94, 255))
draw_sc1.text((540, 1290), "ACEPTAR VIAJE", fill=(255, 255, 255, 255), anchor="mm", font_size=34)

img_sc1.convert("RGB").save("store_assets/screenshot_1.png", "PNG")

# 4. Screenshot 2 (1080x1920)
img_sc2 = Image.new("RGBA", (1080, 1920), (15, 23, 42, 255))
draw_sc2 = ImageDraw.Draw(img_sc2)
draw_sc2.text((540, 160), "BariGo Chofer", fill=(245, 158, 11, 255), anchor="mm", font_size=60)
draw_sc2.text((540, 240), "Viaje Activo y Navegación GPS", fill=(255, 255, 255, 255), anchor="mm", font_size=40)
draw_sc2.rounded_rectangle([80, 360, 1000, 1780], radius=32, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=4)

draw_sc2.rounded_rectangle([120, 420, 960, 1300], radius=20, fill=(15, 23, 42, 255))
draw_sc2.text((540, 780), "🗺️ MAPA DE BARILOCHE EN VIVO", fill=(148, 163, 184, 255), anchor="mm", font_size=36)
draw_sc2.text((540, 860), "Ruta trazada hacia el pasajero", fill=(245, 158, 11, 255), anchor="mm", font_size=30)
draw_sc2.text((540, 960), "Llegada estimada: 4 min", fill=(255, 255, 255, 255), anchor="mm", font_size=36)

draw_sc2.rounded_rectangle([120, 1360, 960, 1720], radius=20, fill=(24, 34, 49, 255))
draw_sc2.text((540, 1440), "Pasajero: Juan Pérez", fill=(255, 255, 255, 255), anchor="mm", font_size=34)
draw_sc2.text((540, 1520), "Avisos de proximidad enviados automáticamente", fill=(148, 163, 184, 255), anchor="mm", font_size=26)
draw_sc2.rounded_rectangle([200, 1590, 880, 1680], radius=16, fill=(239, 68, 68, 255))
draw_sc2.text((540, 1635), "CANCELAR VIAJE", fill=(255, 255, 255, 255), anchor="mm", font_size=30)

img_sc2.convert("RGB").save("store_assets/screenshot_2.png", "PNG")

print("STORE ASSETS REGENERATED WITHOUT 'OFICIAL'")
