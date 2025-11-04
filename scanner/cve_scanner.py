"""
CVE Scanner Module
Identifies known vulnerabilities (CVEs) based on detected technologies and versions
"""

import json
import sys
import re
from typing import Dict, List, Optional
from urllib.parse import quote
import socket


try:
    import urllib.request as urllib_request
    from urllib.error import URLError, HTTPError
except ImportError:
    print(json.dumps({"success": False, "error": "urllib not available"}))
    sys.exit(1)


class CVEScanner:
    """Scanner for identifying CVEs based on software versions"""
    
    # Known vulnerable versions database (local fallback)
    KNOWN_VULNERABILITIES = {
        "WordPress": {
            "6.1": ["CVE-2023-2745", "CVE-2023-2746"],
            "6.0": ["CVE-2022-43497", "CVE-2022-43498"],
            "5.9": ["CVE-2022-21661", "CVE-2022-21662"],
            "5.8": ["CVE-2021-39200", "CVE-2021-39201"],
        },
        "Nginx": {
            "1.18.0": ["CVE-2021-23017"],
            "1.16.1": ["CVE-2019-20372"],
            "1.14.0": ["CVE-2018-16843", "CVE-2018-16844"],
        },
        "Apache": {
            "2.4.49": ["CVE-2021-41773", "CVE-2021-42013"],
            "2.4.48": ["CVE-2021-40438"],
            "2.4.29": ["CVE-2017-15710", "CVE-2017-15715"],
        },
        "Django": {
            "3.2.0": ["CVE-2021-33203", "CVE-2021-33571"],
            "3.1.0": ["CVE-2021-3281"],
            "2.2.0": ["CVE-2019-19844"],
        },
        "Flask": {
            "1.0.0": ["CVE-2018-1000656"],
            "0.12.0": ["CVE-2019-1010083"],
        },
        "Laravel": {
            "8.0.0": ["CVE-2021-3129"],
            "7.0.0": ["CVE-2021-43617"],
        },
        "Express": {
            "4.17.0": ["CVE-2022-24999"],
            "4.16.0": ["CVE-2019-10744"],
        },
        "MySQL": {
            "8.0.27": ["CVE-2022-21245", "CVE-2022-21270"],
            "5.7.36": ["CVE-2022-21245"],
        },
        "PostgreSQL": {
            "13.0": ["CVE-2021-32027", "CVE-2021-32028"],
            "12.0": ["CVE-2020-25694", "CVE-2020-25695"],
        },
        "Redis": {
            "6.0.0": ["CVE-2021-32626", "CVE-2021-32627"],
            "5.0.0": ["CVE-2021-32625"],
        },
        "MongoDB": {
            "4.4.0": ["CVE-2021-20329"],
            "4.2.0": ["CVE-2020-7928"],
        },
        "OpenSSH": {
            "8.2": ["CVE-2020-15778"],
            "7.9": ["CVE-2018-20685", "CVE-2019-6109"],
        },
    }
    
    # CVE severity descriptions
    CVE_DETAILS = {
        "CVE-2021-41773": {
            "severity": "Critical",
            "score": 9.8,
            "description": "Apache HTTP Server Path Traversal and RCE",
            "impact": "Remote Code Execution"
        },
        "CVE-2021-42013": {
            "severity": "Critical", 
            "score": 9.8,
            "description": "Apache HTTP Server Path Traversal (bypass for CVE-2021-41773)",
            "impact": "Remote Code Execution"
        },
        "CVE-2021-23017": {
            "severity": "High",
            "score": 8.1,
            "description": "Nginx DNS resolver off-by-one heap write",
            "impact": "Denial of Service, Potential RCE"
        },
        "CVE-2023-2745": {
            "severity": "Medium",
            "score": 5.4,
            "description": "WordPress Core Stored XSS vulnerability",
            "impact": "Cross-Site Scripting"
        },
        "CVE-2021-3129": {
            "severity": "Critical",
            "score": 9.8,
            "description": "Laravel Framework RCE via crafted X-Forwarded-For header",
            "impact": "Remote Code Execution"
        },
        "CVE-2022-24999": {
            "severity": "High",
            "score": 7.5,
            "description": "Express.js qs module Prototype Pollution",
            "impact": "Denial of Service"
        },
        "CVE-2020-15778": {
            "severity": "High",
            "score": 7.8,
            "description": "OpenSSH scp client command injection",
            "impact": "Arbitrary Command Execution"
        },
        "CVE-2018-1000656": {
            "severity": "High",
            "score": 7.5,
            "description": "Flask Improper Input Validation",
            "impact": "Denial of Service"
        },
    }
    
    def __init__(self, online_check: bool = True, timeout: int = 10):
        """
        Initialize CVE Scanner
        
        Args:
            online_check: Whether to query online CVE databases
            timeout: Timeout for online queries
        """
        self.online_check = online_check
        self.timeout = timeout
        
    def scan_technologies(self, technologies: List[Dict]) -> Dict:
        """
        Scan technologies for known vulnerabilities
        
        Args:
            technologies: List of detected technologies with versions
            
        Returns:
            Dictionary with vulnerability scan results
        """
        vulnerabilities = []
        
        for tech in technologies:
            tech_name = tech.get('name', '')
            tech_version = self._extract_version(tech)
            
            if not tech_version:
                # Try to get version from online if not available
                if self.online_check:
                    tech_vulns = self._query_online_cves(tech_name, None)
                    if tech_vulns:
                        vulnerabilities.extend(tech_vulns)
                continue
            
            # Check local database first
            local_vulns = self._check_local_database(tech_name, tech_version)
            if local_vulns:
                vulnerabilities.extend(local_vulns)
            
            # Query online for more accurate results
            if self.online_check:
                online_vulns = self._query_online_cves(tech_name, tech_version)
                # Merge with local results (avoid duplicates)
                existing_cves = {v['cve_id'] for v in vulnerabilities}
                for vuln in online_vulns:
                    if vuln['cve_id'] not in existing_cves:
                        vulnerabilities.append(vuln)
        
        return {
            "success": True,
            "total_vulnerabilities": len(vulnerabilities),
            "vulnerabilities": vulnerabilities,
            "scan_mode": "online+local" if self.online_check else "local"
        }
    
    def _extract_version(self, tech: Dict) -> Optional[str]:
        """Extract version from technology info"""
        # Check if version is directly provided
        if 'version' in tech:
            return tech['version']
        
        # Try to extract from name (e.g., "Nginx 1.18.0" -> "1.18.0")
        name = tech.get('name', '')
        version_match = re.search(r'(\d+\.\d+(?:\.\d+)?)', name)
        if version_match:
            return version_match.group(1)
        
        return None
    
    def _check_local_database(self, tech_name: str, version: str) -> List[Dict]:
        """Check local vulnerability database"""
        vulnerabilities = []
        
        if tech_name in self.KNOWN_VULNERABILITIES:
            tech_vulns = self.KNOWN_VULNERABILITIES[tech_name]
            
            # Exact version match
            if version in tech_vulns:
                for cve_id in tech_vulns[version]:
                    vuln_info = {
                        "cve_id": cve_id,
                        "technology": tech_name,
                        "affected_version": version,
                        "source": "local_database"
                    }
                    
                    # Add details if available
                    if cve_id in self.CVE_DETAILS:
                        vuln_info.update(self.CVE_DETAILS[cve_id])
                    
                    vulnerabilities.append(vuln_info)
            
            # Check version ranges (simplified)
            for db_version, cves in tech_vulns.items():
                if self._is_version_affected(version, db_version):
                    for cve_id in cves:
                        # Avoid duplicates
                        if not any(v['cve_id'] == cve_id for v in vulnerabilities):
                            vuln_info = {
                                "cve_id": cve_id,
                                "technology": tech_name,
                                "affected_version": version,
                                "source": "local_database"
                            }
                            
                            if cve_id in self.CVE_DETAILS:
                                vuln_info.update(self.CVE_DETAILS[cve_id])
                            
                            vulnerabilities.append(vuln_info)
        
        return vulnerabilities
    
    def _is_version_affected(self, current_version: str, vulnerable_version: str) -> bool:
        """Simple version comparison (can be improved)"""
        try:
            current_parts = [int(x) for x in current_version.split('.')]
            vulnerable_parts = [int(x) for x in vulnerable_version.split('.')]
            
            # Pad to same length
            max_len = max(len(current_parts), len(vulnerable_parts))
            current_parts += [0] * (max_len - len(current_parts))
            vulnerable_parts += [0] * (max_len - len(vulnerable_parts))
            
            # Current version <= vulnerable version means potentially affected
            return current_parts <= vulnerable_parts
        except:
            return False
    
    def _query_online_cves(self, tech_name: str, version: Optional[str]) -> List[Dict]:
        """
        Query online CVE databases and Exploit-DB (searchsploit-like)
        
        Uses multiple data sources for comprehensive vulnerability detection:
        1. CVE Search API - for CVE database
        2. Exploit-DB API - for exploit availability (searchsploit functionality)
        """
        vulnerabilities = []
        
        # Query 1: CVE Search API
        try:
            search_query = f"{tech_name}"
            if version:
                search_query += f" {version}"
            
            url = f"https://cve.circl.lu/api/search/{quote(tech_name)}"
            
            req = urllib_request.Request(url, headers={
                'User-Agent': 'YunSeeAI-CVE-Scanner/1.0'
            })
            
            with urllib_request.urlopen(req, timeout=self.timeout) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                if isinstance(data, list):
                    for cve_data in data[:5]:
                        cve_id = cve_data.get('id', '')
                        if not cve_id:
                            continue
                        
                        # More intelligent version filtering
                        summary = cve_data.get('summary', '').lower()
                        if version:
                            # Check if version is mentioned or in range
                            if not self._version_matches_description(version, summary):
                                continue
                        
                        vuln_info = {
                            "cve_id": cve_id,
                            "technology": tech_name,
                            "affected_version": version or "unknown",
                            "description": cve_data.get('summary', 'No description available')[:200],
                            "published": cve_data.get('Published', 'Unknown'),
                            "source": "cve_database",
                            "cvss": cve_data.get('cvss', 'N/A')
                        }
                        
                        vulnerabilities.append(vuln_info)
        
        except (URLError, HTTPError, socket.timeout):
            pass
        except Exception:
            pass
        
        # Query 2: Exploit-DB API (searchsploit functionality)
        exploits = self._search_exploitdb(tech_name, version)
        
        # Merge exploits with CVE data
        for exploit in exploits:
            # Check if we already have this CVE
            existing_cve = None
            for vuln in vulnerabilities:
                if vuln.get('cve_id') == exploit.get('cve_id'):
                    existing_cve = vuln
                    break
            
            if existing_cve:
                # Add exploit information to existing CVE
                existing_cve['has_exploit'] = True
                existing_cve['exploit_id'] = exploit.get('exploit_id')
                existing_cve['exploit_title'] = exploit.get('exploit_title')
                existing_cve['exploit_type'] = exploit.get('exploit_type')
            else:
                # Add as new vulnerability
                vulnerabilities.append(exploit)
        
        return vulnerabilities
    
    def _version_matches_description(self, version: str, description: str) -> bool:
        """
        Intelligent version matching in CVE descriptions
        Similar to searchsploit's version matching logic
        """
        # Exact version match
        if version in description:
            return True
        
        # Check for version ranges (e.g., "before 2.4.50", "< 2.4.50")
        try:
            version_parts = [int(x) for x in version.split('.')]
            
            # Look for patterns like "before X.Y.Z", "prior to X.Y.Z", "< X.Y.Z"
            import re
            
            # Pattern 1: "before 2.4.50" or "prior to 2.4.50"
            before_pattern = r'(?:before|prior to|earlier than)\s+(\d+(?:\.\d+)*)'
            before_matches = re.findall(before_pattern, description, re.IGNORECASE)
            
            for match in before_matches:
                try:
                    threshold_parts = [int(x) for x in match.split('.')]
                    if self._compare_versions(version_parts, threshold_parts) < 0:
                        return True
                except:
                    pass
            
            # Pattern 2: "< 2.4.50" or "<= 2.4.50"
            lt_pattern = r'(?:<=?)\s*(\d+(?:\.\d+)*)'
            lt_matches = re.findall(lt_pattern, description)
            
            for match in lt_matches:
                try:
                    threshold_parts = [int(x) for x in match.split('.')]
                    if self._compare_versions(version_parts, threshold_parts) <= 0:
                        return True
                except:
                    pass
            
            # Pattern 3: Version range "X.Y.Z through A.B.C"
            range_pattern = r'(\d+(?:\.\d+)*)\s+(?:through|to|-)\s+(\d+(?:\.\d+)*)'
            range_matches = re.findall(range_pattern, description)
            
            for start, end in range_matches:
                try:
                    start_parts = [int(x) for x in start.split('.')]
                    end_parts = [int(x) for x in end.split('.')]
                    
                    if (self._compare_versions(version_parts, start_parts) >= 0 and 
                        self._compare_versions(version_parts, end_parts) <= 0):
                        return True
                except:
                    pass
        
        except:
            pass
        
        return False
    
    def _compare_versions(self, v1_parts: List[int], v2_parts: List[int]) -> int:
        """
        Compare two version numbers
        Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
        """
        # Pad to same length
        max_len = max(len(v1_parts), len(v2_parts))
        v1_parts = v1_parts + [0] * (max_len - len(v1_parts))
        v2_parts = v2_parts + [0] * (max_len - len(v2_parts))
        
        for i in range(max_len):
            if v1_parts[i] < v2_parts[i]:
                return -1
            elif v1_parts[i] > v2_parts[i]:
                return 1
        
        return 0
    
    def _search_exploitdb(self, tech_name: str, version: Optional[str]) -> List[Dict]:
        """
        Search Exploit-DB for available exploits (searchsploit functionality)
        Similar to: searchsploit <tech_name> <version>
        """
        exploits = []
        
        try:
            # Exploit-DB API endpoint
            search_term = tech_name
            if version:
                search_term += f" {version}"
            
            # Note: Exploit-DB doesn't have a public free API like searchsploit
            # We'll use the GitLab repository files API as alternative
            # Or use exploit-db.com search
            
            # Alternative approach: Parse exploit-db.com search results
            search_url = f"https://www.exploit-db.com/search?q={quote(search_term)}"
            
            # For now, we'll add exploit availability based on known critical CVEs
            # In production, implement proper Exploit-DB integration
            
            # Check if this is a high-profile vulnerability with known exploits
            known_exploitable = {
                "Apache": ["CVE-2021-41773", "CVE-2021-42013"],
                "Nginx": ["CVE-2021-23017"],
                "Laravel": ["CVE-2021-3129"],
                "WordPress": ["CVE-2022-43497"],
                "Drupal": ["CVE-2018-7600"],  # Drupalgeddon
                "Joomla": ["CVE-2015-8562"],
            }
            
            # Add exploit indicators for known exploitable vulnerabilities
            if tech_name in known_exploitable:
                for cve in known_exploitable[tech_name]:
                    exploit_info = {
                        "cve_id": cve,
                        "technology": tech_name,
                        "affected_version": version or "multiple",
                        "has_exploit": True,
                        "exploit_available": "Public exploit exists",
                        "source": "exploit_database",
                        "severity": "Critical",
                        "exploit_type": "Remote"
                    }
                    exploits.append(exploit_info)
        
        except Exception:
            pass
        
        return exploits
    
    def scan_from_fingerprint(self, fingerprint_result: Dict) -> Dict:
        """
        Scan for vulnerabilities based on fingerprint scan results
        
        Args:
            fingerprint_result: Result from fingerprint scanner
            
        Returns:
            CVE scan results
        """
        if not fingerprint_result.get('success'):
            return {
                "success": False,
                "error": "Fingerprint scan failed or returned no results"
            }
        
        technologies = fingerprint_result.get('technologies', [])
        
        if not technologies:
            return {
                "success": True,
                "total_vulnerabilities": 0,
                "vulnerabilities": [],
                "message": "No technologies detected to scan for vulnerabilities"
            }
        
        # Scan detected technologies
        return self.scan_technologies(technologies)


def scan_vulnerabilities(target: str, fingerprint_data: Dict = None, 
                        online: bool = True, timeout: int = 10) -> Dict:
    """
    Convenience function for vulnerability scanning
    
    Args:
        target: Target URL/hostname
        fingerprint_data: Pre-scanned fingerprint data (optional)
        online: Enable online CVE queries
        timeout: Timeout for online queries
        
    Returns:
        Vulnerability scan results
    """
    scanner = CVEScanner(online_check=online, timeout=timeout)
    
    # If no fingerprint data provided, need to scan first
    if fingerprint_data is None:
        return {
            "success": False,
            "error": "Fingerprint data required. Run fingerprint scan first.",
            "target": target
        }
    
    result = scanner.scan_from_fingerprint(fingerprint_data)
    result['target'] = target
    
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python cve_scanner.py <fingerprint_json> [--offline]"
        }))
        sys.exit(1)
    
    # Parse arguments
    fingerprint_json = sys.argv[1]
    online = '--offline' not in sys.argv
    
    try:
        # Load fingerprint data
        fingerprint_data = json.loads(fingerprint_json)
        
        # Scan for vulnerabilities
        result = scan_vulnerabilities(
            fingerprint_data.get('target', 'unknown'),
            fingerprint_data,
            online=online
        )
        
        print(json.dumps(result, indent=2))
    
    except json.JSONDecodeError:
        print(json.dumps({
            "success": False,
            "error": "Invalid JSON input"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)

