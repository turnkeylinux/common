var regexp = {
    meta: /([.*:;'"!@#$%^&?\-+=<>\\\/~`|(){}\[\]])/g,
    metachars: /(\\[bcdfnrtvsw])/ig,
    enc: /^\/.*\/$/,

    escape: function(s) {
        return s.replace(regexp.meta, '\\$1').replace(regexp.metachars, '\\\\$1');
    },

    test: function(s) {
        return regexp.enc.test(s);
    },

    format: function(s) {
        return regexp.test(s) ?
            s.substr(1, s.length - 2) : (/\*/.test(s) ?
                s.split('*').map(regexp.escape).join('(.*?)') : regexp.escape(s));
    },

    create: function(s) {
        return new RegExp(regexp.format(s));
    }
};
