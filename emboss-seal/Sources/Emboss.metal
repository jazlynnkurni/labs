// The lighting half of the piece.
//
// The relief itself is not computed here. It is baked once, out of the WebGL
// version, and shipped as an image: how proud the paste stands at every point
// and nothing else. This shader never sees the ornament. It reads that height,
// takes its gradient, and lights it.
//
// That split is what makes the tilt worth having. Shading painted into the
// artwork holds up for exactly one angle, because a painted highlight cannot
// know which way a ridge faces. A height field can, so the lamp can move.

#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

static inline float hash21(float2 p) {
    float3 q = fract(float3(p.x, p.y, p.x) * float3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

static inline float vnoise(float2 p) {
    float2 i = floor(p), f = fract(p);
    float2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + float2(1, 0)), u.x),
               mix(hash21(i + float2(0, 1)), hash21(i + float2(1, 1)), u.x), u.y);
}

static inline float fbm(float2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return s;
}

// The sheet. Three scales, because picking one is why a single high frequency
// grain always reads as television static rather than as stock: a fine tooth
// the ink catches on, a fibre a few times coarser that gives the surface a
// direction, and a broad mottle so the whole thing is not one flat tint.
static inline float sheetAt(float2 uv, float aspect) {
    float2 ap = uv * float2(aspect, 1.0);
    float tooth  = vnoise(ap * 185.0) * 0.62 + vnoise(ap * 367.0 + 4.0) * 0.38;
    float fibre  = fbm(ap * float2(44.0, 78.0) + 11.0);
    float mottle = fbm(ap * 5.5 - 3.0);
    return tooth * 0.72 + fibre * 0.21 + mottle * 0.07;
}

// Unpack the height from the two channels it was baked across. One eight bit
// channel is not enough: the gradient of a bead terraces visibly, and since the
// whole picture IS the gradient, that banding lands on exactly what you are
// looking at.
static inline float reliefAt(texture2d<float> tex, sampler s, float2 uv) {
    float4 t = tex.sample(s, uv);
    return (t.r * 255.0 * 256.0 + t.g * 255.0) / 65535.0;
}

[[ stitchable ]] half4 embossLit(float2 pos,
                                 half4 color,
                                 float2 size,
                                 texture2d<float> relief,
                                 float3 light,   // xy azimuth on the sheet, z how raking
                                 float4 lamp,    // key, fill, ambient, sheen
                                 float4 surf,    // how proud, gloss, paper, falloff
                                 float occ,
                                 float tiles)
{
    // Repeat, not clamp. The relief is a seamless tile now, so it is a material
    // the surface is made of rather than a picture laid on top of one, and it
    // can cover any shape at any size without an edge showing.
    constexpr sampler smp(filter::linear, address::repeat);

    float2 uv = pos / size;
    float aspect = size.x / max(size.y, 1.0);

    // square tiles however tall the screen is
    float2 tuv = float2(uv.x, uv.y / aspect) * tiles;
    float2 e = 1.0 / float2(relief.get_width(), relief.get_height());

    float h = reliefAt(relief, smp, tuv);

    // Central differences. Correct here because the height field is already
    // band limited by the width of the beads: there is nothing in it sharper
    // than a pixel or two for the difference to miss.
    float hL = reliefAt(relief, smp, tuv - float2(e.x, 0.0));
    float hR = reliefAt(relief, smp, tuv + float2(e.x, 0.0));
    float hD = reliefAt(relief, smp, tuv + float2(0.0, e.y));
    float hU = reliefAt(relief, smp, tuv - float2(0.0, e.y));
    float2 g = float2(hL - hR, hD - hU) * surf.x;

    // the paper is a surface too, just a much shallower one, and it has to be
    // lit by the same lamp or the paste looks pasted on
    float sx = sheetAt(uv + float2(e.x, 0.0), aspect) - sheetAt(uv - float2(e.x, 0.0), aspect);
    float sy = sheetAt(uv + float2(0.0, e.y), aspect) - sheetAt(uv - float2(0.0, e.y), aspect);
    g += float2(-sx, sy) * surf.z * 60.0;

    float3 n = normalize(float3(g, 1.0));

    // How buried a point is: lower than the ring around it means it sits in a
    // crevice, which is where two runs cross and where the light cannot reach.
    float shade = 1.0;
    if (occ > 0.0) {
        float ring = 0.0;
        for (int i = 0; i < 8; i++) {
            float a = float(i) / 8.0 * 6.2831853;
            ring += reliefAt(relief, smp, tuv + float2(cos(a), sin(a)) * e * 9.0);
        }
        shade = 1.0 - clamp((ring / 8.0 - h) * occ, 0.0, 0.85);
    }

    float3 L = normalize(light);
    float3 V = float3(0.0, 0.0, 1.0);
    float diff = max(0.0, dot(n, L));
    // a weak fill from the opposite side, or everything facing away goes pitch
    float3 Lf = normalize(float3(-light.x, -light.y, 0.85));
    float fill = max(0.0, dot(n, Lf));
    float sheen = pow(max(0.0, dot(n, normalize(L + V))), surf.y);

    // read off the reference: the sheet is a warm grey, the paste is not white
    const float3 PAPER = float3(0.845, 0.845, 0.848);
    const float3 PAINT = float3(0.972, 0.970, 0.964);
    float paint = smoothstep(0.004, 0.055, h);
    float3 albedo = mix(PAPER, PAINT, paint);

    float3 col = albedo * (lamp.z + lamp.x * diff + lamp.y * fill) * shade;
    col += sheen * lamp.w * mix(0.35, 1.0, paint);

    // lit by a lamp, not a light box
    float v = distance(uv, float2(0.5)) * 1.41421356;
    col *= 1.0 - surf.w * v * v;

    return half4(half3(col), color.a);
}
