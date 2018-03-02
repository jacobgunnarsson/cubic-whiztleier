// See http://brunch.io for documentation.
exports.files = {
  javascripts: {
    joinTo: {
      'vendor.js': /^(?!app)/, // Files that are not in `app` dir.
      'app.js': /^app/
    }
  },
  stylesheets: {
    joinTo: 'style.css',
  },
};

exports.plugins = {
  babel: { presets: ['latest'] },
  plugins: {
    sass: {
      mode: 'ruby' // set to 'native' to force libsass
    },
  },
};
