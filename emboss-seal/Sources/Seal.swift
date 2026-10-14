import SwiftUI

/// The settings the piece was tuned to, held in one place. These are the
/// numbers off the web version's panel, unchanged.
enum Seal {
    static let proud: Float     = 9      // how far the gradient is pushed
    static let raking: Float    = 0.3    // how low the lamp sits
    static let key: Float       = 0.52
    static let fill: Float      = 0.27
    static let ambient: Float   = 0.62
    static let sheen: Float     = 0.4
    static let gloss: Float     = 30
    static let crevices: Float  = 0      // the occlusion term, off in this look
    static let paper: Float     = 0.04
    static let falloff: Float   = 0.12

    static let ink = Color(red: 0.16, green: 0.155, blue: 0.145)
}
