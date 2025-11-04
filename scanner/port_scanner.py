"""
Port Scanner Module
Provides TCP port scanning functionality similar to nmap
"""

import socket
import concurrent.futures
import json
import sys
from typing import List, Dict, Tuple
from urllib.parse import urlparse


class PortScanner:
    """TCP Port Scanner with multi-threading support"""
    
    # Common ports and their services
    COMMON_PORTS = {
        20: "FTP-DATA",
        21: "FTP",
        22: "SSH",
        23: "Telnet",
        25: "SMTP",
        53: "DNS",
        80: "HTTP",
        110: "POP3",
        143: "IMAP",
        443: "HTTPS",
        445: "SMB",
        3306: "MySQL",
        3389: "RDP",
        5432: "PostgreSQL",
        5900: "VNC",
        6379: "Redis",
        8080: "HTTP-Proxy",
        8443: "HTTPS-Alt",
        27017: "MongoDB"
    }
    
    def __init__(self, target: str, ports: List[int] = None, timeout: float = 1.0, threads: int = 50):
        """
        Initialize port scanner
        
        Args:
            target: Target hostname or IP address
            ports: List of ports to scan (default: common ports)
            timeout: Socket timeout in seconds
            threads: Number of concurrent threads
        """
        self.target = self._parse_target(target)
        self.ports = ports if ports else list(self.COMMON_PORTS.keys())
        self.timeout = timeout
        self.threads = threads
        self.results = []
        
    def _parse_target(self, target: str) -> str:
        """Parse target URL/hostname to get the domain"""
        if target.startswith('http://') or target.startswith('https://'):
            parsed = urlparse(target)
            return parsed.netloc.split(':')[0]  # Remove port if present
        return target.split(':')[0]
    
    def _scan_port(self, port: int) -> Tuple[int, bool, str]:
        """
        Scan a single port
        
        Returns:
            Tuple of (port, is_open, service_name)
        """
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(self.timeout)
                result = sock.connect_ex((self.target, port))
                
                if result == 0:
                    service = self.COMMON_PORTS.get(port, "unknown")
                    try:
                        # Try to grab banner
                        sock.send(b'\r\n')
                        banner = sock.recv(1024).decode('utf-8', errors='ignore').strip()
                        if banner:
                            return (port, True, service, banner)
                    except:
                        pass
                    return (port, True, service, "")
                    
        except socket.gaierror:
            return (port, False, "error", "")
        except socket.error:
            return (port, False, "", "")
        except Exception:
            return (port, False, "", "")
            
        return (port, False, "", "")
    
    def scan(self) -> Dict:
        """
        Perform port scan with multi-threading
        
        Returns:
            Dictionary with scan results
        """
        open_ports = []
        
        try:
            # Resolve hostname to IP
            target_ip = socket.gethostbyname(self.target)
        except socket.gaierror:
            return {
                "success": False,
                "error": f"Cannot resolve hostname: {self.target}",
                "target": self.target,
                "open_ports": []
            }
        
        # Scan ports using thread pool
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.threads) as executor:
            future_to_port = {executor.submit(self._scan_port, port): port for port in self.ports}
            
            for future in concurrent.futures.as_completed(future_to_port):
                result = future.result()
                if result[1]:  # Port is open
                    port_info = {
                        "port": result[0],
                        "service": result[2],
                        "state": "open"
                    }
                    if len(result) > 3 and result[3]:
                        port_info["banner"] = result[3]
                    open_ports.append(port_info)
        
        # Sort by port number
        open_ports.sort(key=lambda x: x['port'])
        
        return {
            "success": True,
            "target": self.target,
            "target_ip": target_ip,
            "open_ports": open_ports,
            "total_scanned": len(self.ports),
            "total_open": len(open_ports)
        }


def scan_ports(target: str, ports: str = "common", timeout: float = 1.0) -> Dict:
    """
    Convenience function for port scanning
    
    Args:
        target: Target hostname or URL
        ports: "common" for common ports, "all" for 1-1024, or comma-separated list
        timeout: Timeout in seconds
        
    Returns:
        Scan results dictionary
    """
    if ports == "common":
        port_list = None  # Use default common ports
    elif ports == "all":
        port_list = list(range(1, 1025))
    else:
        try:
            port_list = [int(p.strip()) for p in ports.split(',')]
        except ValueError:
            return {
                "success": False,
                "error": "Invalid port specification",
                "target": target
            }
    
    scanner = PortScanner(target, port_list, timeout)
    return scanner.scan()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python port_scanner.py <target> [ports] [timeout]"
        }))
        sys.exit(1)
    
    target = sys.argv[1]
    ports = sys.argv[2] if len(sys.argv) > 2 else "common"
    timeout = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    
    result = scan_ports(target, ports, timeout)
    print(json.dumps(result, indent=2))

