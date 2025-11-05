"""
Security Audit Module
Performs system security checks, configuration audits, and log analysis
Supports Windows and Linux systems
"""

import json
import sys
import os
import platform
import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import subprocess


class SecurityAuditor:
    """Main security auditing class"""
    
    def __init__(self):
        self.os_type = self._detect_os()
        self.os_name = platform.system()
        self.results = {
            "success": True,
            "os_type": self.os_type,
            "os_name": self.os_name,
            "timestamp": datetime.now().isoformat(),
            "config_issues": [],
            "log_analysis": {},
            "banned_ips": [],
            "recommendations": []
        }
    
    def _detect_os(self) -> str:
        """Detect operating system type"""
        system = platform.system().lower()
        
        if system == "windows":
            return "Windows"
        elif system == "linux":
            # Detect Linux distribution
            try:
                with open('/etc/os-release', 'r') as f:
                    content = f.read().lower()
                    if 'ubuntu' in content:
                        return "Ubuntu"
                    elif 'centos' in content:
                        return "CentOS"
                    elif 'debian' in content:
                        return "Debian"
                    elif 'rhel' in content or 'red hat' in content:
                        return "RedHat"
                    else:
                        return "Linux"
            except:
                return "Linux"
        else:
            return system.capitalize()
    
    def audit_all(self) -> Dict:
        """Perform complete security audit"""
        try:
            # 1. Check configuration files
            self._check_configurations()
            
            # 2. Analyze system logs for attacks
            self._analyze_logs()
            
            # 3. Generate recommendations
            self._generate_recommendations()
            
            return self.results
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Audit failed: {str(e)}",
                "os_type": self.os_type
            }
    
    def _check_configurations(self):
        """Check security configurations"""
        if self.os_type in ["Ubuntu", "Debian", "CentOS", "RedHat", "Linux"]:
            self._check_linux_configs()
        elif self.os_type == "Windows":
            self._check_windows_configs()
    
    def _check_linux_configs(self):
        """Check Linux system configurations"""
        
        # Check SSH configuration
        ssh_config_path = "/etc/ssh/sshd_config"
        if os.path.exists(ssh_config_path):
            try:
                with open(ssh_config_path, 'r') as f:
                    ssh_content = f.read()
                    
                # Check PasswordAuthentication
                if re.search(r'^\s*PasswordAuthentication\s+yes', ssh_content, re.MULTILINE):
                    self.results["config_issues"].append({
                        "severity": "medium",
                        "service": "SSH",
                        "issue": "Password authentication is enabled",
                        "file": ssh_config_path,
                        "recommendation": "Set 'PasswordAuthentication no' and use key-based authentication"
                    })
                
                # Check PermitRootLogin
                if re.search(r'^\s*PermitRootLogin\s+yes', ssh_content, re.MULTILINE):
                    self.results["config_issues"].append({
                        "severity": "high",
                        "service": "SSH",
                        "issue": "Root login via SSH is permitted",
                        "file": ssh_config_path,
                        "recommendation": "Set 'PermitRootLogin no' or 'PermitRootLogin prohibit-password'"
                    })
                
                # Check Port
                if not re.search(r'^\s*Port\s+(?!22\s)', ssh_content, re.MULTILINE):
                    self.results["config_issues"].append({
                        "severity": "low",
                        "service": "SSH",
                        "issue": "SSH is using default port 22",
                        "file": ssh_config_path,
                        "recommendation": "Consider changing SSH port to non-standard port"
                    })
                    
            except Exception as e:
                pass  # File read permission denied
        
        # Check firewall status
        try:
            # Try UFW (Ubuntu/Debian)
            result = subprocess.run(['ufw', 'status'], 
                                  capture_output=True, text=True, timeout=5)
            if 'inactive' in result.stdout.lower():
                self.results["config_issues"].append({
                    "severity": "high",
                    "service": "Firewall",
                    "issue": "UFW firewall is inactive",
                    "recommendation": "Enable firewall with 'sudo ufw enable'"
                })
        except:
            # Try firewalld (CentOS/RedHat)
            try:
                result = subprocess.run(['firewall-cmd', '--state'], 
                                      capture_output=True, text=True, timeout=5)
                if 'not running' in result.stdout.lower():
                    self.results["config_issues"].append({
                        "severity": "high",
                        "service": "Firewall",
                        "issue": "Firewalld is not running",
                        "recommendation": "Start firewall with 'sudo systemctl start firewalld'"
                    })
            except:
                pass
    
    def _check_windows_configs(self):
        """Check Windows system configurations"""
        
        # Check Windows Firewall status
        try:
            result = subprocess.run(
                ['netsh', 'advfirewall', 'show', 'allprofiles'],
                capture_output=True, text=True, timeout=5
            )
            
            if 'State                                 OFF' in result.stdout:
                self.results["config_issues"].append({
                    "severity": "high",
                    "service": "Windows Firewall",
                    "issue": "Windows Firewall is disabled",
                    "recommendation": "Enable Windows Firewall in Control Panel > System and Security"
                })
        except:
            pass
        
        # Check RDP configuration (Registry)
        try:
            result = subprocess.run(
                ['reg', 'query', 'HKLM\\System\\CurrentControlSet\\Control\\Terminal Server', '/v', 'fDenyTSConnections'],
                capture_output=True, text=True, timeout=5
            )
            
            if 'fDenyTSConnections    REG_DWORD    0x0' in result.stdout:
                self.results["config_issues"].append({
                    "severity": "medium",
                    "service": "Remote Desktop",
                    "issue": "Remote Desktop is enabled",
                    "recommendation": "Ensure RDP is secured with strong passwords and network-level authentication"
                })
        except:
            pass
    
    def _analyze_logs(self):
        """Analyze system logs for security threats"""
        if self.os_type in ["Ubuntu", "Debian", "CentOS", "RedHat", "Linux"]:
            self._analyze_linux_logs()
        elif self.os_type == "Windows":
            self._analyze_windows_logs()
    
    def _analyze_linux_logs(self):
        """Analyze Linux system logs"""
        
        # Analyze auth.log for SSH brute force attempts
        auth_log_paths = [
            "/var/log/auth.log",      # Ubuntu/Debian
            "/var/log/secure"          # CentOS/RedHat
        ]
        
        for log_path in auth_log_paths:
            if os.path.exists(log_path):
                try:
                    failed_attempts = self._analyze_ssh_log(log_path)
                    if failed_attempts:
                        self.results["log_analysis"]["ssh"] = {
                            "total_failed_attempts": len(failed_attempts),
                            "suspicious_ips": self._find_brute_force_ips(failed_attempts),
                            "log_file": log_path
                        }
                        
                        # Auto-ban suspicious IPs
                        self._ban_suspicious_ips(
                            self.results["log_analysis"]["ssh"]["suspicious_ips"]
                        )
                    break
                except:
                    pass
        
        # Analyze other logs (FTP, SMB, etc.)
        self._analyze_ftp_logs()
        self._analyze_smb_logs()
    
    def _analyze_ssh_log(self, log_path: str) -> List[Dict]:
        """Parse SSH authentication failures"""
        failed_attempts = []
        
        try:
            with open(log_path, 'r') as f:
                # Read last 10000 lines for recent activity
                lines = f.readlines()[-10000:]
                
                for line in lines:
                    # Match failed password attempts
                    if 'Failed password' in line or 'authentication failure' in line:
                        # Extract IP address
                        ip_match = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
                        # Extract timestamp
                        time_match = re.search(r'(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})', line)
                        
                        if ip_match:
                            failed_attempts.append({
                                "ip": ip_match.group(1),
                                "timestamp": time_match.group(1) if time_match else "unknown",
                                "log_line": line.strip()
                            })
        except:
            pass
        
        return failed_attempts
    
    def _find_brute_force_ips(self, failed_attempts: List[Dict], threshold: int = 5) -> List[Dict]:
        """Identify IPs with excessive failed login attempts"""
        ip_counts = {}
        
        for attempt in failed_attempts:
            ip = attempt["ip"]
            if ip not in ip_counts:
                ip_counts[ip] = {
                    "count": 0,
                    "first_seen": attempt["timestamp"],
                    "last_seen": attempt["timestamp"]
                }
            ip_counts[ip]["count"] += 1
            ip_counts[ip]["last_seen"] = attempt["timestamp"]
        
        # Find IPs exceeding threshold
        suspicious_ips = []
        for ip, data in ip_counts.items():
            if data["count"] >= threshold:
                suspicious_ips.append({
                    "ip": ip,
                    "failed_attempts": data["count"],
                    "first_seen": data["first_seen"],
                    "last_seen": data["last_seen"],
                    "threat_level": "high" if data["count"] > 20 else "medium"
                })
        
        # Sort by count
        suspicious_ips.sort(key=lambda x: x["failed_attempts"], reverse=True)
        
        return suspicious_ips
    
    def _analyze_ftp_logs(self):
        """Analyze FTP logs for brute force attempts"""
        ftp_log_paths = [
            "/var/log/vsftpd.log",
            "/var/log/proftpd/proftpd.log"
        ]
        
        for log_path in ftp_log_paths:
            if os.path.exists(log_path):
                try:
                    with open(log_path, 'r') as f:
                        lines = f.readlines()[-5000:]
                        failed_logins = []
                        
                        for line in lines:
                            if 'FAIL LOGIN' in line.upper() or 'authentication failed' in line.lower():
                                ip_match = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
                                if ip_match:
                                    failed_logins.append({"ip": ip_match.group(1)})
                        
                        if failed_logins:
                            self.results["log_analysis"]["ftp"] = {
                                "total_failed_attempts": len(failed_logins),
                                "log_file": log_path
                            }
                    break
                except:
                    pass
    
    def _analyze_smb_logs(self):
        """Analyze SMB/Samba logs"""
        smb_log_path = "/var/log/samba/log.smbd"
        
        if os.path.exists(smb_log_path):
            try:
                with open(smb_log_path, 'r') as f:
                    lines = f.readlines()[-5000:]
                    failed_logins = []
                    
                    for line in lines:
                        if 'authentication failed' in line.lower() or 'login failed' in line.lower():
                            ip_match = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
                            if ip_match:
                                failed_logins.append({"ip": ip_match.group(1)})
                    
                    if failed_logins:
                        self.results["log_analysis"]["smb"] = {
                            "total_failed_attempts": len(failed_logins),
                            "log_file": smb_log_path
                        }
            except:
                pass
    
    def _analyze_windows_logs(self):
        """Analyze Windows Event Logs"""
        try:
            # Analyze Security log for failed logon attempts (Event ID 4625)
            result = subprocess.run(
                ['wevtutil', 'qe', 'Security', '/c:100', '/rd:true', '/f:text', '/q:*[System[(EventID=4625)]]'],
                capture_output=True, text=True, timeout=10
            )
            
            if result.stdout:
                failed_attempts = result.stdout.count('Event ID:         4625')
                if failed_attempts > 0:
                    self.results["log_analysis"]["windows_security"] = {
                        "total_failed_logons": failed_attempts,
                        "event_id": 4625,
                        "description": "Failed logon attempts detected"
                    }
        except:
            pass
    
    def _ban_suspicious_ips(self, suspicious_ips: List[Dict]):
        """Ban suspicious IPs using system firewall"""
        if not suspicious_ips:
            return
        
        for ip_info in suspicious_ips:
            ip = ip_info["ip"]
            
            # Skip private IPs
            if ip.startswith(('127.', '192.168.', '10.', '172.')):
                continue
            
            success = False
            method = ""
            
            if self.os_type in ["Ubuntu", "Debian", "CentOS", "RedHat", "Linux"]:
                # Try UFW first
                try:
                    result = subprocess.run(
                        ['sudo', 'ufw', 'deny', 'from', ip],
                        capture_output=True, text=True, timeout=5
                    )
                    if result.returncode == 0:
                        success = True
                        method = "UFW"
                except:
                    pass
                
                # Try iptables if UFW failed
                if not success:
                    try:
                        result = subprocess.run(
                            ['sudo', 'iptables', '-A', 'INPUT', '-s', ip, '-j', 'DROP'],
                            capture_output=True, text=True, timeout=5
                        )
                        if result.returncode == 0:
                            success = True
                            method = "iptables"
                    except:
                        pass
            
            elif self.os_type == "Windows":
                # Use Windows Firewall
                try:
                    rule_name = f"Block_{ip.replace('.', '_')}"
                    result = subprocess.run(
                        ['netsh', 'advfirewall', 'firewall', 'add', 'rule',
                         f'name={rule_name}', 'dir=in', 'action=block',
                         f'remoteip={ip}'],
                        capture_output=True, text=True, timeout=5
                    )
                    if result.returncode == 0:
                        success = True
                        method = "Windows Firewall"
                except:
                    pass
            
            if success:
                self.results["banned_ips"].append({
                    "ip": ip,
                    "failed_attempts": ip_info["failed_attempts"],
                    "method": method,
                    "timestamp": datetime.now().isoformat()
                })
    
    def _generate_recommendations(self):
        """Generate security recommendations"""
        
        # Count issues by severity
        high_severity = sum(1 for issue in self.results["config_issues"] if issue["severity"] == "high")
        medium_severity = sum(1 for issue in self.results["config_issues"] if issue["severity"] == "medium")
        
        if high_severity > 0:
            self.results["recommendations"].append(
                f"Found {high_severity} high-severity configuration issue(s). Immediate action required."
            )
        
        if medium_severity > 0:
            self.results["recommendations"].append(
                f"Found {medium_severity} medium-severity issue(s). Should be addressed soon."
            )
        
        if self.results["banned_ips"]:
            self.results["recommendations"].append(
                f"Automatically banned {len(self.results['banned_ips'])} suspicious IP(s) due to brute force attacks."
            )
        
        if not self.results["config_issues"] and not self.results["banned_ips"]:
            self.results["recommendations"].append(
                "No critical security issues found. System appears to be properly configured."
            )


def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print(json.dumps({
            "usage": "python security_audit.py [--help]",
            "description": "Performs comprehensive security audit including config checks and log analysis"
        }))
        return
    
    auditor = SecurityAuditor()
    result = auditor.audit_all()
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()



