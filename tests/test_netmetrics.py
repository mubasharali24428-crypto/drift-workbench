"""Offline tests for netmetrics — subprocess.run is always faked.

Follows tests/conftest.py: the autouse `offline_guarantee` fixture arms a
tripwire on subprocess.run; each test installs its own fake via
monkeypatch.setattr, which implicitly disarms the tripwire for that test only.
"""

from __future__ import annotations

import subprocess
import sys

import pytest

import netmax
import netmetrics


def fake_run(stdout="", stderr="", returncode=0):
    def _run(cmd, **kwargs):
        return subprocess.CompletedProcess(cmd, returncode, stdout, stderr)
    return _run


@pytest.fixture(autouse=True)
def _clean_wifi_cache():
    """Wi-Fi scan cache must not leak between tests."""
    netmetrics._reset_wifi_cache()
    yield
    netmetrics._reset_wifi_cache()


# ── packet_loss ──────────────────────────────────────────────────────────────

LOSS_OK = (
    "64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=10.1 ms\n"
    "--- 1.1.1.1 ping statistics ---\n"
    "5 packets transmitted, 5 packets received, 0.0% packet loss\n"
)


def test_packet_loss_parses_stdout(monkeypatch):
    monkeypatch.setattr(subprocess, "run", fake_run(stdout=LOSS_OK))
    assert netmetrics.packet_loss() == 0.0


def test_packet_loss_fractional(monkeypatch):
    out = LOSS_OK.replace("0.0% packet loss", "12.5% packet loss")
    monkeypatch.setattr(subprocess, "run", fake_run(stdout=out))
    assert netmetrics.packet_loss(host="8.8.8.8") == 12.5


def test_packet_loss_ignores_exit_code_100pct(monkeypatch):
    # Host blocks ICMP: non-zero exit but stdout still has the stats block.
    monkeypatch.setattr(
        subprocess, "run",
        fake_run(returncode=2,
                 stdout="10 packets transmitted, 0 received, 100.0% packet loss"),
    )
    assert netmetrics.packet_loss() == 100.0


def test_packet_loss_no_stats_raises(monkeypatch):
    monkeypatch.setattr(
        subprocess, "run",
        fake_run(stderr="ping: cannot resolve example.invalid: Unknown host",
                 returncode=68),
    )
    with pytest.raises(netmax.NetMaxError):
        netmetrics.packet_loss()


# ── jitter_ms ────────────────────────────────────────────────────────────────

REPLIES = "".join(f"64 bytes from 1.1.1.1: icmp_seq={i} ttl=57 time={t} ms\n"
                  for i, t in enumerate([140.0, 150.0, 145.0]))


def test_jitter_mean_abs_delta(monkeypatch):
    monkeypatch.setattr(subprocess, "run", fake_run(stdout=REPLIES))
    # deltas: 10, 5 → mean 7.5
    assert netmetrics.jitter_ms() == pytest.approx(7.5)


def test_jitter_skips_lt_0_1ms_lines(monkeypatch):
    out = REPLIES + "64 bytes from localhost: icmp_seq=3 ttl=64 time<0.1 ms\n"
    monkeypatch.setattr(subprocess, "run", fake_run(stdout=out))
    assert netmetrics.jitter_ms() == pytest.approx(7.5)  # unchanged by bad line


def test_jitter_fewer_than_two_samples_raises(monkeypatch):
    one = "64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=10.0 ms\n"
    monkeypatch.setattr(subprocess, "run", fake_run(stdout=one))
    with pytest.raises(netmax.NetMaxError):
        netmetrics.jitter_ms()


# ── wifi_info ────────────────────────────────────────────────────────────────

WIFI_JSON = """{
  "SPAirPortDataType": [{
    "spairport_current_network_information": {
      "HomeNet": {
        "_name": "HomeNet",
        "spairport_network_phymode": "802.11n",
        "spairport_signal_or_noise": "-31 dBm / -97 dBm",
        "spairport_current_channel": "13 (2GHz, 20MHz)"
      }
    }
  }]
}"""


def test_wifi_info_json_path(monkeypatch):
    monkeypatch.setattr(subprocess, "run", fake_run(stdout=WIFI_JSON))
    info = netmetrics.wifi_info()
    assert info["rssi_dbm"] == -31
    assert info["noise_dbm"] == -97
    assert info["channel"] == "13"


def test_wifi_info_plaintext_fallback(monkeypatch):
    calls = []

    def _run(cmd, **kwargs):
        calls.append(cmd)
        if "-json" in cmd:
            return subprocess.CompletedProcess(cmd, 0, "{}", "")
        return subprocess.CompletedProcess(cmd, 0, (
            "Current Network Information:\n"
            "    HomeNet:\n"
            "      PHY Mode: 802.11n\n"
            "      Channel: 149 (5GHz, 80MHz)\n"
            "      Signal / Noise: -52 dBm / -88 dBm\n"
        ), "")

    monkeypatch.setattr(subprocess, "run", _run)
    info = netmetrics.wifi_info()
    assert info == {"rssi_dbm": -52, "noise_dbm": -88, "channel": "149"}
    assert any("-json" in c for c in calls)  # tried JSON first


def test_wifi_info_offline_raises(monkeypatch):
    monkeypatch.setattr(subprocess, "run", fake_run(stdout="{}"))
    with pytest.raises(netmax.NetMaxError):
        netmetrics.wifi_info()


def test_wifi_info_second_call_within_ttl_spawns_nothing(monkeypatch):
    """Repeat scan inside 10 s costs zero system_profiler spawns."""
    calls = []
    monkeypatch.setattr(
        subprocess, "run",
        lambda cmd, **kw: (calls.append(cmd),
                           subprocess.CompletedProcess(cmd, 0, WIFI_JSON, ""))[1])
    first = netmetrics.wifi_info()
    assert len(calls) == 1  # JSON path succeeds on first spawn
    second = netmetrics.wifi_info()
    assert second == first and len(calls) == 1


def test_wifi_info_profiler_failure_raises(monkeypatch):
    monkeypatch.setattr(subprocess, "run",
                        fake_run(stderr="error", returncode=1))
    with pytest.raises(netmax.NetMaxError):
        netmetrics.wifi_info()


# ── path / http / portal / ipv6 / mtu probes ───────────────────────────────
# Fixtures below were captured from real macOS runs (traceroute 1.1.1.1,
# curl -w, ping -D), not invented.

TRACE_ERR = "traceroute to 1.1.1.1 (1.1.1.1), 10 hops max, 40 byte packets\n"
TRACE_OUT = (
    " 1  172.17.0.2  34.252 ms\n"
    " 2  192.168.5.46  4.487 ms\n"
    " 3  *\n"
    " 4  10.19.102.53  7.495 ms\n"
    "10  1.1.1.1  21.505 ms\n"
)


def recording_run(*outputs):
    """subprocess.run fake that returns each (stdout, stderr) in turn and logs argv."""
    calls = []
    queue = list(outputs)

    def _run(cmd, **kwargs):
        calls.append(cmd)
        out, err = queue.pop(0) if len(queue) > 1 else queue[0]
        return subprocess.CompletedProcess(cmd, 0, out, err)
    _run.calls = calls
    return _run


def test_parse_traceroute_real_capture_keeps_silent_hop():
    target, hops = netmetrics.parse_traceroute(TRACE_OUT, TRACE_ERR)
    assert target == "1.1.1.1"
    assert [h["hop"] for h in hops] == [1, 2, 3, 4, 10]
    assert hops[2] == {"hop": 3, "ip": None, "rtt_ms": None}  # never fabricated
    assert hops[0]["rtt_ms"] == pytest.approx(34.252)


def test_path_trace_reached(monkeypatch):
    run = recording_run((TRACE_OUT, TRACE_ERR))
    monkeypatch.setattr(subprocess, "run", run)
    res = netmetrics.path_trace("1.1.1.1", 10)
    assert res["reached"] is True and res["target_ip"] == "1.1.1.1"
    assert run.calls[0][:8] == ["traceroute", "-n", "-q", "1", "-w", "2", "-m", "10"]
    assert run.calls[0][-1] == "1.1.1.1"


def test_path_trace_not_reached_is_reported_not_hidden(monkeypatch):
    out = " 1  172.17.0.2  3.0 ms\n 2  *\n 3  *\n"
    monkeypatch.setattr(subprocess, "run", recording_run((out, TRACE_ERR)))
    assert netmetrics.path_trace("1.1.1.1", 3)["reached"] is False


def test_path_trace_no_hops_raises(monkeypatch):
    monkeypatch.setattr(subprocess, "run",
                        recording_run(("", "traceroute: unknown host nope.invalid\n")))
    with pytest.raises(netmax.NetMaxError, match="unknown host"):
        netmetrics.path_trace("nope.invalid")


@pytest.mark.parametrize("host", ["-oProxy", "bad host", "a;b", "", "x" * 300])
def test_hosts_that_could_inject_flags_are_rejected_before_any_spawn(monkeypatch, host):
    # No subprocess fake installed: the conftest tripwire fails the test on a spawn.
    for probe in (netmetrics.path_trace, netmetrics.mtu_probe):
        with pytest.raises(netmax.NetMaxError, match="invalid host"):
            probe(host)


@pytest.mark.parametrize("probe", ["path_trace", "mtu_probe"])
def test_unix_only_probes_refuse_windows(monkeypatch, probe):
    monkeypatch.setattr(netmetrics, "PLATFORM", "windows")
    with pytest.raises(netmax.NetMaxError, match="not supported on Windows"):
        getattr(netmetrics, probe)("1.1.1.1")


CURL_HTTPS = "0.032041|0.056987|0.088331|0.115192|0.115307|200|172.66.147.243|2"
CURL_HTTP = "0.001000|0.011000|0.000000|0.061000|0.062000|301|93.184.216.34|1.1"
CURL_FAILED = "0.000000|0.000000|0.000000|0.000000|0.018855|000||0"


def test_parse_curl_timing_https_phases():
    t = netmetrics.parse_curl_timing(CURL_HTTPS)
    assert t["dns_ms"] == pytest.approx(32.041)
    assert t["tcp_ms"] == pytest.approx(24.946)
    assert t["tls_ms"] == pytest.approx(31.344)
    assert t["wait_ms"] == pytest.approx(26.861)
    assert t["total_ms"] == pytest.approx(115.307)
    assert (t["http_code"], t["remote_ip"], t["http_version"]) == (200, "172.66.147.243", "2")


def test_parse_curl_timing_http_has_no_tls_phase():
    t = netmetrics.parse_curl_timing(CURL_HTTP)
    assert t["tls_ms"] is None and t["wait_ms"] == pytest.approx(50.0)
    assert t["http_code"] == 301  # a redirect is reported, not followed


@pytest.mark.parametrize("line", [CURL_FAILED, "", "garbage", "a|b|c|d|e|f|g|h"])
def test_parse_curl_timing_failure_raises_never_zeros(line):
    with pytest.raises(netmax.NetMaxError):
        netmetrics.parse_curl_timing(line)


def test_http_timing_median_and_partial_failure(monkeypatch):
    lines = [
        CURL_HTTPS.replace("0.115307", "0.100000"),
        CURL_HTTPS,
        CURL_HTTPS.replace("0.115307", "0.300000"),
    ]
    monkeypatch.setattr(subprocess, "run", recording_run(
        (lines[0], ""), (CURL_FAILED, "curl: (28) timed out"), (lines[1], ""), (lines[2], "")))
    res = netmetrics.http_timing("https://example.com/", 4)
    assert (res["samples_ok"], res["samples"]) == (3, 4)
    assert res["total_ms"] == pytest.approx(115.307)  # median of 100, 115.3, 300
    assert res["origin"] == "https://example.com"


def test_http_timing_failure_names_origin_only_never_the_query(monkeypatch):
    monkeypatch.setattr(subprocess, "run", recording_run(
        (CURL_FAILED, "curl: (6) Could not resolve host: h.invalid")))
    with pytest.raises(netmax.NetMaxError) as err:
        netmetrics.http_timing("https://h.invalid/path?token=SECRET")
    assert "https://h.invalid" in str(err.value) and "SECRET" not in str(err.value)


@pytest.mark.parametrize("url", [
    "file:///etc/passwd", "ftp://example.com/", "http://user:pw@example.com/",
    "https://exa mple.com/", "https:///nohost", "https://example.com/" + "x" * 2100, "",
])
def test_http_timing_rejects_unsafe_urls_before_any_spawn(url):
    with pytest.raises(netmax.NetMaxError, match="invalid URL"):
        netmetrics.http_timing(url)


def test_http_timing_curl_argv_is_restricted_to_http(monkeypatch):
    run = recording_run((CURL_HTTPS, ""))
    monkeypatch.setattr(subprocess, "run", run)
    netmetrics.http_timing("https://example.com/")
    cmd = run.calls[0]
    assert cmd[cmd.index("--proto") + 1] == "=http,https" and cmd[-1] == "https://example.com/"
    assert "-L" not in cmd and "-o" in cmd and cmd[cmd.index("-o") + 1] == "/dev/null"


APPLE_OK = "<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>\n\n200|"
GSTATIC_OK = "\n204|"
PORTAL_REDIRECT = "<html>login</html>\n302|http://portal.hotel.example/login?x=1"
UNREACHABLE = "\n000|"


def test_captive_portal_all_clean(monkeypatch):
    monkeypatch.setattr(subprocess, "run", recording_run((APPLE_OK, ""), (GSTATIC_OK, "")))
    assert netmetrics.captive_portal_check()["verdict"] == "no_portal_detected"


def test_captive_portal_redirect_is_flagged_with_host_only(monkeypatch):
    monkeypatch.setattr(subprocess, "run", recording_run((PORTAL_REDIRECT, ""), (GSTATIC_OK, "")))
    res = netmetrics.captive_portal_check()
    assert res["verdict"] == "portal_suspected"
    assert "portal.hotel.example" in res["endpoints"][0]["detail"]
    assert "login" not in res["endpoints"][0]["detail"]


def test_captive_portal_wrong_body_on_200_is_flagged(monkeypatch):
    fake_page = "<html>Please sign in</html>\n200|"
    monkeypatch.setattr(subprocess, "run", recording_run((fake_page, ""), (GSTATIC_OK, "")))
    assert netmetrics.captive_portal_check()["endpoints"][0]["state"] == "intercepted"


def test_captive_portal_one_blocked_endpoint_is_not_a_portal(monkeypatch):
    monkeypatch.setattr(subprocess, "run", recording_run((UNREACHABLE, "curl: (7)"), (GSTATIC_OK, "")))
    assert netmetrics.captive_portal_check()["verdict"] == "no_portal_detected"


def test_captive_portal_nothing_reachable(monkeypatch):
    monkeypatch.setattr(subprocess, "run", recording_run((UNREACHABLE, "curl: (6)")))
    assert netmetrics.captive_portal_check()["verdict"] == "unreachable"


def _ipv6(monkeypatch, source, v6_ms, v4_ms, aaaa=True):
    monkeypatch.setattr(netmetrics, "_udp_source_addr", lambda target: source)
    monkeypatch.setattr(netmetrics, "_tcp_connect_ms",
                        lambda target: v6_ms if ":" in target else v4_ms)
    monkeypatch.setattr(netmetrics, "_resolves_aaaa", lambda: aaaa)
    return netmetrics.ipv6_check()


@pytest.mark.parametrize("source, v6, v4, verdict", [
    ("2001:4860:4860::8844", 20.0, 25.0, "dual_stack"),
    ("2001:4860:4860::8844", 20.0, None, "ipv6_only"),
    ("2001:4860:4860::8844", None, 25.0, "ipv6_broken"),   # address, no working path
    (None, None, 25.0, "ipv4_only"),                        # no route at all
    ("fd00::1", None, 25.0, "ipv4_only"),                   # ULA is not global
    ("fe80::1%en0", None, 25.0, "ipv4_only"),               # link-local with zone id
    (None, None, None, "offline"),
])
def test_ipv6_check_verdicts(monkeypatch, source, v6, v4, verdict):
    assert _ipv6(monkeypatch, source, v6, v4)["verdict"] == verdict


def test_udp_source_addr_without_an_ipv6_stack_is_no_route_not_a_crash(monkeypatch):
    import socket

    def no_ipv6(family, kind):
        raise OSError(97, "Address family not supported by protocol")
    monkeypatch.setattr(socket, "socket", no_ipv6)
    assert netmetrics._udp_source_addr(netmetrics._V6_TARGET) is None


def test_ipv6_check_skips_the_v6_connect_without_a_global_address(monkeypatch):
    seen = []
    monkeypatch.setattr(netmetrics, "_udp_source_addr", lambda t: None)
    monkeypatch.setattr(netmetrics, "_tcp_connect_ms", lambda t: seen.append(t) or 25.0)
    monkeypatch.setattr(netmetrics, "_resolves_aaaa", lambda: True)
    netmetrics.ipv6_check()
    assert seen == [netmetrics._V4_TARGET]


def _mtu(monkeypatch, limit):
    """ping_ok that succeeds for payloads up to `limit`; records the sizes tried."""
    tried = []
    monkeypatch.setattr(netmetrics, "_df_ping_ok",
                        lambda host, size: tried.append(size) or size <= limit)
    return tried


@pytest.mark.parametrize("limit, mtu", [(1472, 1500), (1464, 1492), (1392, 1420), (1200, 1228)])
def test_mtu_probe_binary_search(monkeypatch, limit, mtu):
    tried = _mtu(monkeypatch, limit)
    res = netmetrics.mtu_probe("1.1.1.1")
    assert res["path_mtu"] == mtu and res["full_1500"] is (mtu >= 1500)
    assert len(tried) <= 10


def test_mtu_probe_without_any_reply_is_an_error_not_a_number(monkeypatch):
    _mtu(monkeypatch, 0)
    with pytest.raises(netmax.NetMaxError, match="cannot be measured"):
        netmetrics.mtu_probe("1.1.1.1")


@pytest.mark.parametrize("platform, flag", [("macos", "-D"), ("linux", "-M")])
def test_df_ping_argv_per_platform(monkeypatch, platform, flag):
    monkeypatch.setattr(netmetrics, "PLATFORM", platform)
    run = recording_run(("1480 bytes from 1.1.1.1: icmp_seq=0 ttl=55 time=45.0 ms\n", ""))
    monkeypatch.setattr(subprocess, "run", run)
    assert netmetrics._df_ping_ok("1.1.1.1", 1472) is True
    assert flag in run.calls[0] and run.calls[0][-1] == "1.1.1.1"


def test_df_ping_message_too_long_is_not_ok(monkeypatch):
    monkeypatch.setattr(netmetrics, "PLATFORM", "macos")
    monkeypatch.setattr(subprocess, "run", recording_run(
        ("PING 1.1.1.1 (1.1.1.1): 1473 data bytes\n\n--- 1.1.1.1 ping statistics ---\n", "ping: sendto: Message too long\n")))
    assert netmetrics._df_ping_ok("1.1.1.1", 1473) is False


# ── CLI wiring ─────────────────────────────────────────────────────────────

def test_cli_trace_prints_hops_and_silent_hop(monkeypatch, capsys):
    monkeypatch.setattr(subprocess, "run", recording_run((TRACE_OUT, TRACE_ERR)))
    netmax.main(["trace", "1.1.1.1", "--max-hops", "10"])
    out = capsys.readouterr().out
    assert "reached in 5 hops" in out and "*  (no reply)" in out and "34.3 ms" in out


def test_cli_context_prints_flags(monkeypatch, capsys):
    import netmax_netcontext
    monkeypatch.setattr(netmax_netcontext, "get_context", lambda: {"online": True, "vpn": False})
    netmax.main(["context"])
    assert capsys.readouterr().out.splitlines() == ["online: True", "vpn: False"]


@pytest.mark.parametrize("argv, flag", [(["trace", "x.y", "--max-hops", "99"], "--max-hops"),
                                        (["http-timing", "https://a.example", "--count", "9"], "--count")])
def test_cli_bounds_are_enforced(capsys, argv, flag):
    with pytest.raises(SystemExit) as exit_info:
        netmax.main(argv)
    assert exit_info.value.code == 1 and flag in capsys.readouterr().err


def test_script_run_turns_a_failed_probe_into_one_line_not_a_traceback(monkeypatch, capsys):
    """Run as __main__, sibling modules import a second netmax whose NetMaxError
    is a different class; the entry point must still print a message, exit 1."""
    import runpy
    monkeypatch.setattr(sys, "argv", ["netmax.py", "mtu", "--host", "bad host"])
    with pytest.raises(SystemExit) as exit_info:
        runpy.run_path(netmax.__file__, run_name="__main__")
    assert exit_info.value.code == 1
    err = capsys.readouterr().err
    assert err.strip() == "netmax: invalid host 'bad host': use a hostname or an IP address"
