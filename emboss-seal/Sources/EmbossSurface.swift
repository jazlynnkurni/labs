import SwiftUI

/// The material the screen is printed on.
///
/// Not a card, not a panel, not a picture of a pattern: a surface that fills
/// whatever it is put behind and is lit by the phone's own attitude. Stock
/// controls sit on top of it exactly as they would sit on any other background,
/// which is the point. The relief is the app's paper, not a widget in a frame.
struct EmbossSurface: View {
    let lamp: Lamp
    /// how many tiles across the width. Larger is a finer, quieter grain.
    var tiles: Float = 1.35

    var body: some View {
        GeometryReader { geo in
            let v = lamp.vector
            Rectangle()
                .fill(.white)
                .colorEffect(
                    ShaderLibrary.embossLit(
                        .float2(geo.size),
                        .image(Image("tile")),
                        .float3(v.x, v.y, Seal.raking),
                        .float4(Seal.key, Seal.fill, Seal.ambient, Seal.sheen),
                        .float4(Seal.proud, Seal.gloss, Seal.paper, Seal.falloff),
                        .float(Seal.crevices),
                        .float(tiles)
                    )
                )
        }
    }
}
