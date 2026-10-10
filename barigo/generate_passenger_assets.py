import os
from PIL import Image, ImageDraw

os.makedirs("store_assets/pasajero", exist_ok=True)

# 1. Icon (512x512) for Passenger
img_icon = Image.new("RGBA", (512, 512), (15, 23, 42, 255))
draw_icon = ImageDraw.Draw(img_icon)

draw_icon.ellipse([24, 24, 488, 488], outline=(37, 99, 235, 255), width=8) # Blue accent
draw_icon.rounded_rectangle([100, 100, 412, 412], radius=40, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=4)
draw_icon.text((256, 200), "BariGo", fill=(255, 255, 255, 255), anchor="mm", font_size=58)
draw_icon.text((256, 280), "PASAJERO", fill=(37, 99, 235, 255), anchor="mm", font_size=34)
draw_icon.text((256, 340), "👤 Bariloche", fill=(148, 163, 184, 255), anchor="mm", font_size=24)
img_icon.convert("RGB").save("store_assets/pasajero/icon_512.png", "PNG")

# 2. Feature Graphic (1024x500) for Passenger
img_feat = Image.new("RGBA", (1024, 500), (15, 23, 42, 255))
draw_feat = ImageDraw.Draw(img_feat)

draw_feat.rounded_rectangle([40, 40, 984, 460], radius=24, fill=(30, 41, 59, 255), outline=(37, 99, 235, 200), width=4)
draw_feat.text((512, 160), "BariGo Pasajero", fill=(255, 255, 255, 255), anchor="mm", font_size=64)
draw_feat.text((512, 250), "Viaja seguro y cómodo por Bariloche", fill=(37, 99, 235, 255), anchor="mm", font_size=32)
draw_feat.text((512, 330), "• Pedí tu móvil  • Seguí el auto en vivo  • Tarifas claras", fill=(226, 232, 240, 255), anchor="mm", font_size=24)
img_feat.convert("RGB").save("store_assets/pasajero/feature_graphic_1024x500.png", "PNG")

# 3. Screenshot 1 (1080x1920)
img_sc1 = Image.new("RGBA", (1080, 1920), (15, 23, 42, 255))
draw_sc1 = ImageDraw.Draw(img_sc1)
draw_sc1.text((540, 160), "BariGo Pasajero", fill=(37, 99, 235, 255), anchor="mm", font_size=60)
draw_sc1.text((540, 240), "Solicitá tu viaje en segundos", fill=(255, 255, 255, 255), anchor="mm", font_size=40)
draw_sc1.rounded_rectangle([80, 360, 1000, 1780], radius=32, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=4)

draw_sc1.rounded_rectangle([120, 420, 960, 1000], radius=20, fill=(15, 23, 42, 255))
draw_sc1.text((540, 520), "🗺️ MAPA DE BARILOCHE", fill=(148, 163, 184, 255), anchor="mm", font_size=36)
draw_sc1.text((540, 620), "Tu ubicación: Centro Cívico", fill=(255, 255, 255, 255), anchor="mm", font_size=32)
draw_sc1.text((540, 720), "Destino: Cerro Catedral", fill=(245, 158, 11, 255), anchor="mm", font_size=32)
draw_sc1.text((540, 840), "Tarifa Estimada: $ 9.200", fill=(34, 197, 94, 255), anchor="mm", font_size=42)

draw_sc1.rounded_rectangle([200, 1100, 880, 1220], radius=16, fill=(37, 99, 235, 255))
draw_sc1.text((540, 1160), "SOLICITAR VIAJE AHORA", fill=(255, 255, 255, 255), anchor="mm", font_size=34)

img_sc1.convert("RGB").save("store_assets/pasajero/screenshot_1.png", "PNG")

# 4. Screenshot 2 (1080x1920)
img_sc2 = Image.new("RGBA", (1080, 1920), (15, 23, 42, 255))
draw_sc2 = ImageDraw.Draw(img_sc2)
draw_sc2.text((540, 160), "BariGo Pasajero", fill=(37, 99, 235, 255), anchor="mm", font_size=60)
draw_sc2.text((540, 240), "Seguimiento en Vivo del Móvil", fill=(255, 255, 255, 255), anchor="mm", font_size=40)
draw_sc2.rounded_rectangle([80, 360, 1000, 1780], radius=32, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=4)

draw_sc2.rounded_rectangle([120, 420, 960, 1200], radius=20, fill=(15, 23, 42, 255))
draw_sc2.text((540, 520), "🚗 Chofer asignado en camino", fill=(34, 197, 94, 255), anchor="mm", font_size=36)
draw_sc2.text((540, 640), "Carlos Gomez • Toyota Corolla", fill=(255, 255, 255, 255), anchor="mm", font_size=32)
draw_sc2.text((540, 760), "Tiempo estimado de llegada: 3 min", fill=(245, 158, 11, 255), anchor="mm", font_size=32)
draw_sc2.text((540, 900), "Avisos automáticos a 2 min, 1 min y arribo", fill=(148, 163, 184, 255), anchor="mm", font_size=26)

draw_sc2.rounded_rectangle([200, 1300, 880, 1400], radius=16, fill=(239, 68, 68, 255))
draw_sc2.text((540, 1350), "CANCELAR SOLICITUD", fill=(255, 255, 255, 255), anchor="mm", font_size=30)

img_sc2.convert("RGB").save("store_assets/pasajero/screenshot_2.png", "PNG")

print("PASSENGER STORE ASSETS GENERATED SUCCESSFULLY")
