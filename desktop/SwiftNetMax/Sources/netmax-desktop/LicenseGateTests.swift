import Foundation
import CryptoKit

// Offline unit tests for LicenseGate (contract style mirrors HistoryStoreTests).
//
// Package.swift has a test target (netmax-desktopTests) whose SwiftHarnessTests
// wraps these `runAll()` harnesses so `swift test` and the shell harness share
// the same checks. Bodies convert 1:1 into XCTestCase methods if ever needed.
//
// Trial-hardening tests inject: a fixed hardware UUID (MachineFingerprint),
// stub VM providers, a stub TrialRegistryClient transport, an in-memory token
// store, and a test-known HMAC secret. Injectable state is save/restored.

enum LicenseGateTests {

    /// Run all checks; returns number of failures (0 == pass).
    @discardableResult
    static func runAll() -> Int {
        var failures = 0
        let now = Date()

        func freshStore() -> UserDefaults {
            let suite = "netmax.lgprobe." + UUID().uuidString
            let d = UserDefaults(suiteName: suite)!
            d.removePersistentDomain(forName: suite)
            return d
        }

        func check(_ cond: Bool, _ label: String = "") {
            if !cond {
                failures += 1
                if !label.isEmpty { print("FAIL LicenseGateTests: \(label)") }
            }
        }

        // ---- Trial hardening fixtures ----
        let testSecret = "test-secret-xyz"
        let testUUID = "TEST-UUID-0001-AAAA"
        let savedUUID = MachineFingerprint.uuidProvider
        let savedModel = VMDetector.modelProvider
        let savedHV = VMDetector.hypervisorFlagProvider
        MachineFingerprint.uuidProvider = { testUUID }
        VMDetector.modelProvider = { "MacBookPro18,3" }
        VMDetector.hypervisorFlagProvider = { false }
        defer {
            MachineFingerprint.uuidProvider = savedUUID
            VMDetector.modelProvider = savedModel
            VMDetector.hypervisorFlagProvider = savedHV
        }
        let fp = MachineFingerprint.fingerprint()!

        /// Gate whose injected window carries a VALID server token.
        func tokenGate(start: Date, end: Date,
                       registry: TrialRegistryClient? = nil) -> (LicenseGate, InMemoryTrialTokenStore) {
            let s = LicenseGate.iso(start), e = LicenseGate.iso(end)
            let store = InMemoryTrialTokenStore()
            store.save(start: s, end: e,
                       token: TrialToken.make(fingerprint: fp, start: s, end: e, secret: testSecret))
            var reg = registry ?? TrialRegistryClient()
            reg.hmacSecret = testSecret
            let g = LicenseGate(defaults: freshStore(), trialStartISO: s, trialEndISO: e,
                                trialRegistry: reg, tokenStore: store)
            return (g, store)
        }

        func stubClient(status: Int, json: [String: Any]) -> TrialRegistryClient {
            var c = TrialRegistryClient()
            c.baseURLString = "https://trial.test"
            c.hmacSecret = testSecret
            c.appVersion = "test"
            c.transport = { req in
                let data = try JSONSerialization.data(withJSONObject: json)
                let resp = HTTPURLResponse(url: req.url!, statusCode: status,
                                           httpVersion: nil, headerFields: nil)!
                return (data, resp)
            }
            return c
        }

        // ---- MachineFingerprint ----
        let fpAgain = MachineFingerprint.fingerprint()!
        check(fp == fpAgain, "fingerprint deterministic")
        check(fp.count == 64 && fp.range(of: "^[0-9a-f]{64}$", options: .regularExpression) != nil,
              "fingerprint is 64 lowercase hex")
        MachineFingerprint.uuidProvider = { "TEST-UUID-0002-BBBB" }
        let fpOther = MachineFingerprint.fingerprint()!
        check(fpOther != fp, "different UUID -> different fingerprint")
        check(!fpOther.contains("TEST-UUID"), "raw UUID never appears in fingerprint output")
        MachineFingerprint.uuidProvider = { nil }
        check(MachineFingerprint.fingerprint() == nil, "nil UUID -> nil fingerprint")
        MachineFingerprint.uuidProvider = { "   " }
        check(MachineFingerprint.fingerprint() == nil, "blank UUID -> nil fingerprint")
        MachineFingerprint.uuidProvider = { testUUID }

        // ---- VMDetector ----
        VMDetector.modelProvider = { "VMware7,1" }
        check(VMDetector.isVirtualMachine(), "vmware model flagged")
        VMDetector.modelProvider = { "VirtualBox" }
        check(VMDetector.isVirtualMachine(), "virtualbox model flagged")
        VMDetector.modelProvider = { "MacBookPro18,3" }
        VMDetector.hypervisorFlagProvider = { false }
        check(!VMDetector.isVirtualMachine(), "bare metal not flagged")
        VMDetector.hypervisorFlagProvider = { true }
        check(VMDetector.isVirtualMachine(), "hv_vmm_present flagged")
        VMDetector.hypervisorFlagProvider = { false }

        // ---- TrialToken (test-known HMAC secret) ----
        let ts = LicenseGate.iso(now), te = LicenseGate.iso(now.addingTimeInterval(14 * 86400))
        let tok = TrialToken.make(fingerprint: fp, start: ts, end: te, secret: testSecret)
        check(TrialToken.verify(token: tok, fingerprint: fp, start: ts, end: te, secret: testSecret),
              "token round-trip verifies")
        let teTampered = LicenseGate.iso(now.addingTimeInterval(15 * 86400))
        check(!TrialToken.verify(token: tok, fingerprint: fp, start: ts, end: teTampered, secret: testSecret),
              "tampered end date rejected")
        check(!TrialToken.verify(token: tok, fingerprint: "deadbeef", start: ts, end: te, secret: testSecret),
              "wrong fingerprint rejected")
        check(!TrialToken.verify(token: tok, fingerprint: fp, start: ts, end: te, secret: "wrong-secret"),
              "wrong secret rejected")
        check(!TrialToken.verify(token: tok + "00", fingerprint: fp, start: ts, end: te, secret: testSecret),
              "length-mismatched token rejected")

        // ---- Trial window: active inside, expired outside (token-bound) ----
        let (gActive, _) = tokenGate(start: now.addingTimeInterval(-3600.0),
                                     end: now.addingTimeInterval(6 * 3600.0))
        check(gActive.isTrialActive(now: now), "window math active inside")
        check(gActive.resolvedTier(now: now) == LicenseGate.Tier.Trial, "token-bound trial -> Trial")

        // Tampered window: editing the cached end breaks the token -> Free.
        gActive.trialEndsAt = LicenseGate.iso(now.addingTimeInterval(365 * 86400))
        check(!gActive.hasValidTrialToken(), "edited window invalidates token")
        check(gActive.resolvedTier(now: now) == LicenseGate.Tier.Free, "tampered window -> Free")

        let (gExpired, _) = tokenGate(start: now.addingTimeInterval(-10 * 86400.0),
                                      end: now.addingTimeInterval(-9 * 86400.0))
        check(!gExpired.isTrialActive(now: now), "window math expired outside")
        check(gExpired.resolvedTier(now: now) == LicenseGate.Tier.Free, "expired -> Free")
        check(!gExpired.canUse(LicenseGate.Feature.ScheduledReports, now: now))

        // 72h offline grace: ended 24h ago -> still Trial; ended 80h ago -> Free.
        let (gGrace, _) = tokenGate(start: now.addingTimeInterval(-16 * 86400.0),
                                    end: now.addingTimeInterval(-24 * 3600.0))
        check(gGrace.resolvedTier(now: now) == LicenseGate.Tier.Trial, "24h past end within grace -> Trial")
        let (gPastGrace, _) = tokenGate(start: now.addingTimeInterval(-20 * 86400.0),
                                        end: now.addingTimeInterval(-80 * 3600.0))
        check(gPastGrace.resolvedTier(now: now) == LicenseGate.Tier.Free, "80h past end -> Free")

        // ---- License: server-verified activation ----
        // A real Ed25519 keypair is minted in-test; the stub transport serves
        // tokens signed by it, so the offline CryptoKit path is exercised.
        let licPriv = Curve25519.Signing.PrivateKey()
        let licPubHex = licPriv.publicKey.rawRepresentation.map { String(format: "%02x", $0) }.joined()
        let licKey = "GUMROAD-TEST-KEY-001"
        let licIssued = LicenseGate.iso(now)
        func mintLicense(fp: String, key: String, issuedAt: String) -> (ks: String, token: String) {
            let ks = LicenseClient.sha256Hex(of: key)
            let sig = try! licPriv.signature(for: LicenseToken.message(fingerprint: fp, keySHA256: ks, issuedAt: issuedAt))
            return (ks, sig.map { String(format: "%02x", $0) }.joined())
        }
        func makeLicenseClient(respond: @escaping (URLRequest) throws -> (Int, [String: Any])) -> LicenseClient {
            var c = LicenseClient()
            c.baseURLString = "https://license.test"
            c.publicKeyHex = licPubHex
            c.appVersion = "test"
            c.transport = { req in
                let (st, json) = try respond(req)
                let data = try JSONSerialization.data(withJSONObject: json)
                let resp = HTTPURLResponse(url: req.url!, statusCode: st, httpVersion: nil, headerFields: nil)!
                return (data, resp)
            }
            return c
        }
        func licenseGate(respond: @escaping (URLRequest) throws -> (Int, [String: Any]),
                         defaults: UserDefaults? = nil) -> LicenseGate {
            LicenseGate(defaults: defaults ?? freshStore(),
                        licenseClient: makeLicenseClient(respond: respond),
                        tokenStore: InMemoryTrialTokenStore())
        }
        let (vKs, vTok) = mintLicense(fp: fp, key: licKey, issuedAt: licIssued)
        let validActivate: (URLRequest) throws -> (Int, [String: Any]) =
            { _ in (200, ["ok": true, "issued_at": licIssued, "key_sha256": vKs, "token": vTok]) }

        // Valid token -> Pro + bundle persisted; restored Pro offline afterwards.
        let gLic = licenseGate(respond: validActivate)
        check(gLic.activate(licKey), "valid license activates")
        check(gLic.licenseKey == licKey, "key persisted")
        check(gLic.licenseKeySHA256 == vKs && !gLic.licenseToken.isEmpty, "bundle persisted")
        check(gLic.resolvedTier(now: now) == LicenseGate.Tier.Pro, "verified license -> Pro")
        check(gLic.canUse(LicenseGate.Feature.PdfReportCard, now: now), "Pro unlocks paid features")
        var offClient = LicenseClient()
        offClient.baseURLString = "https://license.test"
        offClient.publicKeyHex = licPubHex
        offClient.transport = { _ in throw URLError(.notConnectedToInternet) }
        let gLic2 = LicenseGate(defaults: gLic.defaults, licenseClient: offClient,
                                tokenStore: InMemoryTrialTokenStore())
        check(gLic2.resolvedTier(now: now) == LicenseGate.Tier.Pro, "Pro restored offline from bundle")

        // Tampered token -> activation fails closed, nothing stored.
        var badTok = vTok
        let lastCh = badTok.removeLast()
        badTok.append(lastCh == "0" ? "1" : "0")
        let gTampered = licenseGate(respond: { _ in
            (200, ["ok": true, "issued_at": licIssued, "key_sha256": vKs, "token": badTok]) })
        check(!gTampered.activate(licKey), "tampered token rejected")
        check(gTampered.resolvedTier(now: now) == LicenseGate.Tier.Free, "tampered -> Free")
        check(gTampered.licenseKey.isEmpty, "failed activation stores nothing")

        // Wrong fingerprint -> token does not verify for this machine.
        let (wKs, wTok) = mintLicense(fp: String(repeating: "0", count: 64), key: licKey, issuedAt: licIssued)
        let gWrongFp = licenseGate(respond: { _ in
            (200, ["ok": true, "issued_at": licIssued, "key_sha256": wKs, "token": wTok]) })
        check(!gWrongFp.activate(licKey), "wrong-fingerprint token rejected")
        check(gWrongFp.resolvedTier(now: now) == LicenseGate.Tier.Free, "wrong fingerprint -> Free")

        // Seat limit + invalid key -> denied, state untouched.
        let gSeats = licenseGate(respond: { _ in (403, ["ok": false, "error": "seat_limit_reached"]) })
        check(!gSeats.activate(licKey), "seat limit denied")
        check(gSeats.licenseKey.isEmpty, "denied key not stored")
        check(gSeats.resolvedTier(now: now) == LicenseGate.Tier.Free, "seat limit -> Free")
        let gInvalid = licenseGate(respond: { _ in (403, ["ok": false, "error": "invalid_license"]) })
        check(!gInvalid.activate("nope-not-a-key"), "invalid key denied")

        // Blank key -> rejected without network.
        var netHit = false
        let gBlank = licenseGate(respond: { _ in netHit = true; throw URLError(.notConnectedToInternet) })
        check(!gBlank.activate("   "), "blank key rejected")
        check(!netHit, "blank key hits no network")

        // Placeholder public key (unconfigured build) -> fail closed, no network.
        let gPlaceholder = LicenseGate(defaults: freshStore(), tokenStore: InMemoryTrialTokenStore())
        check(!gPlaceholder.activate(licKey), "placeholder key fails closed")
        check(!gPlaceholder.hasVerifiedLicense(), "placeholder never verifies")

        // Revoked (refund/chargeback): status active=false drops Pro, key kept.
        let gRev = licenseGate(respond: { req in
            if req.url?.path.hasSuffix("/v1/license/activate") == true { return try validActivate(req) }
            return (200, ["ok": true, "active": false, "issued_at": licIssued, "reason": "refunded"])
        })
        check(gRev.activate(licKey), "revocation fixture activates")
        check(gRev.resolvedTier(now: now) == LicenseGate.Tier.Pro, "pre-revocation Pro")
        gRev.licenseVerifiedAt = LicenseGate.iso(now.addingTimeInterval(-25 * 3600))  // force re-check
        check(gRev.refreshLicenseStatus(), "revocation changed state")
        check(gRev.resolvedTier(now: now) == LicenseGate.Tier.Free, "revoked -> Free")
        check(gRev.licenseKey == licKey, "revoked key kept (non-destructive)")
        check(gRev.licenseToken.isEmpty, "revoked bundle cleared")

        // Offline / 503: the last verified state is kept.
        let gLicOff = licenseGate(respond: validActivate)
        check(gLicOff.activate(licKey))
        var offThrow = gLicOff.licenseClient
        offThrow.transport = { _ in throw URLError(.notConnectedToInternet) }
        let gOff2 = LicenseGate(defaults: gLicOff.defaults, licenseClient: offThrow,
                                tokenStore: InMemoryTrialTokenStore())
        gOff2.licenseVerifiedAt = LicenseGate.iso(now.addingTimeInterval(-25 * 3600))
        check(!gOff2.refreshLicenseStatus(), "offline changes nothing")
        check(gOff2.resolvedTier(now: now) == LicenseGate.Tier.Pro, "offline keeps last verified Pro")
        var unavail = gLicOff.licenseClient
        unavail.transport = { req in
            let data = try JSONSerialization.data(withJSONObject: ["ok": false, "error": "verification_unavailable"])
            let resp = HTTPURLResponse(url: req.url!, statusCode: 503, httpVersion: nil, headerFields: nil)!
            return (data, resp)
        }
        let g503 = LicenseGate(defaults: gLicOff.defaults, licenseClient: unavail,
                               tokenStore: InMemoryTrialTokenStore())
        g503.licenseVerifiedAt = LicenseGate.iso(now.addingTimeInterval(-25 * 3600))
        check(!g503.refreshLicenseStatus(), "503 changes nothing")
        check(g503.resolvedTier(now: now) == LicenseGate.Tier.Pro, "503 keeps last verified Pro")

        // Throttle: a fresh verification is not re-checked (no network hit).
        // (Fresh gate: earlier tests backdated licenseVerifiedAt on the shared
        // defaults, so re-activate here for a verifiedAt of right now.)
        let gThrBase = licenseGate(respond: validActivate)
        check(gThrBase.activate(licKey), "throttle fixture activates")
        var thrHit = false
        var thrClient = gThrBase.licenseClient
        thrClient.transport = { _ in thrHit = true; throw URLError(.notConnectedToInternet) }
        let gThr = LicenseGate(defaults: gThrBase.defaults, licenseClient: thrClient,
                               tokenStore: InMemoryTrialTokenStore())
        check(!gThr.refreshLicenseStatus(), "fresh verification throttles re-check")
        check(!thrHit, "throttled re-check hits no network")

        // H8: a fresh gate with no stored trial is Free (no auto-stamp);
        // startTrial now requires a server activation.
        let gFresh = LicenseGate(defaults: freshStore())
        check(gFresh.trialStartedAt.isEmpty && gFresh.trialEndsAt.isEmpty)
        check(!gFresh.isTrialActive(now: now))
        check(gFresh.resolvedTier(now: now) == LicenseGate.Tier.Free)

        // Server-allowed activation: server window stamped, token cached, Trial.
        let aStart = LicenseGate.iso(now), aEnd = LicenseGate.iso(now.addingTimeInterval(14 * 86400))
        let aTok = TrialToken.make(fingerprint: fp, start: aStart, end: aEnd, secret: testSecret)
        let allowedJSON: [String: Any] = ["ok": true, "trial_start": aStart, "trial_end": aEnd, "token": aTok]
        let gAct = LicenseGate(defaults: freshStore(),
                               trialRegistry: stubClient(status: 200, json: allowedJSON),
                               tokenStore: InMemoryTrialTokenStore())
        gAct.startTrial(now: now)
        check(gAct.trialStartedAt == aStart && gAct.trialEndsAt == aEnd, "server window stamped")
        check(gAct.hasValidTrialToken(), "token cached and valid")
        check(gAct.isTrialActive(now: now))
        check(gAct.resolvedTier(now: now) == LicenseGate.Tier.Trial)
        let stampedStart = gAct.trialStartedAt
        gAct.startTrial(now: now.addingTimeInterval(60))
        check(gAct.trialStartedAt == stampedStart, "second startTrial is a no-op")

        // Server-denied (already consumed): stays Free, denial latched, no-op after.
        let gDenied = LicenseGate(defaults: freshStore(),
                                  trialRegistry: stubClient(status: 403, json: ["ok": false, "error": "trial_already_consumed"]),
                                  tokenStore: InMemoryTrialTokenStore())
        gDenied.startTrial(now: now)
        check(gDenied.trialStartedAt.isEmpty, "denied: no window stamped")
        check(gDenied.trialDenialReason == TrialDenialReason.alreadyConsumed.rawValue, "denial reason latched")
        check(gDenied.resolvedTier(now: now) == LicenseGate.Tier.Free, "denied -> Free")
        check(LicenseGate.trialDenialMessage(for: gDenied.trialDenialReason) != nil, "denial has UI copy")
        gDenied.startTrial(now: now)
        check(gDenied.resolvedTier(now: now) == LicenseGate.Tier.Free, "denied: retry is a no-op")

        // Server-denied (VM): stays Free with the VM reason.
        let gVM = LicenseGate(defaults: freshStore(),
                              trialRegistry: stubClient(status: 403, json: ["ok": false, "error": "vm_not_allowed"]),
                              tokenStore: InMemoryTrialTokenStore())
        gVM.startTrial(now: now)
        check(gVM.trialDenialReason == TrialDenialReason.vmNotAllowed.rawValue, "VM denial reason latched")
        check(gVM.resolvedTier(now: now) == LicenseGate.Tier.Free, "VM denied -> Free")

        // Offline: stays Free, needs-connection flagged (non-destructive).
        var cOff = TrialRegistryClient()
        cOff.baseURLString = "https://trial.test"
        cOff.hmacSecret = testSecret
        cOff.transport = { _ in throw URLError(.notConnectedToInternet) }
        let gOff = LicenseGate(defaults: freshStore(), trialRegistry: cOff,
                               tokenStore: InMemoryTrialTokenStore())
        gOff.startTrial(now: now)
        check(gOff.resolvedTier(now: now) == LicenseGate.Tier.Free, "offline -> Free")
        check(gOff.trialNeedsConnection, "offline flags needs-connection")
        check(gOff.trialStartedAt.isEmpty, "offline stamps nothing")

        // Unconfigured server (placeholder host): fail-closed, no network.
        // (Explicit placeholder: the default client now points at the deployed
        // worker, so the default would hit the real network here.)
        var uncfgReg = TrialRegistryClient()
        uncfgReg.baseURLString = "https://REPLACE-WITH-REGISTRY-HOST"
        let gUncfg = LicenseGate(defaults: freshStore(),
                                 trialRegistry: uncfgReg,
                                 tokenStore: InMemoryTrialTokenStore())
        gUncfg.startTrial(now: now)
        check(gUncfg.trialNeedsConnection, "placeholder host -> needs-connection")
        check(gUncfg.resolvedTier(now: now) == LicenseGate.Tier.Free)

        // Revalidation: server reports unknown -> local window dropped (non-destructive).
        let (gReval, revalStore) = tokenGate(start: now.addingTimeInterval(-3600.0),
                                            end: now.addingTimeInterval(6 * 3600.0))
        // tokenGate injects the window via init (never persisted by design);
        // simulate the persisted production state explicitly:
        gReval.defaults.set(gReval.trialStartedAt, forKey: LicenseGate.Keys.trialStarted)
        gReval.defaults.set(gReval.trialEndsAt, forKey: LicenseGate.Keys.trialEnds)
        var revalReg = TrialRegistryClient()
        revalReg.baseURLString = "https://trial.test"
        revalReg.hmacSecret = testSecret
        revalReg.transport = { req in
            let data = try JSONSerialization.data(withJSONObject: ["ok": false, "error": "unknown_fingerprint"])
            let resp = HTTPURLResponse(url: req.url!, statusCode: 404, httpVersion: nil, headerFields: nil)!
            return (data, resp)
        }
        let gReval2 = LicenseGate(defaults: gReval.defaults, trialRegistry: revalReg, tokenStore: revalStore)
        check(gReval2.resolvedTier(now: now) == LicenseGate.Tier.Trial, "pre-revalidation Trial")
        check(gReval2.revalidateTrial(), "revalidation changed state")
        check(gReval2.trialStartedAt.isEmpty, "unknown fp -> window dropped")
        check(revalStore.load() == nil, "unknown fp -> token cleared")
        check(gReval2.resolvedTier(now: now) == LicenseGate.Tier.Free, "post-revalidation Free")

        // Legacy migration: a cached window with no token is dropped at init.
        let legacyDefaults = freshStore()
        legacyDefaults.set(LicenseGate.iso(now.addingTimeInterval(-3600.0)), forKey: LicenseGate.Keys.trialStarted)
        legacyDefaults.set(LicenseGate.iso(now.addingTimeInterval(6 * 3600.0)), forKey: LicenseGate.Keys.trialEnds)
        let gLegacy = LicenseGate(defaults: legacyDefaults,
                                  trialRegistry: stubClient(status: 200, json: allowedJSON),
                                  tokenStore: InMemoryTrialTokenStore())
        check(gLegacy.trialStartedAt.isEmpty, "legacy window migrated away")
        check(gLegacy.resolvedTier(now: now) == LicenseGate.Tier.Free, "legacy -> Free until server trial")
        gLegacy.startTrial(now: now)
        check(gLegacy.resolvedTier(now: now) == LicenseGate.Tier.Trial, "legacy owner gets one server trial")

        return failures
    }
}
