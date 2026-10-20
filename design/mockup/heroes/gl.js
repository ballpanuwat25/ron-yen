// Small WebGL helper shared by the hero sketches: one full-screen quad, a fragment shader,
// photos uploaded as textures, and a "cover" fit so each photo fills the canvas like object-fit: cover.

export function makeGL(canvas, fragSource) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  gl.getExtension('OES_standard_derivatives');   // must be on before a shader that asks for it compiles
  const vs = `attribute vec2 p; varying vec2 vUv; void main() { vUv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
  const prog = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fragSource]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(prog, s);
  }
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uni = {};
  const u = name => uni[name] ??= gl.getUniformLocation(prog, name);
  let unit = 0;
  const textures = {};

  return {
    gl,
    set1(name, v) { gl.uniform1f(u(name), v); },
    set2(name, a, b) { gl.uniform2f(u(name), a, b); },
    set4(name, a, b, c, d) { gl.uniform4f(u(name), a, b, c, d); },
    texture(name, source, { repeat = false } = {}) {
      let entry = textures[name];
      if (!entry) { entry = textures[name] = { tex: gl.createTexture(), unit: unit++ }; }
      gl.activeTexture(gl.TEXTURE0 + entry.unit);
      gl.bindTexture(gl.TEXTURE_2D, entry.tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      gl.uniform1i(u(name), entry.unit);
    },
    // uv * scale + offset maps canvas uv to image uv for a cover fit
    cover(name, imgW, imgH) {
      const cw = canvas.width, ch = canvas.height;
      const s = Math.max(cw / imgW, ch / imgH);
      const sx = cw / (imgW * s), sy = ch / (imgH * s);
      gl.uniform4f(u(name), sx, sy, (1 - sx) / 2, (1 - sy) / 2);
    },
    resize(dpr = Math.min(2, devicePixelRatio || 1)) {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u('uRes'), canvas.width, canvas.height);
    },
    draw() { gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); },
  };
}

export function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// the tall crop on phones, the wide one elsewhere
export const photo = name => `../img/${name}-${matchMedia('(max-width: 700px)').matches ? 'tall' : 'wide'}.webp`;

export const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

export const FONTS = 'https://fonts.googleapis.com/css2?family=Noto+Serif+Thai:wght@300;500&family=Noto+Serif+Display:wght@200;300&family=Instrument+Sans:wght@400;500&display=swap';
