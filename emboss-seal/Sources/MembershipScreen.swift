import SwiftUI

/// An ordinary iOS screen whose paper happens to be embossed.
///
/// Everything here is stock: a NavigationStack, a grouped List, LabeledContent
/// rows, a toolbar. The only unusual thing is what they are printed ON, and that
/// is deliberate. The relief is a material, in the same sense that .regularMaterial
/// is a material, so the way to show it is to put the platform's own furniture on
/// top and change nothing else. The large title collapsing into the navigation
/// bar, and the bar's blur picking up the ornament behind it, is the whole
/// argument: it is the surface, not a component sitting on one.
struct MembershipScreen: View {
    @State private var lamp = Lamp()
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            List {
                Section {
                    row("Name", "Jazlynn Kurniandra")
                    row("Member", "No. 0041")
                    row("Tier", "Founding")
                    row("Since", "17 September 2026")
                }

                Section {
                    Button { } label: {
                        Label("Show at the door", systemImage: "wave.3.right")
                    }
                    .listRowBackground(Color.white.opacity(0.32))

                    Button { } label: {
                        Label("Add to Wallet", systemImage: "wallet.bifold")
                    }
                    .listRowBackground(Color.white.opacity(0.32))
                } footer: {
                    Text(footnote)
                        .foregroundStyle(Seal.ink.opacity(0.62))
                        .padding(.top, 8)
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            // On the List, not on the NavigationStack. Put behind the stack it
            // never appears; this is the documented place for it, and because it
            // ignores the safe area the navigation bar's own blur picks the
            // ornament up as the title collapses.
            .background {
                EmbossSurface(lamp: lamp).ignoresSafeArea()
            }
            .navigationTitle("Membership")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { } label: { Image(systemName: "square.and.arrow.up") }
                }
            }
        }
        .tint(Seal.ink)
        .onAppear { lamp.start(reduceMotion: reduceMotion) }
        .onDisappear { lamp.stop() }
        .onChange(of: reduceMotion) { _, v in lamp.start(reduceMotion: v) }
    }

    private func row(_ label: String, _ value: String) -> some View {
        LabeledContent(label) {
            Text(value).foregroundStyle(Seal.ink.opacity(0.62))
        }
        .listRowBackground(Color.white.opacity(0.32))
        .foregroundStyle(Seal.ink)
    }

    private var footnote: String {
        switch lamp.source {
        case .motion:
            return "The relief is lit by the way you are holding the phone. A screenshot is one angle of light, so it cannot show you this."
        case .demo:
            return "No motion sensor here, so the light is walking round on its own. On a phone it follows how you hold it."
        case .still:
            return "Motion is reduced, so the light is holding still."
        }
    }
}
