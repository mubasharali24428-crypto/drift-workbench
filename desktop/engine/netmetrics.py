"""Network metrics: packet loss, jitter, Wi-Fi info (macOS), plus path, HTTP
timing, IPv6, MTU and captive-portal probes.

Implements M2/N1 per docs/FEATURE-SPECS.md '## Research Findings'.
All functions are offline-testable: they shell out via subprocess and parse
stdout only — never exit codes alone. Failures raise netmax.NetMaxError.
"""

from __future__ import annotations

import ipaddress
import json
import re
import socket
import statistics
import subprocess
import time
from urllib.parse import urlsplit

from netmax import NetMaxError
from netmax_platform import (
    PLATFORM,
    parse_netsh_wlan,
    parse_ping_loss,
    parse_ping_times,
    ping_cmd,
    ping_timeout_s,
    wifi_cmd,
)


def _run(cmd: list[str], timeout: float) -> subprocess.CompletedProcess:
    """Run a command, converting spawn/timeout failures into NetMaxError."""
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except (subprocess.TimeoutExpired, OSError) as exc:
        raise NetMaxError(f"{cmd[0]} failed to run: {exc}") from exc


def packet_loss(host: str = "1.1.1.1", count: int = 10, interval: float = 0.3) -> float:
    """Packet-loss percent [0.0..100.0] parsed from ping's stdout summary line.

    Ping exits non-zero when the host blocks ICMP but still prints a
    statistics block with 100.0% loss — we parse stdout, not the exit code.
    On Windows the flags and output format differ; netmax_platform handles it.
    """
    proc = _run(ping_cmd(host, count, interval),
                timeout=ping_timeout_s(count, interval))
    try:
        return parse_ping_loss(proc.stdout, host)
    except NetMaxError:
        raise NetMaxError(
            f"ping to {host} produced no loss statistics: "
            f"{proc.stderr.strip()[:120] or 'no output'}"
        ) from None


def jitter_ms(host: str = "1.1.1.1", count: int = 10, interval: float = 0.3) -> float:
    """Mean absolute delta between consecutive RTTs (ms), RFC 3550 style.

    Parses every `time=X ms` reply line; skips `time<0.1 ms` lines (localhost),
    which break the float regex. Windows `time<1ms` lines are likewise
    skipped — never fabricated.
    """
    proc = _run(ping_cmd(host, count, interval),
                timeout=ping_timeout_s(count, interval))
    times = parse_ping_times(proc.stdout)
    if len(times) < 2:
        raise NetMaxError(
            f"insufficient RTT samples from ping to {host} "
            f"({len(times)} replies): {proc.stderr.strip()[:120]}"
        )
    deltas = [abs(b - a) for a, b in zip(times, times[1:])]
    return statistics.fmean(deltas)


# Wi-Fi scan cache: system_profiler takes seconds per spawn and the radio
# barely moves within 10 s — serve repeats from memory.
WIFI_CACHE_TTL_S = 10.0
_WIFI_CACHE: dict = {"at": float("-inf"), "info": None}


def _reset_wifi_cache() -> None:
    _WIFI_CACHE["at"] = float("-inf")
    _WIFI_CACHE["info"] = None


def wifi_info(iface_hint: str | None = None) -> dict:
    """Current Wi-Fi network info: {'rssi_dbm', 'noise_dbm', 'channel', ...}.

    Uses `system_profiler SPAirPortDataType` (the airport binary was removed
    in modern macOS). Prefers -json; falls back to plain-text regexes.
    On Windows uses `netsh wlan show interfaces` (signal % → estimated dBm,
    flagged). On Linux raises NetMaxError honestly (no universal CLI).
    """
    del iface_hint  # reserved; system_profiler reports all interfaces
    if PLATFORM == "windows":
        return _wifi_info_windows()
    now = time.monotonic()
    if _WIFI_CACHE["info"] is not None and now - _WIFI_CACHE["at"] < WIFI_CACHE_TTL_S:
        return dict(_WIFI_CACHE["info"])
    info = _wifi_info_uncached()
    _WIFI_CACHE["at"] = now
    _WIFI_CACHE["info"] = info
    return dict(info)


def _wifi_info_windows() -> dict:
    """Windows Wi-Fi info via netsh. netsh is fast; no cache needed."""
    proc = _run(wifi_cmd(), timeout=30)
    if proc.returncode != 0:
        raise NetMaxError(
            f"netsh wlan failed: {proc.stderr.strip()[:120]}"
        )
    return parse_netsh_wlan(proc.stdout)


def _wifi_info_uncached() -> dict:
    proc = _run(["system_profiler", "SPAirPortDataType", "-json"], timeout=30)
    if proc.returncode != 0:
        raise NetMaxError(
            f"system_profiler failed: {proc.stderr.strip()[:120]}"
        )
    try:
        data = json.loads(proc.stdout)
        items = (
            (data.get("SPAirPortDataType") or [{}])[0]
            .get("spairport_current_network_information")
            or []
        )
        v = next(iter(items.values())) if isinstance(items, dict) else (items[0] if items else {})
        sig = str(v.get("spairport_signal_or_noise", ""))
        chan = str(v.get("spairport_current_channel", ""))
        m = re.match(r"\s*(-?\d+)\s*dBm\s*/\s*(-?\d+)\s*dBm", sig)
        cm = re.match(r"(\d+)\s*\((\w+GHz)", chan)
        result = {
            "rssi_dbm": int(m.group(1)) if m else None,
            "noise_dbm": int(m.group(2)) if m else None,
            "channel": cm.group(1) if cm else chan or None,
        }
    except (ValueError, AttributeError, IndexError, TypeError):
        result = {"rssi_dbm": None, "noise_dbm": None, "channel": None}
    if any(result[k] is None for k in ("rssi_dbm", "noise_dbm", "channel")):
        # JSON keys unverified on this OS / no association — fall back to the
        # live-verified plain-text format.
        txt = _run(["system_profiler", "SPAirPortDataType"], timeout=30).stdout
        sm = re.search(r"Signal / Noise:\s*(-?\d+)\s*dBm\s*/\s*(-?\d+)\s*dBm", txt)
        chm = re.search(r"Channel:\s*(\d+)\s*\((\w+GHz)", txt)
        result = {
            "rssi_dbm": int(sm.group(1)) if sm else result["rssi_dbm"],
            "noise_dbm": int(sm.group(2)) if sm else result["noise_dbm"],
            "channel": chm.group(1) if chm else result["channel"],
        }
    if result["rssi_dbm"] is None:
        raise NetMaxError("no Wi-Fi network associated (Wi-Fi off or Ethernet)")
    return result


# ── Path and reachability probes ─────────────────────────────────────────
# Same house style as above: shell out (or open one socket), parse what comes
# back, raise NetMaxError when a probe cannot run. A probe that cannot measure
# says so; it never returns a made-up number.

_HOST_RE = re.compile(r"^(?!-)[A-Za-z0-9.:-]{1,253}$")
_RTT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*ms")
_HOP_RE = re.compile(r"^\s*(\d+)\s+(\S.*)$")
_TRACE_HEAD_RE = re.compile(r"^traceroute6? to \S+ \(([0-9A-Fa-f:.]+)\)")


def _checked_host(host: str) -> str:
    """A hostname or IP literal: never a leading '-', whitespace or shell characters."""
    if not isinstance(host, str) or not _HOST_RE.match(host):
        raise NetMaxError(f"invalid host {host!r}: use a hostname or an IP address")
    return host


def _unix_only(probe: str) -> None:
    if PLATFORM == "windows":
        raise NetMaxError(f"{probe} is not supported on Windows (no validated parser)")


def parse_traceroute(stdout: str, stderr: str = "") -> tuple[str | None, list[dict]]:
    """Target IP from the header line (stderr on macOS, stdout on Linux) and one
    {"hop", "ip", "rtt_ms"} dict per hop. A silent hop has ip and rtt_ms None."""
    target = None
    for line in (stderr + "\n" + stdout).splitlines():
        head = _TRACE_HEAD_RE.match(line)
        if head:
            target = head.group(1)
            break
    hops = []
    for line in stdout.splitlines():
        m = _HOP_RE.match(line)
        if not m:
            continue
        first = m.group(2).split()[0]
        rtt = _RTT_RE.search(m.group(2))
        silent = first == "*"
        hops.append({
            "hop": int(m.group(1)),
            "ip": None if silent else first,
            "rtt_ms": float(rtt.group(1)) if rtt and not silent else None,
        })
    return target, hops


def path_trace(host: str, max_hops: int = 20) -> dict:
    """Hop-by-hop route to `host` from the system traceroute (one probe per hop)."""
    _unix_only("path_trace")
    host = _checked_host(host)
    proc = _run(["traceroute", "-n", "-q", "1", "-w", "2", "-m", str(max_hops), host],
                timeout=max_hops * 3.0 + 10)
    target, hops = parse_traceroute(proc.stdout, proc.stderr)
    if not hops:
        raise NetMaxError(
            f"traceroute to {host} produced no hops: "
            f"{proc.stderr.strip()[:120] or 'no output'}"
        )
    return {
        "host": host,
        "target_ip": target,
        "hops": hops,
        "reached": target is not None and hops[-1]["ip"] == target,
    }


_CURL_TIMING_FMT = (
    "%{time_namelookup}|%{time_connect}|%{time_appconnect}|"
    "%{time_starttransfer}|%{time_total}|%{http_code}|%{remote_ip}|%{http_version}"
)


def _checked_url(url: str) -> tuple[str, str]:
    """Return (url, scheme://host). Only http(s), no credentials, no whitespace.

    The origin is what error messages show: paths and query strings can carry
    tokens, and failure text can reach logs or alerts.
    """
    try:
        parts = urlsplit(url)
        host = parts.hostname
    except (ValueError, AttributeError):
        raise NetMaxError("invalid URL") from None
    if (parts.scheme not in ("http", "https") or not host or "@" in parts.netloc
            or len(url) > 2048 or re.search(r"[\s\x00-\x1f\x7f]", url)):
        raise NetMaxError("invalid URL: use http:// or https://, a host, no credentials or spaces")
    return url, f"{parts.scheme}://{host}"


def parse_curl_timing(line: str) -> dict:
    """One `curl -w` timing line to phase times in ms. A failed transfer raises."""
    fields = line.strip().split("|")
    try:
        if len(fields) != 8:
            raise ValueError
        dns, connect, appconnect, first_byte, total = (float(x) * 1000.0 for x in fields[:5])
        code = int(fields[5])
    except ValueError:
        raise NetMaxError(f"unexpected curl timing output: {line.strip()[:80]!r}") from None
    if code == 0:
        raise NetMaxError("no HTTP response")
    secure = appconnect > 0
    return {
        "dns_ms": dns,
        "tcp_ms": connect - dns,
        "tls_ms": appconnect - connect if secure else None,
        "wait_ms": first_byte - (appconnect if secure else connect),
        "transfer_ms": total - first_byte,
        "total_ms": total,
        "http_code": code,
        "remote_ip": fields[6] or None,
        "http_version": fields[7] or None,
    }


def http_timing(url: str, count: int = 1) -> dict:
    """DNS / TCP / TLS / server-wait / transfer time for one URL.

    Each sample is a fresh connection; the result is the median over the
    samples that got a response. Redirects are reported (http_code), not followed.
    """
    url, origin = _checked_url(url)
    samples, errors = [], []
    for _ in range(count):
        proc = _run(["curl", "-sS", "-o", "/dev/null", "--proto", "=http,https",
                     "--connect-timeout", "10", "--max-time", "20",
                     "-w", _CURL_TIMING_FMT, url], timeout=30)
        try:
            samples.append(parse_curl_timing(proc.stdout))
        except NetMaxError:
            errors.append(proc.stderr.strip()[:120] or "no HTTP response")
    if not samples:
        raise NetMaxError(f"http_timing to {origin} failed: {errors[0]}")
    tls = [s["tls_ms"] for s in samples if s["tls_ms"] is not None]
    result = {k: statistics.median(s[k] for s in samples)
              for k in ("dns_ms", "tcp_ms", "wait_ms", "transfer_ms", "total_ms")}
    result["tls_ms"] = statistics.median(tls) if tls else None
    result.update(origin=origin, samples_ok=len(samples), samples=count,
                  http_code=samples[0]["http_code"], remote_ip=samples[0]["remote_ip"],
                  http_version=samples[0]["http_version"])
    return result


# Two independent vendors: one blocked endpoint must not read as a portal.
_PORTAL_ENDPOINTS = (
    ("captive.apple.com", "http://captive.apple.com/hotspot-detect.html", 200, "Success"),
    ("connectivitycheck.gstatic.com", "http://connectivitycheck.gstatic.com/generate_204", 204, ""),
)


def _portal_probe(name: str, url: str, want_code: int, want_body: str) -> dict:
    proc = _run(["curl", "-sS", "--proto", "=http", "--connect-timeout", "5",
                 "--max-time", "8", "-w", "\n%{http_code}|%{redirect_url}", url], timeout=15)
    body, _, tail = proc.stdout.rpartition("\n")
    code_text, _, redirect = tail.partition("|")
    code = int(code_text) if code_text.isdigit() else 0
    if code == 0:
        return {"endpoint": name, "state": "unreachable",
                "detail": proc.stderr.strip()[:100] or "no response"}
    expected = code == want_code and ((want_body in body) if want_body else not body.strip())
    detail = f"HTTP {code}"
    if redirect:
        detail += f", redirected to {urlsplit(redirect).hostname}"
    return {"endpoint": name, "state": "clean" if expected else "intercepted", "detail": detail}


def captive_portal_check() -> dict:
    """Detect a captive portal or intercepting proxy with two well-known endpoints.

    A portal answers plain-HTTP requests with a redirect or its own page, so a
    wrong code or body on either endpoint is evidence; one unreachable endpoint
    is not.
    """
    endpoints = [_portal_probe(*e) for e in _PORTAL_ENDPOINTS]
    states = {e["state"] for e in endpoints}
    if "intercepted" in states:
        verdict = "portal_suspected"
    elif "clean" in states:
        verdict = "no_portal_detected"
    else:
        verdict = "unreachable"
    return {"verdict": verdict, "endpoints": endpoints}


_V6_TARGET = "2606:4700:4700::1111"  # Cloudflare public resolver
_V4_TARGET = "1.1.1.1"


def _udp_source_addr(target: str) -> str | None:
    """Source address the OS would use to reach `target`. A UDP connect sends nothing."""
    family = socket.AF_INET6 if ":" in target else socket.AF_INET
    try:
        sock = socket.socket(family, socket.SOCK_DGRAM)
    except OSError:  # IPv6 disabled or not compiled in: no route, not a crash
        return None
    try:
        sock.connect((target, 53))
        return sock.getsockname()[0]
    except OSError:
        return None
    finally:
        sock.close()


def _tcp_connect_ms(target: str) -> float | None:
    start = time.perf_counter()
    try:
        socket.create_connection((target, 443), timeout=5).close()
    except OSError:
        return None
    return (time.perf_counter() - start) * 1000.0


def _resolves_aaaa(name: str = "one.one.one.one") -> bool:
    try:
        return bool(socket.getaddrinfo(name, 443, socket.AF_INET6, socket.SOCK_STREAM))
    except OSError:
        return False


def ipv6_check() -> dict:
    """IPv6 readiness: global address, working TCP path, AAAA resolution, vs IPv4."""
    source = _udp_source_addr(_V6_TARGET)
    try:
        has_global = bool(source) and ipaddress.ip_address(source.split("%")[0]).is_global
    except ValueError:
        has_global = False
    v6_ms = _tcp_connect_ms(_V6_TARGET) if has_global else None
    v4_ms = _tcp_connect_ms(_V4_TARGET)
    if v6_ms is not None:
        verdict = "dual_stack" if v4_ms is not None else "ipv6_only"
    elif has_global:
        verdict = "ipv6_broken"  # an address, but no working path
    else:
        verdict = "ipv4_only" if v4_ms is not None else "offline"
    return {
        "verdict": verdict,
        "global_address": has_global,
        "aaaa_resolves": _resolves_aaaa(),
        "ipv6_connect_ms": v6_ms,
        "ipv4_connect_ms": v4_ms,
    }


def _df_ping_ok(host: str, payload: int) -> bool:
    """True when an echo reply came back for a don't-fragment ping of `payload` bytes."""
    if PLATFORM == "macos":
        cmd = ["ping", "-D", "-c", "2", "-i", "0.3", "-s", str(payload), "-t", "4", host]
    else:
        cmd = ["ping", "-M", "do", "-c", "2", "-i", "0.3", "-s", str(payload), "-W", "2", host]
    return bool(re.search(r"\d+ bytes from ", _run(cmd, timeout=15).stdout))


def mtu_probe(host: str = "1.1.1.1") -> dict:
    """Largest packet that crosses the path unfragmented, up to 1500 bytes.

    Binary search over the ICMP payload (packet size = payload + 28). If even
    the smallest probe gets no reply the MTU cannot be measured, and that is
    an error, not a number.
    """
    _unix_only("mtu_probe")
    host = _checked_host(host)
    low, high = 1200, 1472
    if not _df_ping_ok(host, low):
        raise NetMaxError(
            f"no echo reply from {host} for a {low + 28}-byte don't-fragment ping: "
            "ICMP blocked or host unreachable, so the path MTU cannot be measured"
        )
    while low < high:
        mid = (low + high + 1) // 2
        if _df_ping_ok(host, mid):
            low = mid
        else:
            high = mid - 1
    return {"host": host, "path_mtu": low + 28, "full_1500": low + 28 >= 1500}
