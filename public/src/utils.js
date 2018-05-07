class Color{
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
        var rgb = Tribe.hsv2rgb(hue, 1, 1);
        var hex = Tribe.rgb2hex(rgb);
        return hex;
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
}