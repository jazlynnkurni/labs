import SwiftUI
import CoreMotion
import QuartzCore

/// The lamp over the sheet.
///
/// On the web this followed the pointer. There is no pointer here, so it
/// follows GRAVITY: tilt the phone and the light rakes across the relief. That
/// one substitution is the whole port, and it is the better version, because
/// now you are physically turning a plate toward a window rather than pushing a
/// cursor at one.
///
/// It travels as an ANGLE, never as a vector. Interpolating the light vector
/// from one side of the sheet to the other drags it through the middle, and a
/// light in the middle is a light directly overhead: the relief flattens out on
/// the way past. Swinging the azimuth at a fixed height is both what a lamp on
/// a stand does and the only version where the raking never lets go.
@Observable
@MainActor
final class Lamp {

    /// Upper left, which is where the light in the reference photograph was.
    static let rest = atan2(0.62, -0.62)

    /// Where the light comes from, in radians, measured across the sheet.
    private(set) var azimuth: Double = Lamp.rest

    enum Source: String { case motion, demo, still }
    private(set) var source: Source = .still

    /// The light direction the shader wants. Image space, where y counts DOWN
    /// the screen, so an azimuth of 135 degrees comes out upper left.
    var vector: SIMD2<Float> {
        SIMD2(Float(cos(azimuth) * 0.88), Float(-sin(azimuth) * 0.88))
    }

    private let motion = CMMotionManager()
    private var link: CADisplayLink?
    private var proxy: LinkProxy?
    private var want = Lamp.rest
    private var velocity = 0.0
    private var engaged = 0.0
    private var wantEngaged = 0.0
    private var last = CACurrentMediaTime()

    func start(reduceMotion: Bool) {
        stop()
        last = CACurrentMediaTime()

        if reduceMotion {
            // A light swinging off the gyroscope is motion, and someone who has
            // asked for less of it should not have to hold the phone still to
            // read a card. The relief stays lit from its resting angle.
            source = .still
        } else if motion.isDeviceMotionAvailable {
            motion.deviceMotionUpdateInterval = 1.0 / 60.0
            motion.startDeviceMotionUpdates(to: .main) { [weak self] m, _ in
                guard let self, let g = m?.gravity else { return }
                // The lamp sits on whichever side of the phone is uppermost, so
                // it is the opposite of where gravity pulls. Below a threshold
                // the phone is flat and there is no uppermost side to speak of,
                // so hold the last angle rather than letting atan2 spin.
                if hypot(g.x, g.y) > 0.07 { self.want = atan2(-g.y, -g.x) }
                self.wantEngaged = 1
            }
            source = .motion
        } else {
            // No gyroscope, which in practice means a simulator. Nothing here
            // can tilt, so the lamp walks round on its own: not a behaviour any
            // real device ever sees, just a way to watch the relief work
            // without a phone in your hand.
            source = .demo
        }

        let p = LinkProxy { [weak self] in self?.step() }
        let l = CADisplayLink(target: p, selector: #selector(LinkProxy.tick))
        l.add(to: .main, forMode: .common)
        proxy = p
        link = l
    }

    func stop() {
        link?.invalidate(); link = nil; proxy = nil
        if motion.isDeviceMotionActive { motion.stopDeviceMotionUpdates() }
    }


    private func step() {
        let now = CACurrentMediaTime()
        var dt = now - last
        last = now
        if !(dt > 0) || dt > 0.1 { dt = 1.0 / 60.0 }

        if source == .demo {
            azimuth += dt * 0.55
            if azimuth > .pi * 2 { azimuth -= .pi * 2 }
            return
        }

        engaged += (wantEngaged - engaged) * min(1, dt * 3.0)
        let goal = Lamp.rest + Lamp.wrap(want - Lamp.rest) * engaged

        // over damped, so it settles without ringing round the sheet
        let k = 26.0, c = 2 * (26.0.squareRoot()) * 0.85
        velocity += (Lamp.wrap(goal - azimuth) * k - velocity * c) * dt
        azimuth += velocity * dt
    }

    /// shortest way round, so a small move never takes the long way
    private static func wrap(_ a: Double) -> Double {
        var x = a
        while x > .pi { x -= 2 * .pi }
        while x < -.pi { x += 2 * .pi }
        return x
    }
}

private final class LinkProxy: NSObject {
    private let body: () -> Void
    init(_ body: @escaping () -> Void) { self.body = body }
    @objc func tick() { body() }
}
