#!/usr/bin/env python3
import zlib
import struct
import math

def create_png(width, height, draw_func, filename):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    # PNG signature
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png.extend(struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT chunk
    compressed = zlib.compress(bytes(raw_data), 9)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png.extend(struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc))
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

def icon_pixel(x, y, w, h, maskable=False):
    # Normalized coords -1 to 1
    nx = (x - w / 2) / (w / 2)
    ny = (y - h / 2) / (h / 2)
    dist = math.sqrt(nx*nx + ny*ny)
    
    # Background: vibrant comforting emerald-teal gradient with deep indigo accents
    # (#0f766e to #0369a1)
    t = (ny + 1) / 2.0
    bg_r = int(14 + (2 - 14) * t)
    bg_g = int(116 + (132 - 116) * t)
    bg_b = int(144 + (199 - 144) * t)
    
    if not maskable and dist > 0.96:
        return (0, 0, 0, 0) # transparent rounded
    
    # Outer circle shield highlight
    scale = 0.65 if maskable else 0.75
    scaled_dist = dist / scale
    
    # Shield shape or hour-clock shape
    # Center shield:
    in_shield = False
    sx = nx / scale
    sy = ny / scale
    
    # Cute shield / star heart combination:
    if abs(sx) < 0.7 and sy > -0.6 and sy < 0.3 + 0.4 * (1 - (sx/0.7)**2):
        in_shield = True
        
    if in_shield:
        # Crisp inner white/warm gold
        # Draw cute clock / smiling hourglass symbol
        clock_dist = math.sqrt(sx*sx + (sy+0.05)*(sy+0.05))
        if clock_dist < 0.5:
            # Clock dial (clean white)
            if clock_dist > 0.44:
                return (255, 255, 255, 255)
            # Clock hands (emerald 10:10 position)
            angle = math.atan2(sy + 0.05, sx)
            # Hour hand to 10: -2.35 rad, minute hand to 2: -0.78 rad
            if (abs(angle - (-2.35)) < 0.2 and clock_dist < 0.35) or (abs(angle - (-0.78)) < 0.15 and clock_dist < 0.4):
                return (15, 118, 110, 255)
            # Center dot
            if clock_dist < 0.07:
                return (15, 118, 110, 255)
            return (248, 250, 252, 255)
        return (255, 255, 255, 230)
    
    return (bg_r, bg_g, bg_b, 255)

if __name__ == '__main__':
    create_png(192, 192, lambda x,y,w,h: icon_pixel(x,y,w,h, False), 'public/pwa-192x192.png')
    create_png(512, 512, lambda x,y,w,h: icon_pixel(x,y,w,h, False), 'public/pwa-512x512.png')
    create_png(512, 512, lambda x,y,w,h: icon_pixel(x,y,w,h, True), 'public/pwa-maskable-512x512.png')
    create_png(180, 180, lambda x,y,w,h: icon_pixel(x,y,w,h, False), 'public/apple-touch-icon.png')
