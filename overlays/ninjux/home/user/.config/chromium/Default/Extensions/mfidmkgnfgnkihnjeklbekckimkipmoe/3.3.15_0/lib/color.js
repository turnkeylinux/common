var color = {
    components: /rgba\((\d+),\s?(\d+),\s?(\d+),\s?((?:\d+\.)?\d+)\)/i,
    alphanums: '0123456789ABCDEF',

    RGBA_STR: function(obj) {
        return 'rgba(' + obj.R + ',' + obj.G + ',' + obj.B + ',' + (obj.A.toFixed(2) - 0) + ')';
    },

    RGBA_OBJ: function(str) {
        var m = str.match(color.components);
        return {
            R: parseInt(m[1], 10),
            G: parseInt(m[2], 10),
            B: parseInt(m[3], 10),
            A: parseFloat(m[4]).toFixed(2) - 0
        };
    },

    DEC_HEX: function(num) {
        return num.toString(16);
    },

    HEX_DEC: function(str) {
        return parseInt(str, 16);
    },

    HEX_OBJ: function(str) {
        var f = color.HEX_DEC;
        return {
            R: +f(str.substring(0, 2)),
            G: +f(str.substring(2, 4)),
            B: +f(str.substring(4, 6)),
            A: 1
        };
    },

    OBJ_ARR: function(r) {
        return [r.R, r.G, r.B, r.A];
    },

    HEX: function(num) {
        var n = Math.round(Math.min(Math.max(0, num), 255));
        return color.alphanums.charAt((n - n % 16) / 16) + color.alphanums.charAt(n % 16);
    },

    RGB_HEX: function(obj) {
        var f = color.HEX;
        return f(obj.R) + f(obj.G) + f(obj.B);
    },

    RGB_HSV: function(obj) {
        var M = Math.max(obj.R, obj.G, obj.B),
            delta = M - Math.min(obj.R, obj.G, obj.B),
            H, S, V;
        if (M != 0) {
            S = Math.round(delta / M * 100);
            if (obj.R === M) H = (obj.G - obj.B) / delta;
            else if (obj.G === M) H = 2 + (obj.B - obj.R) / delta;
            else if (obj.B === M) H = 4 + (obj.R - obj.G) / delta;
            H = Math.min(Math.round(H * 60), 360);
            if (H < 0) H += 360;
        }
        return {
            H: H ? H : 0,
            S: S ? S : 0,
            V: Math.round((M / 255) * 100)
        };
    },

    HSV_RGB: function(obj) {
        var H = obj.H / 360,
            S = obj.S / 100,
            V = obj.V / 100,
            R, G, B, C, D, A;
        if (S === 0) {
            R = G = B = Math.round(V * 255);
        }
        else {
            if (H >= 1) H = 0;
            H = 6 * H;
            D = H - ~~H;
            A = Math.round(255 * V * (1 - S));
            B = Math.round(255 * V * (1 - (S * D)));
            C = Math.round(255 * V * (1 - (S * (1 - D))));
            V = Math.round(255 * V);
            switch (H|0) {
            case 0:
                R = V;
                G = C;
                B = A;
                break;
            case 1:
                R = B;
                G = V;
                B = A;
                break;
            case 2:
                R = A;
                G = V;
                B = C;
                break;
            case 3:
                R = A;
                G = B;
                B = V;
                break;
            case 4:
                R = C;
                G = A;
                B = V;
                break;
            case 5:
                R = V;
                G = A;
                B = B;
                break;
            }
        }
        return {
            R: R,
            G: G,
            B: B
        };
    }
};
