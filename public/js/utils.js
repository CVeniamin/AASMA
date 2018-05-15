class Color {
    // Color Utilities
    static hex2rgb(h) {
        var hex = h.toString().substr(1);
        var r = parseInt(hex[0] + hex[1], 16);
        var g = parseInt(hex[2] + hex[3], 16);
        var b = parseInt(hex[4] + hex[5], 16);
        return {
            r: r,
            g: g,
            b: b
        };
    }

    static rgb2hex(rgb) {
        rgb.r |= 0;
        rgb.g |= 0;
        rgb.b |= 0;
        var r = rgb.r.toString(16);
        var g = rgb.g.toString(16);
        var b = rgb.b.toString(16);
        r = r.length == 1 ? "0" + r : r;
        g = g.length == 1 ? "0" + g : g;
        b = b.length == 1 ? "0" + b : b;
        return "#" + r.substr(0, 2) + g.substr(0, 2) + b.substr(0, 2);
    }

    static rgb2hsv(r, g, b) {
        if (r && g === undefined && b === undefined) {
            b = r.b, g = r.g, r = r.r;
        }
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;
      
        var d = max - min;
        s = max == 0 ? 0 : d / max;
      
        if (max == min) {
          h = 0; // achromatic
        } else {
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
      
          h /= 6;
        }
      
        return {  
            h: h, 
            s: s,  
            v: v 
        };

      }

    static hsv2rgb(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (h && s === undefined && v === undefined) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
        };
    }

    static hue2hex(hue) {
        var rgb = this.hsv2rgb(hue, 1, 1);
        var hex = this.rgb2hex(rgb);
        return hex;
    }

    static hex2hsv(hex){
        var rgb = this.hex2rgb(hex);
        var hsv = this.rgb2hsv(rgb);
        return hsv;
    }

    static interpolate(colorA, colorB) {
        var interpolation = -1,
            difference = Math.abs(colorA - colorB);
        if (difference > .5) {
            interpolation = (colorA > colorB ? colorA : colorB) + (1 - difference) / 2;
            if (interpolation > 1)
                interpolation -= 1;
        } else
            interpolation = (colorA + colorB) / 2;
        return interpolation;
    }

    static difference(colorA, colorB) {
    
        if (!colorA || !colorB) return;
        
        colorA = this.hex2rgb(colorA);
        colorB = this.hex2rgb(colorB);

        var perc1 = Math.round((colorA.r / 255  + colorA.g / 255 + colorA.b / 255) / 3);
        var perc2 = Math.round((colorB.r / 255  + colorB.g / 255 + colorB.b / 255) / 3);
        return Math.abs(perc1 - perc2);
    }
}