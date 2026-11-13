# lumen-website

The landing page for [Lumen](https://github.com/ertodebana/lumen), a small dynamically
typed programming language that is not blazingly fast.

Live at <https://lumen-lang.vercel.app>. Documentation lives at
<https://ertodebana.github.io/lumen/>.

## Develop

It is a static site: `index.html`, `style.css`, `main.js` and one 3D model. There is no
build step. Serve the folder with any static server:

```sh
python3 -m http.server 8000
```

three.js is loaded from a CDN through an import map, pinned to 0.170.0.

## Deploy

```sh
vercel deploy --prod
```

## The benchmark

The numbers on the page are recursive `fib(30)`, wall time including start-up, best of
five runs on an Intel Core i7-13700H under Linux: Rust 1.99 (`rustc -O`) 0.004 s,
Node 22 0.047 s, Python 3.14 0.084 s, Lumen 0.2 0.637 s.

## Credits

- Rocket model: "Rocket" by hat_my_guy, CC0 1.0 (public domain), from
  [Poly Pizza](https://poly.pizza/m/9awwTQWYux).
- Typefaces: Bricolage Grotesque and JetBrains Mono, via Google Fonts.
